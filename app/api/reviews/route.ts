import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  paperId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  score: z.number().min(1).max(5),
  comments: z.string().min(1),
  recommendation: z.enum(['ACCEPT', 'MINOR_REVISION', 'MAJOR_REVISION', 'REJECT']),
  deadline: z.string().datetime(),
});

// POST - Submit a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'REVIEWER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only reviewers can submit reviews' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    // Check if paper exists and is assigned to this reviewer
    const paper = await prisma.paper.findUnique({
      where: { id: validatedData.paperId },
      include: {
        reviews: {
          where: {
            reviewerId: session.user.id
          }
        }
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check if reviewer is assigned to this paper
    const isAssigned = await prisma.reviewAssignment.findFirst({
      where: {
        paperId: validatedData.paperId,
        reviewerId: session.user.id,
        status: 'ASSIGNED'
      }
    });

    if (!isAssigned && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You are not assigned to review this paper' },
        { status: 403 }
      );
    }

    // Check if review already exists
    if (paper.reviews.length > 0) {
      return NextResponse.json(
        { error: 'Review already submitted for this paper' },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        paperId: validatedData.paperId,
        reviewerId: session.user.id,
        score: validatedData.score,
        comments: validatedData.comments,
        recommendation: validatedData.recommendation,
        deadline: new Date(validatedData.deadline),
        submittedAt: new Date()
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            institution: true
          }
        },
        paper: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    // Update review assignment status
    if (isAssigned) {
      await prisma.reviewAssignment.update({
        where: { id: isAssigned.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
    }

    // Check if all reviews are completed and update paper status if needed
    const allAssignments = await prisma.reviewAssignment.findMany({
      where: {
        paperId: validatedData.paperId
      }
    });

    const completedReviews = allAssignments.filter(a => a.status === 'COMPLETED').length;
    const totalAssignments = allAssignments.length;

    // If all reviews are completed, update paper status
    if (completedReviews === totalAssignments && totalAssignments > 0) {
      await prisma.paper.update({
        where: { id: validatedData.paperId },
        data: { status: 'ACCEPTED' }
      });
    }

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: {
        id: review.id,
        score: review.score,
        recommendation: review.recommendation,
        submittedAt: review.submittedAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get reviews (for admin or paper author)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const reviewerId = searchParams.get('reviewerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};

    // Build where clause based on user role and parameters
    if (session.user.role === 'ADMIN') {
      // Admin can see all reviews
      if (paperId) whereClause.paperId = paperId;
      if (reviewerId) whereClause.reviewerId = reviewerId;
      if (status) whereClause.status = status;
    } else if (session.user.role === 'REVIEWER') {
      // Reviewers can only see their own reviews
      whereClause.reviewerId = session.user.id;
      if (paperId) whereClause.paperId = paperId;
    } else {
      // Authors can see reviews for their papers
      const userPapers = await prisma.paper.findMany({
        where: { submitterId: session.user.id },
        select: { id: true }
      });
      
      const paperIds = userPapers.map(p => p.id);
      whereClause.paperId = { in: paperIds };
      
      if (paperId && paperIds.includes(paperId)) {
        whereClause.paperId = paperId;
      }
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: whereClause,
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              institution: true
            }
          },
          paper: {
            select: {
              title: true,
              status: true,
              submitterId: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where: whereClause })
    ]);

    // Filter sensitive information based on user role
    const filteredReviews = reviews.map(review => {
      const baseReview = {
        id: review.id,
        paperId: review.paperId,
        score: review.score,
        recommendation: review.recommendation,
        submittedAt: review.submittedAt,
        paper: {
          title: review.paper.title,
          status: review.paper.status
        }
      };

      // Include detailed information based on permissions
      if (session.user.role === 'ADMIN' || 
          review.reviewerId === session.user.id ||
          review.paper.submitterId === session.user.id) {
        return {
          ...baseReview,
          comments: review.comments,
          reviewer: session.user.role === 'ADMIN' ? review.reviewer : undefined
        };
      }

      return baseReview;
    });

    return NextResponse.json({
      reviews: filteredReviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing review
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'REVIEWER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only reviewers can update reviews' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reviewId, ...updateData } = body;
    
    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const validatedData = reviewSchema.partial().parse(updateData);

    // Check if review exists and belongs to the user
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        paper: {
          select: {
            status: true
          }
        }
      }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.reviewerId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only update your own reviews' },
        { status: 403 }
      );
    }

    // Check if review can still be updated
    if (existingReview.paper.status === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Cannot update review for published papers' },
        { status: 400 }
      );
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...validatedData
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            institution: true
          }
        },
        paper: {
          select: {
            title: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Review updated successfully',
      review: {
        id: updatedReview.id,
        score: updatedReview.score,
        recommendation: updatedReview.recommendation,
        submittedAt: updatedReview.submittedAt
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // submitted, pending
    const paperId = searchParams.get('paperId');
    const reviewerId = searchParams.get('reviewerId');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status === 'submitted') {
      where.submittedAt = { not: null };
    } else if (status === 'pending') {
      where.submittedAt = null;
    }

    if (paperId) {
      where.paperId = paperId;
    }

    if (reviewerId) {
      where.reviewerId = reviewerId;
    }

    // Get reviews with pagination
    const [reviews, totalReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              institution: true
            }
          },
          paper: {
            select: {
              id: true,
              title: true,
              status: true,
              submitter: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          deadline: 'asc'
        }
      }),
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(totalReviews / limit);

    // Format reviews data
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      paperId: review.paperId,
      paperTitle: review.paper.title,
      paperStatus: review.paper.status,
      paperSubmitter: {
        name: `${review.paper.submitter.firstName} ${review.paper.submitter.lastName}`,
        email: review.paper.submitter.email
      },
      reviewer: {
        id: review.reviewer.id,
        name: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
        email: review.reviewer.email,
        institution: review.reviewer.institution
      },
      score: review.score,
      recommendation: review.recommendation,
      comments: review.comments,
      deadline: review.deadline,
      submittedAt: review.submittedAt,
      isSubmitted: !!review.submittedAt,
      isOverdue: new Date() > new Date(review.deadline) && !review.submittedAt
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      totalReviews,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
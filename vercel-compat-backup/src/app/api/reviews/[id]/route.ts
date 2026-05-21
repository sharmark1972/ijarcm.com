import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get a specific review by paper ID (for the current reviewer)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const paperId = params.id;

    // Find the review for this paper by the current user
    const review = await prisma.review.findFirst({
      where: {
        paperId: paperId,
        reviewerId: session.user.id
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
            status: true,
            submitterId: true
          }
        }
      }
    });

    if (!review) {
      // Check if user is assigned to review this paper
      const assignment = await prisma.reviewAssignment.findFirst({
        where: {
          paperId: paperId,
          reviewerId: session.user.id,
          status: 'ASSIGNED'
        }
      });

      if (!assignment && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Review not found or you are not assigned to this paper' },
          { status: 404 }
        );
      }

      // Return null if no review exists yet but user is assigned
      return NextResponse.json(null);
    }

    // Check permissions
    const canView = 
      session.user.role === 'ADMIN' ||
      review.reviewerId === session.user.id ||
      review.paper.submitterId === session.user.id;

    if (!canView) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this review' },
        { status: 403 }
      );
    }

    // Return review data based on permissions
    const reviewData = {
      id: review.id,
      paperId: review.paperId,
      score: review.score,
      comments: review.comments,
      recommendation: review.recommendation,
      submittedAt: review.submittedAt,
      deadline: review.deadline,
      paper: {
        title: review.paper.title,
        status: review.paper.status
      }
    };

    // Include reviewer info only for admin or paper author
    if (session.user.role === 'ADMIN' || review.paper.submitterId === session.user.id) {
      (reviewData as any).reviewer = review.reviewer;
    }

    return NextResponse.json(reviewData);

  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a review (admin only or reviewer before paper is published)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const reviewId = params.id;

    // Find the review
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        paper: {
          select: {
            status: true,
            title: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete = 
      session.user.role === 'ADMIN' ||
      (review.reviewerId === session.user.id && review.paper.status !== 'PUBLISHED');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this review' },
        { status: 403 }
      );
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    // Update review assignment status back to ASSIGNED if it exists
    const assignment = await prisma.reviewAssignment.findFirst({
      where: {
        paperId: review.paperId,
        reviewerId: review.reviewerId
      }
    });

    if (assignment) {
      await prisma.reviewAssignment.update({
        where: { id: assignment.id },
        data: {
          status: 'ASSIGNED',
          completedAt: null
        }
      });
    }

    // Update paper status if needed
    const remainingReviews = await prisma.review.count({
      where: { paperId: review.paperId }
    });

    if (remainingReviews === 0) {
      await prisma.paper.update({
        where: { id: review.paperId },
        data: { status: 'UNDER_REVIEW' }
      });
    }

    return NextResponse.json({
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
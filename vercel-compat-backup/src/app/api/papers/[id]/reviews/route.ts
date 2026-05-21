import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const paperId = params.id;

    const reviews = await prisma.review.findMany({
      where: {
        paperId: paperId,
        submittedAt: { not: null }
      },
      select: {
        id: true,
        score: true,
        comments: true,
        submittedAt: true,
        reviewer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.score || 0,
      comment: review.comments || '',
      reviewerName: `${review.reviewer.firstName} ${review.reviewer.lastName}`,
      createdAt: review.submittedAt?.toISOString().split('T')[0] || '',
      isHelpful: true // Default to true for now
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;
    const { rating, comment } = await request.json();

    // Check if user already reviewed this paper
    const existingReview = await prisma.review.findFirst({
      where: {
        paperId: paperId,
        reviewerId: session.user.id
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this paper' },
        { status: 400 }
      );
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        paperId: paperId,
        reviewerId: session.user.id,
        score: rating,
        comments: comment,
        recommendation: 'ACCEPT', // Default recommendation
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        submittedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
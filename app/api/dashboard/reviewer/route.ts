import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get reviewer statistics
    const [totalAssigned, completedReviews, pendingReviews, averageRating, assignedPapers, recentReviews] = await Promise.all([
      // Count total assigned reviews
      prisma.review.count({
        where: {
          reviewerId: userId
        }
      }),
      
      // Count completed reviews
      prisma.review.count({
        where: {
          reviewerId: userId,
          submittedAt: { not: null }
        }
      }),
      
      // Count pending reviews
      prisma.review.count({
        where: {
          reviewerId: userId,
          submittedAt: null
        }
      }),
      
      // Calculate average score given by reviewer
      prisma.review.aggregate({
        where: {
          reviewerId: userId,
          score: { not: null }
        },
        _avg: {
          score: true
        }
      }).then(result => result._avg.score || 0),
      
      // Get assigned papers for review
      prisma.review.findMany({
        where: {
          reviewerId: userId,
          submittedAt: null
        },
        select: {
          id: true,
          deadline: true,
          paper: {
            select: {
              id: true,
              title: true,
              submitter: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          deadline: 'asc'
        },
        take: 10
      }),
      
      // Get recent completed reviews
      prisma.review.findMany({
        where: {
          reviewerId: userId,
          submittedAt: { not: null }
        },
        select: {
          id: true,
          submittedAt: true,
          recommendation: true,
          score: true,
          paper: {
            select: {
              id: true,
              title: true,
              submitter: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 5
      })
    ]);

    return NextResponse.json({
      totalAssigned,
      completedReviews,
      pendingReviews,
      averageScore: averageRating,
      assignedPapers: assignedPapers.map(review => ({
        id: review.id,
        paperId: review.paper.id,
        title: review.paper.title,
        author: `${review.paper.submitter.firstName} ${review.paper.submitter.lastName}`,
        deadline: review.deadline
      })),
      recentReviews: recentReviews.map(review => ({
        id: review.id,
        paperId: review.paper.id,
        title: review.paper.title,
        author: `${review.paper.submitter.firstName} ${review.paper.submitter.lastName}`,
        submittedAt: review.submittedAt,
        recommendation: review.recommendation,
        score: review.score
      }))
    });
  } catch (error) {
    console.error('Error fetching reviewer dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
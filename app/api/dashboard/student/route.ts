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

    // Get user's papers with statistics
    const [totalSubmissions, publishedPapers, underReview, totalDownloads, myPapers] = await Promise.all([
      // Count total submissions by user
      prisma.paper.count({
        where: {
          submitterId: userId
        }
      }),
      
      // Count published papers by user
      prisma.paper.count({
        where: {
          submitterId: userId,
          status: 'PUBLISHED'
        }
      }),
      
      // Count papers under review by user
      prisma.paper.count({
        where: {
          submitterId: userId,
          status: 'UNDER_REVIEW'
        }
      }),
      
      // Sum downloads for user's published papers
      prisma.download.count({
        where: {
          paper: {
            submitterId: userId,
            status: 'PUBLISHED'
          }
        }
      }),
      
      // Get user's papers with details
      prisma.paper.findMany({
        where: {
          submitterId: userId
        },
        include: {
          _count: {
            select: {
              downloads: true
            }
          },
          reviews: {
            select: {
              comments: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        }
      })
    ]);

    // Format papers data
    const formattedPapers = myPapers.map(paper => ({
      id: paper.id,
      title: paper.title,
      status: paper.status,
      submittedAt: paper.submittedAt,
      downloadCount: paper._count.downloads || 0,
      reviewComments: paper.reviews[0]?.comments || undefined
    }));

    return NextResponse.json({
      totalSubmissions,
      publishedPapers,
      underReview,
      totalDownloads,
      myPapers: formattedPapers
    });
  } catch (error) {
    console.error('Error fetching student dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
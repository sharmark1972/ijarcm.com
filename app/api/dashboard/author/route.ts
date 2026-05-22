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

    // Get author statistics
    const [totalPapers, publishedPapers, totalDownloads, totalCitations, papers, recentActivity] = await Promise.all([
      // Count total papers by author
      prisma.paper.count({
        where: {
          submitterId: userId
        }
      }),
      
      // Count published papers
      prisma.paper.count({
        where: {
          submitterId: userId,
          status: 'PUBLISHED'
        }
      }),
      
      // Calculate total downloads for author's papers
      prisma.download.count({
        where: {
          paper: {
            submitterId: userId
          }
        }
      }),
      
      // For now, we'll use a placeholder for citations since we don't have a citations table
      // In a real implementation, you would have a citations table or external API
      Promise.resolve(0),
      
      // Get author's papers with download counts
      prisma.paper.findMany({
        where: {
          submitterId: userId
        },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          submittedAt: true,
          _count: {
            select: {
              downloads: true
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 10
      }),
      
      // Get recent activity (paper submissions, status changes, etc.)
      prisma.paper.findMany({
        where: {
          submitterId: userId
        },
        select: {
          id: true,
          title: true,
          status: true,
          submittedAt: true,
          publishedAt: true
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 10
      })
    ]);

    // Format papers with calculated data
    const formattedPapers = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      category: paper.category || 'General',
      status: paper.status,
      downloads: paper._count.downloads,
      citations: 0, // Placeholder - would come from citations table/API
      submittedAt: paper.submittedAt.toISOString()
    }));

    // Format recent activity
    const formattedRecentActivity = recentActivity.map(paper => {
      let description = '';
      let date = paper.submittedAt;
      
      if (paper.status === 'PUBLISHED' && paper.publishedAt) {
        description = `Paper "${paper.title}" was published`;
        date = paper.publishedAt;
      } else if (paper.status === 'ACCEPTED') {
        description = `Paper "${paper.title}" was accepted for publication`;
      } else if (paper.status === 'UNDER_REVIEW') {
        description = `Paper "${paper.title}" is under review`;
      } else if (paper.status === 'SUBMITTED') {
        description = `Paper "${paper.title}" was submitted`;
      } else if (paper.status === 'REJECTED') {
        description = `Paper "${paper.title}" was rejected`;
      } else {
        description = `Paper "${paper.title}" status updated to ${paper.status}`;
      }
      
      return {
        id: paper.id,
        type: paper.status.toLowerCase(),
        description: description.length > 100 ? description.substring(0, 97) + '...' : description,
        date: date.toISOString()
      };
    });

    return NextResponse.json({
      totalPapers,
      publishedPapers,
      totalDownloads,
      totalCitations,
      papers: formattedPapers,
      recentActivity: formattedRecentActivity
    });
  } catch (error) {
    console.error('Error fetching author dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
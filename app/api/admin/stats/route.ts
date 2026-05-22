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

    // Get all stats in parallel
    const [userStats, paperStats, reviewStats, conferenceStats, recentActivity] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      
      // Paper statistics
      prisma.paper.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      
      // Review statistics
      prisma.review.aggregate({
        _count: { id: true },
        _avg: { score: true },
      }),
      
      // Conference statistics
      prisma.conference.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      
      // Recent activity (last 10 activities)
      Promise.all([
        // Recent users
        prisma.user.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        }),
        
        // Recent papers
        prisma.paper.findMany({
          take: 5,
          orderBy: { submittedAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            submittedAt: true,
            submitter: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
        
        // Recent reviews
        prisma.review.findMany({
          take: 5,
          orderBy: { submittedAt: 'desc' },
          where: {
            submittedAt: {
              not: null
            }
          },
          select: {
            id: true,
            score: true,
            submittedAt: true,
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            paper: {
              select: {
                title: true,
              },
            },
          },
        }),
      ]),
    ]);

    // Process user stats
    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count.id, 0);
    // Note: User model doesn't have isBanned/isWarned fields
    const bannedUsers = 0;
    const warnedUsers = 0;
    const activeUsers = totalUsers;
    
    const usersByRole = userStats.reduce((acc, stat) => {
      acc[stat.role] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Process paper stats
    const totalPapers = paperStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const papersByStatus = paperStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Process review stats
    const totalReviews = reviewStats._count.id;
    const averageRating = reviewStats._avg.score || 0;

    // Process conference stats
    const totalConferences = conferenceStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const conferencesByStatus = conferenceStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Calculate downloads
    const totalDownloads = await prisma.download.count();

    // Process recent activity
    const [recentUsers, recentPapers, recentReviews] = recentActivity;
    
    const activities = [
      ...recentUsers.map(user => ({
        id: `user-${user.id}`,
        type: 'user_registered',
        description: `${user.firstName} ${user.lastName} registered as ${user.role}`,
        timestamp: user.createdAt,
        user: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        },
      })),
      ...recentPapers.map(paper => ({
        id: `paper-${paper.id}`,
        type: 'paper_submitted',
        description: `New paper "${paper.title}" submitted`,
        timestamp: paper.submittedAt,
        user: {
          name: paper.submitter ? `${paper.submitter.firstName} ${paper.submitter.lastName}` : 'Unknown User',
        },
        metadata: {
          status: paper.status,
        },
      })),
      ...recentReviews.map(review => ({
        id: `review-${review.id}`,
        type: 'review_submitted',
        description: `Review submitted for "${review.paper.title}" (Score: ${review.score}/5)`,
        timestamp: review.submittedAt,
        user: {
          name: review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastName}` : 'Unknown Reviewer',
        },
        metadata: {
          score: review.score,
        },
      })),
    ].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    }).slice(0, 10);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPapers,
        totalReviews,
        totalConferences,
        totalDownloads: totalDownloads,
        activeUsers,
        bannedUsers,
        warnedUsers,
        averageRating: Math.round(averageRating * 100) / 100,
      },
      usersByRole,
      papersByStatus,
      conferencesByStatus,
      recentActivity: activities,
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
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
    const timeRange = searchParams.get('range') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get analytics data
    const [userGrowth, paperSubmissions, reviewActivity, downloadStats, conferenceStats] = await Promise.all([
      // User registration growth
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: { id: true },
        where: {
          createdAt: {
            gte: startDate
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      
      // Paper submission trends
      prisma.paper.groupBy({
        by: ['submittedAt', 'status'],
        _count: { id: true },
        where: {
          submittedAt: {
            gte: startDate
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      }),
      
      // Review activity
      prisma.review.groupBy({
        by: ['submittedAt'],
        _count: { id: true },
        where: {
          submittedAt: {
            gte: startDate,
            not: null
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      }),
      
      // Download statistics
      prisma.download.groupBy({
        by: ['downloadedAt'],
        _count: { id: true },
        where: {
          downloadedAt: {
            gte: startDate
          }
        },
        orderBy: {
          downloadedAt: 'asc'
        }
      }),
      
      // Conference statistics
      prisma.conference.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    // Process data for charts
    const processTimeSeriesData = (data: any[], dateField: string) => {
      const dailyData = new Map();
      
      // Initialize all days in range with 0
      for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dailyData.set(dateKey, 0);
      }
      
      // Fill in actual data
      data.forEach(item => {
        const date = new Date(item[dateField]);
        const dateKey = date.toISOString().split('T')[0];
        dailyData.set(dateKey, (dailyData.get(dateKey) || 0) + item._count.id);
      });
      
      return Array.from(dailyData.entries()).map(([date, count]) => ({
        date,
        count
      }));
    };

    // Get top performing papers
    const topPapers = await prisma.paper.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        submittedAt: true,
        _count: {
          select: {
            downloads: true,
            reviews: true
          }
        },
        submitter: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        downloads: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Get reviewer performance
    const reviewerStats = await prisma.review.groupBy({
      by: ['reviewerId'],
      _count: { id: true },
      _avg: { score: true },
      where: {
        submittedAt: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    });

    // Get reviewer details
    const reviewerIds = reviewerStats.map(stat => stat.reviewerId);
    const reviewers = await prisma.user.findMany({
      where: {
        id: {
          in: reviewerIds
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        institution: true
      }
    });

    const topReviewers = reviewerStats.map(stat => {
      const reviewer = reviewers.find(r => r.id === stat.reviewerId);
      return {
        id: stat.reviewerId,
        name: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown',
        institution: reviewer?.institution || '',
        reviewCount: stat._count.id,
        averageScore: Math.round((stat._avg.score || 0) * 100) / 100
      };
    });

    // Get visitor analytics data
    const endDate = new Date();
    const [totalVisitors, uniqueVisitors, visitorGrowthData, countryStats, pageStats, userAgentData, referrerData] = await Promise.all([
      // Total visitors
      prisma.visitor.count({
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      
      // Unique visitors (by IP)
      prisma.visitor.groupBy({
        by: ['ipAddress'],
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }).then(result => result.length),
      
      // Visitor growth over time
      prisma.visitor.groupBy({
        by: ['visitedAt'],
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
      }),
      
      // Country statistics
      prisma.visitor.groupBy({
        by: ['country', 'countryCode'],
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
          country: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
      
      // Page statistics
      prisma.visitor.groupBy({
        by: ['page'],
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
      
      // User agent data (simplified browser detection)
      prisma.visitor.findMany({
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
          userAgent: {
            not: null,
          },
        },
        select: {
          userAgent: true,
        },
      }),
      
      // Referrer data
      prisma.visitor.groupBy({
        by: ['referer'],
        where: {
          visitedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Process visitor growth data
    const visitorGrowth = processTimeSeriesData(visitorGrowthData.map(item => ({
      date: item.visitedAt.toISOString().split('T')[0],
      count: item._count.id,
    })), timeRange);

    // Process user agent data to extract browser info
    const browserCounts: Record<string, number> = {};
    userAgentData.forEach(visitor => {
      if (visitor.userAgent) {
        let browser = 'Other';
        const ua = visitor.userAgent.toLowerCase();
        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('edge')) browser = 'Edge';
        else if (ua.includes('opera')) browser = 'Opera';
        
        browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      }
    });

    const userAgentStats = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate session statistics (simplified)
    const sessionStats = {
      averageSessionDuration: 180, // 3 minutes average (placeholder)
      bounceRate: 0.35, // 35% bounce rate (placeholder)
      pagesPerSession: 2.5, // 2.5 pages per session (placeholder)
    };

    const visitorData = {
      totalVisitors,
      uniqueVisitors,
      visitorGrowth,
      countryStats: countryStats.map(stat => ({
        country: stat.country,
        countryCode: stat.countryCode,
        count: stat._count.id,
      })),
      pageStats: pageStats.map(stat => ({
        page: stat.page,
        count: stat._count.id,
      })),
      userAgentStats,
      referrerStats: referrerData.map(stat => ({
        referrer: stat.referer || 'direct',
        count: stat._count.id,
      })),
      sessionStats,
    };

    return NextResponse.json({
      timeRange: parseInt(timeRange),
      userGrowth: processTimeSeriesData(userGrowth, 'createdAt'),
      paperSubmissions: processTimeSeriesData(paperSubmissions, 'submittedAt'),
      reviewActivity: processTimeSeriesData(reviewActivity, 'submittedAt'),
      downloadActivity: processTimeSeriesData(downloadStats, 'downloadedAt'),
      conferenceStats: conferenceStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      topPapers: topPapers.map(paper => ({
        id: paper.id,
        title: paper.title,
        status: paper.status,
        submittedAt: paper.submittedAt,
        downloadCount: paper._count.downloads,
        reviewCount: paper._count.reviews,
        submitter: `${paper.submitter.firstName} ${paper.submitter.lastName}`
      })),
      topReviewers,
      visitorData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
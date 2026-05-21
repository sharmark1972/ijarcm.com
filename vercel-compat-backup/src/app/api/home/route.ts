import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch real statistics from the database
    const [
      totalPapers,
      totalAuthors,
      totalDownloads,
      totalReviews,
      completedReviewAssignments,
      latestPapersData,
      latestIssueData,
      upcomingIssueData
    ] = await Promise.all([
      // Count published papers
      prisma.paper.count({
        where: {
          status: 'PUBLISHED'
        }
      }),
      
      // Count unique authors (users who have authored papers)
      prisma.paperAuthor.findMany({
        select: {
          userId: true
        },
        distinct: ['userId']
      }).then(authors => authors.length),
      
      // Count total downloads
      prisma.download.count(),
      
      // Count completed reviews (with submittedAt)
      prisma.review.count({
        where: {
          submittedAt: {
            not: null
          }
        }
      }),
      
      // Count completed review assignments (as alternative review count)
      prisma.reviewAssignment.count({
        where: {
          status: 'COMPLETED'
        }
      }),
      
      // Get latest 6 published papers with issue details
      prisma.paper.findMany({
        where: {
          status: 'PUBLISHED'
        },
        include: {
          paperAuthors: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          issue: {
            select: {
              id: true,
              title: true,
              volume: true,
              issueNumber: true,
              year: true,
              publishDate: true
            }
          },
          downloads: true
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: 6
      }),

      // Get latest published issue
      prisma.issue.findFirst({
        where: {
          isPublished: true
        },
        orderBy: [
          { year: 'desc' },
          { volume: 'desc' },
          { issueNumber: 'desc' }
        ],
        select: {
          id: true,
          title: true,
          description: true,
          volume: true,
          issueNumber: true,
          year: true,
          publishDate: true,
          coverImage: true,
          _count: {
            select: {
              papers: true
            }
          }
        }
      }),

      // Get upcoming issue (not published yet, with future publish date)
      prisma.issue.findFirst({
        where: {
          isPublished: false,
          publishDate: {
            gte: new Date()
          }
        },
        orderBy: {
          publishDate: 'asc'
        },
        select: {
          id: true,
          title: true,
          description: true,
          volume: true,
          issueNumber: true,
          year: true,
          publishDate: true,
          coverImage: true,
          _count: {
            select: {
              papers: true
            }
          }
        }
      })
    ]);

    // Fetch current impact factor
    let currentImpactFactor = null;
    try {
      currentImpactFactor = await (prisma as any).impactFactor.findFirst({
        where: {
          isActive: true
        },
        orderBy: {
          year: 'desc'
        },
        select: {
          year: true,
          value: true,
          certificatePath: true,
          createdAt: true
        }
      });
    } catch (error) {
      console.error('Error fetching impact factor:', error);
      // Continue without impact factor if there's an error
    }

    // Use the higher of reviews or completed assignments
    const totalPeerReviews = Math.max(totalReviews, completedReviewAssignments);

    // Format the latest papers data
    const latestPapers = latestPapersData.map(paper => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.paperAuthors.map(author => 
        `${author.user.firstName} ${author.user.lastName}`
      ),
      publishedAt: paper.publishedAt || paper.submittedAt,
      downloads: paper.downloads.length,
      category: paper.category || 'General'
    }));

    // Format latest issue
    const latestIssue = latestIssueData ? {
      id: latestIssueData.id,
      title: latestIssueData.title,
      description: latestIssueData.description,
      volume: latestIssueData.volume,
      issue: latestIssueData.issueNumber,
      year: latestIssueData.year,
      publicationDate: latestIssueData.publishDate.toISOString(),
      coverImage: latestIssueData.coverImage,
      paperCount: latestIssueData._count.papers
    } : null;

    // Format upcoming issue
    const upcomingIssue = upcomingIssueData ? {
      id: upcomingIssueData.id,
      title: upcomingIssueData.title,
      description: upcomingIssueData.description,
      volume: upcomingIssueData.volume,
      issue: upcomingIssueData.issueNumber,
      year: upcomingIssueData.year,
      publicationDate: upcomingIssueData.publishDate.toISOString(),
      coverImage: upcomingIssueData.coverImage,
      paperCount: upcomingIssueData._count.papers
    } : null;

    return NextResponse.json({
      stats: {
        totalPapers,
        totalAuthors,
        totalDownloads,
        totalReviews: totalPeerReviews
      },
      latestPapers,
      latestIssue,
      upcomingIssue,
      currentImpactFactor
    });
  } catch (error) {
    console.error('Error fetching home data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch home data' },
      { status: 500 }
    );
  }
}

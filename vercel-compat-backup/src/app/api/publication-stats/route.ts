import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch publication statistics from the database
    const [
      totalPublishedIssues,
      totalResearchPapers,
      papersWithIssue,
      papersWithoutIssue,
      issuesByYear
    ] = await Promise.all([
      // Count published issues
      prisma.issue.count({
        where: {
          isPublished: true
        }
      }),

      // Count published research papers (all published papers, regardless of issue assignment)
      prisma.paper.count({
        where: {
          status: 'PUBLISHED'
        }
      }),

      // Get papers by their assigned issue's year (only papers with issue)
      prisma.paper.findMany({
        where: {
          status: 'PUBLISHED',
          issueId: {
            not: null
          }
        },
        select: {
          issue: {
            select: {
              year: true
            }
          }
        }
      }),

      // Get all published papers without issue for year calculation
      prisma.paper.findMany({
        where: {
          status: 'PUBLISHED',
          issueId: null,
          publishedAt: {
            not: null
          }
        },
        select: {
          publishedAt: true
        }
      }),

      // Get issues by year
      prisma.issue.groupBy({
        by: ['year'],
        where: {
          isPublished: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Extract unique publication years from papers and issues
    const paperYears = new Set<number>();
    papersWithIssue.forEach(item => {
      if (item.issue?.year) {
        paperYears.add(item.issue.year);
      }
    });
    papersWithoutIssue.forEach(item => {
      if (item.publishedAt) {
        paperYears.add(item.publishedAt.getFullYear());
      }
    });

    const issueYears = new Set<number>();
    issuesByYear.forEach(item => {
      issueYears.add(item.year);
    });

    // Combine and sort years
    const allYears = new Set([...paperYears, ...issueYears]);
    const publicationYears = Array.from(allYears).sort((a, b) => a - b);

    // Get papers count per year (based on issue's year or publishedAt)
    const papersPerYear: Record<number, number> = {};
    papersWithIssue.forEach(item => {
      if (item.issue?.year) {
        papersPerYear[item.issue.year] = (papersPerYear[item.issue.year] || 0) + 1;
      }
    });
    papersWithoutIssue.forEach(item => {
      if (item.publishedAt) {
        const year = item.publishedAt.getFullYear();
        papersPerYear[year] = (papersPerYear[year] || 0) + 1;
      }
    });

    // Get issues count per year
    const issuesPerYear: Record<number, number> = {};
    issuesByYear.forEach(item => {
      issuesPerYear[item.year] = item._count.id;
    });

    return NextResponse.json({
      totalPublishedIssues,
      totalResearchPapers,
      publicationYears,
      papersPerYear,
      issuesPerYear
    });
  } catch (error) {
    console.error('Error fetching publication statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch publication statistics' },
      { status: 500 }
    );
  }
}

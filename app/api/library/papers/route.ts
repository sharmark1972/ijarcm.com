import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const author = searchParams.get('author') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause for filtering
    // Using `as any` here to allow flexible Prisma filter building
    const where: Record<string, unknown> = {
      status: 'PUBLISHED'
    } as Record<string, unknown>;

    // Search query filter
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { abstract: { contains: query } },
        { keywords: { contains: query } },
        {
          paperAuthors: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: query } },
                  { lastName: { contains: query } }
                ]
              }
            }
          }
        }
      ];
    }

    // Category filter
    if (category && category !== 'All Categories' && category !== 'All+Categories') {
      where.category = { contains: category };
    }

    // Author filter
    if (author) {
      where.paperAuthors = {
        some: {
          user: {
            OR: [
              { firstName: { contains: author } },
              { lastName: { contains: author } }
            ]
          }
        }
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.publishedAt = {} as Record<string, Date>;
      if (dateFrom) {
        const publishedAt = where.publishedAt as Record<string, Date>;
        publishedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const publishedAt = where.publishedAt as Record<string, Date>;
        publishedAt.lte = new Date(dateTo);
      }
    }

    // Build orderBy clause - handle multi-field sorting for rating
    let orderBy: Record<string, unknown> | Array<Record<string, unknown>> = {};
    switch (sortBy) {
      case 'date':
        // Use issue.publishDate if available, otherwise paper.publishedAt
        orderBy = [
          { issue: { publishDate: sortOrder === 'desc' ? 'desc' : 'asc' } },
          { publishedAt: sortOrder }
        ];
        break;
      case 'issue':
        // Sort by issue year, volume, and issue number
        orderBy = [
          { issue: { year: sortOrder === 'desc' ? 'desc' : 'asc' } },
          { issue: { volume: sortOrder === 'desc' ? 'desc' : 'asc' } },
          { issue: { issueNumber: sortOrder === 'desc' ? 'desc' : 'asc' } },
          { publishedAt: sortOrder }
        ];
        break;
      case 'downloads':
        orderBy = { downloads: { _count: sortOrder } };
        break;
      case 'title':
        orderBy = { title: sortOrder === 'desc' ? 'desc' : 'asc' };
        break;
      case 'rating':
        // For rating, we need to sort by average review score
        // Prisma doesn't support custom calculation in orderBy directly,
        // so we'll sort by default and apply rating sort in post-processing
        orderBy = [
          { issue: { publishDate: 'desc' } },
          { publishedAt: 'desc' }
        ];
        break;
      default:
        orderBy = [
          { issue: { publishDate: 'desc' } },
          { publishedAt: 'desc' }
        ];
    }

    // Get total count for pagination
    const totalPapers = await prisma.paper.count({ where });

    // Fetch papers with pagination
    const papers = await prisma.paper.findMany({
      where,
      include: {
        paperAuthors: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { authorOrder: 'asc' }
        },
        reviews: {
          where: { submittedAt: { not: null } },
          select: {
            score: true
          }
        },
        _count: {
          select: {
            reviews: {
              where: { submittedAt: { not: null } }
            },
            downloads: true
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
        }
      },
      orderBy: sortBy === 'rating' ? [
        { issue: { publishDate: 'desc' } },
        { publishedAt: 'desc' }
      ] : orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Transform data to match expected format
    const transformedPapers = papers.map((paper) => {
      // Type assertion to handle Prisma include structure
      const paperWithIncludes = paper as Record<string, unknown>;
      
      const paperAuthors = (paperWithIncludes.paperAuthors as Array<{ user: { firstName: string; lastName: string } }>) || [];
      const authorNames = paperAuthors.map((author) =>
        `${author.user.firstName} ${author.user.lastName}`.trim()
      );
      
      const reviews = (paperWithIncludes.reviews as Array<{ score: number | null }>) || [];
      const scores = reviews.map((review) => review.score).filter((score): score is number => score !== null && score !== undefined);
      const averageRating = scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

      // Use issue date if available, otherwise use paper publication date
      const issue = paperWithIncludes.issue as { publishDate?: Date; year?: number } | null;
      const publishedAt = paperWithIncludes.publishedAt as Date;
      
      // For sorting purposes, prioritize issue date over paper date
      let sortDate: Date;
      if (issue?.publishDate) {
        sortDate = issue.publishDate;
      } else if (publishedAt) {
        sortDate = publishedAt;
      } else {
        sortDate = new Date(0); // Earliest possible date as fallback
      }
      
      const displayDate = issue?.publishDate
        ? issue.publishDate.toISOString().split('T')[0]
        : publishedAt?.toISOString().split('T')[0] || '';

      const count = paperWithIncludes._count as { downloads?: number; reviews?: number };
      const keywords = paperWithIncludes.keywords as string;
      
      return {
        id: paperWithIncludes.id,
        title: paperWithIncludes.title,
        abstract: paperWithIncludes.abstract,
        authors: authorNames,
        publishedAt: displayDate,
        downloads: count?.downloads || 0,
        category: paperWithIncludes.category || 'General',
        keywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
        status: (paperWithIncludes.status as string).toLowerCase(),
        fileUrl: paperWithIncludes.filePath,
        rating: averageRating > 0 ? Math.round(averageRating * 10) / 10 : null,
        reviewCount: count?.reviews || 0,
        issue: paperWithIncludes.issue, // Include issue information in response
        _rating: averageRating, // Internal field for sorting
        _sortDate: sortDate // Internal field for proper date sorting
      };
    });

    // Apply rating sort in post-processing since Prisma doesn't support custom calculations
    if (sortBy === 'rating') {
      transformedPapers.sort((a, b) => {
        const ratingA = a._rating || 0;
        const ratingB = b._rating || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    }

    // Remove internal fields
    const finalPapers = transformedPapers.map((p) => {
      return Object.fromEntries(Object.entries(p).filter(([key]) =>
        key !== '_rating' && key !== '_sortDate'
      ));
    });

    const totalPages = Math.ceil(totalPapers / limit);

    return NextResponse.json({
      papers: finalPapers,
      totalPapers,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching library papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}
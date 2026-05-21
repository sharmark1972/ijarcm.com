import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

// Apply rate limiting: 100 requests per minute per IP
const rateLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60 * 1000, // 1 minute
});

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'downloads', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
  apiKey: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const rateLimitResult = await rateLimiter.check(100, ip);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': '60'
          }
        }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      author: searchParams.get('author') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'date',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      apiKey: searchParams.get('apiKey') || undefined,
    };

    const validatedParams = searchSchema.parse(queryParams);
    const { query, category, author, dateFrom, dateTo, sortBy, sortOrder, page, limit } = validatedParams;

    // Build where clause - only return published papers
    const where: Record<string, unknown> = {
      status: 'PUBLISHED'
    };

    // Add search query conditions
    if (query) {
      where.OR = [
        {
          title: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          abstract: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          keywords: {
            contains: query,
            mode: 'insensitive'
          }
        },
        {
          paperAuthors: {
            some: {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  },
                  {
                    lastName: {
                      contains: query,
                      mode: 'insensitive'
                    }
                  }
                ]
              }
            }
          }
        }
      ];
    }

    // Add category filter
    if (category && category !== 'All Categories') {
      where.category = {
        contains: category,
        mode: 'insensitive'
      };
    }

    // Add author filter
    if (author) {
      where.paperAuthors = {
        some: {
          user: {
            OR: [
              {
                firstName: {
                  contains: author,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: author,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      };
    }

    // Add date range filters
    if (dateFrom || dateTo) {
      where.publishedAt = {};
      if (dateFrom) {
        (where.publishedAt as Record<string, unknown>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.publishedAt as Record<string, unknown>).lte = new Date(dateTo);
      }
    }

    // Build order by clause
    const orderBy: Record<string, unknown> = {};
    switch (sortBy) {
      case 'date':
        orderBy.publishedAt = sortOrder;
        break;
      case 'downloads':
        orderBy.downloads = { _count: sortOrder };
        break;
      case 'title':
        orderBy.title = sortOrder;
        break;
      default: // relevance
        orderBy.publishedAt = 'desc';
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search query
    const [papers, totalCount] = await Promise.all([
      prisma.paper.findMany({
        where,
        select: {
          id: true,
          title: true,
          abstract: true,
          keywords: true,
          category: true,
          publishedAt: true,
          paperAuthors: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  institution: true
                }
              }
            },
            orderBy: { authorOrder: 'asc' }
          },
          reviews: {
            where: {
              submittedAt: { not: null }
            },
            select: {
              score: true
            }
          },
          _count: {
            select: {
              downloads: true,
              reviews: true
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
        orderBy,
        skip,
        take: limit
      }),
      prisma.paper.count({ where })
    ]);

    // Transform data for public API
    const transformedPapers = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: paper.keywords ? paper.keywords.split(',').map(k => k.trim()) : [],
      category: paper.category,
      publishedAt: paper.publishedAt,
      authors: paper.paperAuthors.map(author => ({
        name: `${author.user.firstName} ${author.user.lastName}`,
        institution: author.user.institution
      })),
      averageRating: paper.reviews.length > 0 
        ? paper.reviews.reduce((sum, review) => sum + (review.score || 0), 0) / paper.reviews.length 
        : null,
      downloadCount: paper._count.downloads,
      reviewCount: paper._count.reviews,
      issue: paper.issue
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Create response with rate limit headers
    const response = NextResponse.json({
      success: true,
      data: {
        papers: transformedPapers,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      },
      meta: {
        source: 'IJARCM Public API',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', '100');
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    
    // Add CORS headers for external access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;

  } catch (error) {
    console.error('Public API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid parameters', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

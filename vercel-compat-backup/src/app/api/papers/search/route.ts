import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const searchSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  author: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'downloads', 'title']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
  status: z.enum(['PUBLISHED', 'UNDER_REVIEW', 'REJECTED']).optional().default('PUBLISHED')
});

export async function GET(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions); // Not used in current implementation
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      author: searchParams.get('author') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: searchParams.get('sortBy') || 'relevance',
      sortOrder: searchParams.get('sortOrder') || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '12'),
      status: searchParams.get('status') || 'PUBLISHED'
    };

    const validatedParams = searchSchema.parse(queryParams);
    const { query, category, author, dateFrom, dateTo, sortBy, sortOrder, page, limit, status } = validatedParams;

    // Build where clause
    const where: any = {
      status: status
    };

    // Add search query conditions
    if (query) {
      where.OR = [
        {
          title: {
            contains: query
          }
        },
        {
          abstract: {
            contains: query
          }
        },
        {
          keywords: {
            contains: query
          }
        },
        {
          paperAuthors: {
            some: {
              user: {
                OR: [
                  {
                    firstName: {
                      contains: query
                    }
                  },
                  {
                    lastName: {
                      contains: query
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
      where.category = category;
    }

    // Add author filter
    if (author) {
      where.paperAuthors = {
        some: {
          user: {
            OR: [
              {
                firstName: {
                  contains: author
                }
              },
              {
                lastName: {
                  contains: author
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
        where.publishedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.publishedAt.lte = new Date(dateTo);
      }
    }

    // Build order by clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'date':
        orderBy = { publishedAt: sortOrder };
        break;
      case 'downloads':
        orderBy = { downloads: { _count: sortOrder } };
        break;
      case 'title':
        orderBy = { title: sortOrder };
        break;
      default: // relevance
        orderBy = { submittedAt: 'desc' };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute search query
    const [papers, totalCount] = await Promise.all([
      prisma.paper.findMany({
        where,
        include: {
          paperAuthors: {
            select: {
              isCorresponding: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          reviews: {
            where: {
              submittedAt: { not: null }
            },
            select: {
              score: true
            }
          },
          downloads: {
            select: {
              id: true
            }
          },
          _count: {
            select: {
              downloads: true,
              reviews: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.paper.count({ where })
    ]);

    // Transform the data
    const transformedPapers = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: paper.keywords,
      category: paper.category,
      status: paper.status,
      published_at: paper.publishedAt,
      file_path: paper.filePath,
      authors: paper.paperAuthors.map(author => ({
        name: `${author.user.firstName} ${author.user.lastName}`,
        email: author.user.email,
        is_corresponding: author.isCorresponding
      })),
      average_rating: paper.reviews.length > 0 
        ? paper.reviews.reduce((sum, review) => sum + (review.score || 0), 0) / paper.reviews.length 
        : null,
      download_count: paper._count.downloads,
      review_count: paper._count.reviews
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      papers: transformedPapers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage,
        hasPrevPage,
        limit
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get search suggestions/autocomplete
export async function POST(request: NextRequest) {
  try {
    // const session = await getServerSession(authOptions); // Not used in current implementation
    
    const body = await request.json();
    const { query, type } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    let suggestions: string[] = [];

    switch (type) {
      case 'authors': {
        const authors = await prisma.paperAuthor.findMany({
          where: {
            user: {
              OR: [
                {
                  firstName: {
                    contains: query
                  }
                },
                {
                  lastName: {
                    contains: query
                  }
                }
              ]
            }
          },
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 10
        });
        suggestions = authors.map(author => `${author.user.firstName} ${author.user.lastName}`);
        break;
      }

      case 'categories': {
        const categories = await prisma.paper.findMany({
          where: {
            category: {
              contains: query
            },
            status: 'PUBLISHED'
          },
          select: {
            category: true
          },
          distinct: ['category'],
          take: 10
        });
        suggestions = categories.map(cat => cat.category).filter(Boolean) as string[];
        break;
      }

      case 'keywords': {
        const papers = await prisma.paper.findMany({
          where: {
            keywords: {
              contains: query
            },
            status: 'PUBLISHED'
          },
          select: {
            keywords: true
          },
          take: 20
        });
        
        const allKeywords = papers
          .map(paper => paper.keywords?.split(',').map(k => k.trim()) || [])
          .flat()
          .filter(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
          .filter((keyword, index, self) => self.indexOf(keyword) === index)
          .slice(0, 10);
        
        suggestions = allKeywords;
        break;
      }

      default: {
        // General search suggestions (titles)
        const titles = await prisma.paper.findMany({
          where: {
            OR: [
              {
                title: {
                  contains: query
                }
              },
              {
                abstract: {
                  contains: query
                }
              }
            ],
            status: 'PUBLISHED'
          },
          select: {
            title: true
          },
          take: 10
        });
        suggestions = titles.map(paper => paper.title);
        break;
      }
    }

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
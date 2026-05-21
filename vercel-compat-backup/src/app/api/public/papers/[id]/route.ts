import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

// Apply rate limiting: 100 requests per minute per IP
const rateLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60 * 1000, // 1 minute
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const paperId = params.id;

    // Fetch paper details - only return published papers
    const paper = await prisma.paper.findUnique({
      where: { 
        id: paperId,
        status: 'PUBLISHED' // Only return published papers
      },
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
            },
            authorOrder: true,
            isCorresponding: true
          },
          orderBy: { authorOrder: 'asc' }
        },
        reviews: {
          where: {
            submittedAt: { not: null }
          },
          select: {
            score: true,
            submittedAt: true
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
      }
    });

    if (!paper) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Paper not found or not published' 
        },
        { status: 404 }
      );
    }

    // Transform data for public API
    const transformedPaper = {
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      keywords: paper.keywords ? paper.keywords.split(',').map(k => k.trim()) : [],
      category: paper.category,
      publishedAt: paper.publishedAt,
      authors: paper.paperAuthors.map(author => ({
        name: `${author.user.firstName} ${author.user.lastName}`,
        institution: author.user.institution,
        order: author.authorOrder,
        isCorresponding: author.isCorresponding
      })),
      averageRating: paper.reviews.length > 0 
        ? paper.reviews.reduce((sum, review) => sum + (review.score || 0), 0) / paper.reviews.length 
        : null,
      downloadCount: paper._count.downloads,
      reviewCount: paper._count.reviews,
      issue: paper.issue
    };

    // Create response with rate limit headers
    const response = NextResponse.json({
      success: true,
      data: transformedPaper,
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
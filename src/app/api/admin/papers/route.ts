import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const issueFilter = searchParams.get('issueId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { abstract: { contains: searchTerm, mode: 'insensitive' } },
        { keywords: { contains: searchTerm, mode: 'insensitive' } },
        {
          paperAuthors: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ];
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (categoryFilter !== 'ALL') {
      where.category = categoryFilter;
    }

    if (issueFilter) {
      where.issueId = issueFilter;
    }

    const totalPapers = await prisma.paper.count({ where });
    const totalPages = Math.ceil(totalPapers / limit);

    const papers = await prisma.paper.findMany({
      where,
      include: {
        submitter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        },
        paperAuthors: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                institution: true
              }
            }
          },
          orderBy: { authorOrder: 'asc' }
        },
        reviews: { select: { id: true } },
        issue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issueNumber: true,
            year: true,
            isPublished: true
          }
        },
        _count: { select: { downloads: true } },
        plagiarismChecks: {
          select: {
            id: true,
            status: true,
            similarity: true,
            checkedAt: true
          },
          orderBy: { checkedAt: 'desc' }
        }
      },
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    const formattedPapers = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.paperAuthors.map(author => `${author.user.firstName} ${author.user.lastName}`),
      keywords: (() => {
        if (!paper.keywords) return [];
        const kw = paper.keywords.trim();
        if (kw.startsWith('[')) {
          try { return JSON.parse(kw) as string[]; } catch { /* fall through */ }
        }
        return kw.split(',').map(k => k.trim()).filter(Boolean);
      })(),
      status: paper.status,
      submittedAt: paper.submittedAt,
      publishedAt: paper.publishedAt,
      reviewCount: paper.reviews.length,
      downloadCount: paper._count.downloads,
      category: paper.category,
      submittedBy: {
        name: paper.submitter ? `${paper.submitter.firstName} ${paper.submitter.lastName}` : 'Unknown',
        email: paper.submitter?.email || '',
        institution: paper.submitter?.institution || ''
      },
      fileUrl: paper.filePath ? `/api/papers/${paper.id}/download` : null,
      issue: paper.issue ? {
        id: paper.issue.id,
        title: paper.issue.title,
        volume: paper.issue.volume,
        issueNumber: paper.issue.issueNumber,
        year: paper.issue.year,
        isPublished: paper.issue.isPublished
      } : null,
      volumeNumber: paper.volumeNumber,
      issueNumber: paper.issueNumber,
      publicationDate: paper.publicationDate,
      uniqueNumber: paper.uniqueNumber,
      plagiarismChecks: paper.plagiarismChecks.map(check => ({
        id: check.id,
        status: check.status,
        similarityScore: check.similarity,
        createdAt: check.checkedAt
      }))
    }));

    return NextResponse.json({
      papers: formattedPapers,
      totalPapers,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Use /api/admin/research-papers/submit for new papers' },
    { status: 410 }
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CitationGenerator, CitationStyle, extractAuthorsFromPaper } from '@/lib/citations';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;
    const { searchParams } = new URL(request.url);
    const style = (searchParams.get('style') || 'APA') as CitationStyle;
    const format = searchParams.get('format') || 'json';

    // Fetch paper with all necessary data
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        paperAuthors: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        issue: {
          select: {
            volume: true,
            issueNumber: true,
            year: true
          }
        }
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Extract authors
    const authors = extractAuthorsFromPaper(paper.paperAuthors);

    // Build citation data
    const citationData = {
      title: paper.title,
      authors,
      year: paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : new Date().getFullYear(),
      journal: 'International Journal of Research in Applied Mathematics',
      volume: paper.issue?.volume || paper.volumeNumber || undefined,
      issue: paper.issue?.issueNumber || paper.issueNumber || undefined,
      pages: paper.uniqueNumber || undefined,
      doi: paper.doi || undefined,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/papers/${paperId}`
    };

    // Generate citation
    const citation = CitationGenerator.generate(citationData, style);

    // Handle different response formats
    if (format === 'bib') {
      // Return as .bib file for BibTeX
      return new NextResponse(citation, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="citation_${paperId}.bib"`
        }
      });
    }

    if (format === 'txt') {
      // Return as plain text
      return new NextResponse(citation, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="citation_${paperId}.txt"`
        }
      });
    }

    // Default JSON response
    return NextResponse.json({
      style,
      citation,
      data: citationData
    });

  } catch (error) {
    console.error('Error generating citation:', error);
    return NextResponse.json(
      { error: 'Failed to generate citation' },
      { status: 500 }
    );
  }
}

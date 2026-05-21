import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCitation, CitationStyle, CitationData } from '@/lib/citations';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createCitationSchema = z.object({
  paperId: z.string().uuid(),
  style: z.enum(['APA', 'MLA', 'CHICAGO', 'IEEE', 'HARVARD']),
  customData: z.object({
    title: z.string().optional(),
    authors: z.array(z.string()).optional(),
    year: z.number().optional(),
    journal: z.string().optional(),
    volume: z.string().optional(),
    issue: z.string().optional(),
    pages: z.string().optional(),
    doi: z.string().optional(),
    url: z.string().optional()
  }).optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const style = searchParams.get('style') as CitationStyle;

    if (!paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required' },
        { status: 400 }
      );
    }

    // Check if citation already exists
    const existingCitation = await prisma.citation.findFirst({
      where: {
        paperId,
        style: style || 'APA'
      }
    });

    if (existingCitation) {
      return NextResponse.json(existingCitation);
    }

    // Generate new citation
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        paperAuthors: {
          include: {
            user: true
          },
          orderBy: {
            authorOrder: 'asc'
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

    const authors = paper.paperAuthors.map(pa => `${pa.user.firstName} ${pa.user.lastName}`);
    
    const citationData: CitationData = {
      title: paper.title,
      authors,
      year: paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : new Date().getFullYear(),
      journal: 'International Journal of Research in Applied Mathematics'
    };

    const citationContent = generateCitation(citationData, style || CitationStyle.APA);

    // Save citation to database
    const citation = await prisma.citation.create({
      data: {
        paperId,
        style: style || 'APA',
        content: citationContent
      }
    });

    return NextResponse.json(citation);
  } catch (error) {
    console.error('Error generating citation:', error);
    return NextResponse.json(
      { error: 'Failed to generate citation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCitationSchema.parse(body);

    const { paperId, style, customData } = validatedData;

    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        paperAuthors: {
          include: {
            user: true
          },
          orderBy: {
            authorOrder: 'asc'
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

    let citationData: CitationData;

    if (customData) {
      // Use custom citation data
      citationData = {
        title: customData.title || paper.title,
        authors: customData.authors || paper.paperAuthors.map(pa => `${pa.user.firstName} ${pa.user.lastName}`),
        year: customData.year || (paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : new Date().getFullYear()),
        journal: customData.journal || 'International Journal of Research in Applied Mathematics',
        volume: customData.volume,
        issue: customData.issue,
        pages: customData.pages,
        doi: customData.doi,
        url: customData.url
      };
    } else {
      // Use paper data
      const authors = paper.paperAuthors.map(pa => `${pa.user.firstName} ${pa.user.lastName}`);
      citationData = {
        title: paper.title,
        authors,
        year: paper.publishedAt ? new Date(paper.publishedAt).getFullYear() : new Date().getFullYear(),
        journal: 'International Journal of Research in Applied Mathematics'
      };
    }

    const citationContent = generateCitation(citationData, style as CitationStyle);

    // Check if citation already exists and update or create
    const existingCitation = await prisma.citation.findFirst({
      where: {
        paperId,
        style
      }
    });

    let citation;
    if (existingCitation) {
      citation = await prisma.citation.update({
        where: { id: existingCitation.id },
        data: {
          content: citationContent,
          doi: citationData.doi,
          url: citationData.url,
          accessDate: citationData.accessDate
        }
      });
    } else {
      citation = await prisma.citation.create({
        data: {
          paperId,
          style,
          content: citationContent,
          doi: citationData.doi,
          url: citationData.url,
          accessDate: citationData.accessDate
        }
      });
    }

    return NextResponse.json(citation);
  } catch (error) {
    console.error('Error creating citation:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create citation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const citationId = searchParams.get('id');

    if (!citationId) {
      return NextResponse.json(
        { error: 'Citation ID is required' },
        { status: 400 }
      );
    }

    await prisma.citation.delete({
      where: { id: citationId }
    });

    return NextResponse.json({ message: 'Citation deleted successfully' });
  } catch (error) {
    console.error('Error deleting citation:', error);
    return NextResponse.json(
      { error: 'Failed to delete citation' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildStoredFileResponse } from '@/lib/file-storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;
    console.log('PDF request for paper:', paperId);

    // Get paper details
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        filePath: true,
      }
    });

    if (!paper) {
      console.log('Paper not found:', paperId);
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    console.log('Paper found:', { id: paper.id, title: paper.title, status: paper.status, filePath: paper.filePath });

    if (!paper.filePath) {
      console.log('No filePath for paper:', paperId);
      return NextResponse.json(
        { error: 'PDF file not available for this paper' },
        { status: 404 }
      );
    }

    return await buildStoredFileResponse(paper.filePath, {
      filename: `${encodeURIComponent(paper.title)}.pdf`,
      disposition: 'inline',
      cacheControl: 'public, max-age=3600',
      extraHeaders: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to serve PDF', details: String(error) },
      { status: 500 }
    );
  }
}

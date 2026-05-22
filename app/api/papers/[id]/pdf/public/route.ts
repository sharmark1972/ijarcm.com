import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildStoredFileResponse, getFileNameFromPath } from '@/lib/file-storage';

// Google Scholar bot user agent
const GOOGLE_SCHOLAR_BOT = 'Googlebot-Scholar';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = params.id;
    const { searchParams } = new URL(request.url);
    const isPublicAccess = searchParams.get('public') === '1';
    const userAgent = request.headers.get('user-agent') || '';
    
    // Check if this is a valid request (either from Google Scholar or with public=1)
    const isGoogleScholarBot = userAgent.includes(GOOGLE_SCHOLAR_BOT);
    
    if (!isGoogleScholarBot && !isPublicAccess) {
      return NextResponse.json(
        { error: 'Access denied. This endpoint is for search engines only.' },
        { status: 403 }
      );
    }

    // Get paper details
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        filePath: true,
        publishedAt: true
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Only allow access to published papers
    if (paper.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Paper not published' },
        { status: 403 }
      );
    }

    // Log access for analytics
    console.log(`Public PDF access: ${paperId} - ${isGoogleScholarBot ? 'Google Scholar Bot' : 'Public Link'} - ${userAgent}`);

    return await buildStoredFileResponse(paper.filePath, {
      filename: getFileNameFromPath(paper.filePath),
      disposition: 'inline',
      cacheControl: 'public, max-age=86400',
      extraHeaders: {
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'index, follow'
      }
    });

  } catch (error) {
    console.error('Error accessing public PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildStoredFileResponse, getFileNameFromPath } from '@/lib/file-storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const paperId = params.id;

    // Get paper details
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        status: true,
        filePath: true,
        submitterId: true,
        reviews: {
          select: {
            reviewerId: true
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

    // Check download permissions
    const canDownload = 
      session.user.role === 'ADMIN' ||
      paper.submitterId === session.user.id ||
      (session.user.role === 'REVIEWER' && paper.reviews.some(r => r.reviewerId === session.user.id)) ||
      paper.status === 'PUBLISHED';

    if (!canDownload) {
      return NextResponse.json(
        { error: 'Insufficient permissions to download this paper' },
        { status: 403 }
      );
    }

    // Record the download
    // First verify the user exists in the database
    if (!session.user.id) {
      console.error('Download: User ID is null or undefined in session');
      return NextResponse.json(
        { error: 'User session invalid. Please log out and log in again.' },
        { status: 401 }
      );
    }
    
    console.log('Download: Verifying user exists in database. User ID:', session.user.id);
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true }
    });
    
    if (!userExists) {
      console.error('Download: User not found in database. User ID from session:', session.user.id);
      return NextResponse.json(
        { error: 'User session invalid. Please log out and log in again.' },
        { status: 401 }
      );
    }
    
    console.log('Download: User verified in database. Creating download record for user:', userExists.email);
    
    await prisma.download.create({
      data: {
        paperId: paper.id,
        userId: session.user.id,
        downloadedAt: new Date(),
        ipAddress: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        // userAgent field removed as it doesn't exist in schema
      }
    });

    return await buildStoredFileResponse(paper.filePath, {
      filename: getFileNameFromPath(paper.filePath),
      disposition: 'attachment',
      extraHeaders: {
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Public-PDF-URL': `/api/papers/${paperId}/pdf/public`
      }
    });

  } catch (error) {
    console.error('Error downloading paper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET download statistics for a paper
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const paperId = params.id;
    const { action } = await request.json();

    if (action === 'stats') {
      // Check if user can view stats
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: {
          submitterId: true
        }
      });

      if (!paper) {
        return NextResponse.json(
          { error: 'Paper not found' },
          { status: 404 }
        );
      }

      const canViewStats = 
        session.user.role === 'ADMIN' ||
        paper.submitterId === session.user.id;

      if (!canViewStats) {
        return NextResponse.json(
          { error: 'Insufficient permissions to view download statistics' },
          { status: 403 }
        );
      }

      // Get download statistics
      const [totalDownloads, recentDownloads, downloadsByMonth] = await Promise.all([
        // Total downloads
        prisma.download.count({
          where: { paperId }
        }),
        
        // Recent downloads (last 30 days)
        prisma.download.findMany({
          where: {
            paperId,
            downloadedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                institution: true,
                role: true
              }
            }
          },
          orderBy: { downloadedAt: 'desc' },
          take: 50
        }),
        
        // Downloads by month (last 12 months)
        prisma.$queryRaw`
          SELECT 
            DATE_FORMAT(downloadedAt, '%Y-%m') as month,
            COUNT(*) as downloads
          FROM Download 
          WHERE paperId = ${paperId}
            AND downloadedAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
          GROUP BY DATE_FORMAT(downloadedAt, '%Y-%m')
          ORDER BY month DESC
        `
      ]);

      // Get unique downloaders
      const uniqueDownloaders = await prisma.download.groupBy({
        by: ['userId'],
        where: { paperId },
        _count: {
          userId: true
        }
      });

      return NextResponse.json({
        totalDownloads,
        uniqueDownloaders: uniqueDownloaders.length,
        recentDownloads,
        downloadsByMonth,
        stats: {
          averageDownloadsPerUser: uniqueDownloaders.length > 0 
            ? (totalDownloads / uniqueDownloaders.length).toFixed(2)
            : 0
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error fetching download statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

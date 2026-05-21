import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST - Bulk operations on papers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, paperIds } = body;

    if (!action || !paperIds || !Array.isArray(paperIds) || paperIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and paper IDs are required' },
        { status: 400 }
      );
    }

    let result;
    let message;

    switch (action) {
      case 'publish':
        result = await prisma.paper.updateMany({
          where: {
            id: { in: paperIds },
            status: 'ACCEPTED' // Only accepted papers can be published
          },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date()
          }
        });
        message = `${result.count} papers published successfully`;
        break;

      case 'reject':
        result = await prisma.paper.updateMany({
          where: {
            id: { in: paperIds },
            status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } // Only submitted or under review papers can be rejected
          },
          data: {
            status: 'REJECTED'
          }
        });
        message = `${result.count} papers rejected successfully`;
        break;

      case 'delete':
        // First delete related reviews
        await prisma.review.deleteMany({
          where: {
            paperId: { in: paperIds }
          }
        });
        
        // Then delete the papers
        result = await prisma.paper.deleteMany({
          where: {
            id: { in: paperIds }
          }
        });
        message = `${result.count} papers deleted successfully`;
        break;

      case 'accept':
        result = await prisma.paper.updateMany({
          where: {
            id: { in: paperIds },
            status: 'UNDER_REVIEW'
          },
          data: {
            status: 'ACCEPTED'
          }
        });
        message = `${result.count} papers accepted successfully`;
        break;

      case 'send_to_review':
        result = await prisma.paper.updateMany({
          where: {
            id: { in: paperIds },
            status: 'SUBMITTED'
          },
          data: {
            status: 'UNDER_REVIEW'
          }
        });
        message = `${result.count} papers sent to review successfully`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: publish, reject, delete, accept, send_to_review' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message,
      affectedCount: result.count
    });

  } catch (error) {
    console.error('Error performing bulk action on papers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

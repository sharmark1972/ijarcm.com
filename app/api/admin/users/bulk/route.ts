import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, userIds, data } = body;

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    // Prevent admin from performing bulk actions on themselves
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk actions on yourself' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    let successMessage = '';

    switch (action) {
      case 'activate':
        updateData = { isBanned: false };
        successMessage = 'Users activated successfully';
        break;
        
      case 'deactivate':
        updateData = { isBanned: true };
        successMessage = 'Users deactivated successfully';
        break;
        
      case 'ban':
        updateData = {
          isBanned: true,
          banReason: data?.reason || 'Bulk ban action',
        };
        successMessage = 'Users banned successfully';
        break;
        
      case 'unban':
        updateData = {
          isBanned: false,
          banReason: null,
        };
        successMessage = 'Users unbanned successfully';
        break;
        
      case 'warn':
        updateData = {
          isWarned: true,
          warningMessage: data?.message || 'Bulk warning',
          warningDate: new Date(),
        };
        successMessage = 'Users warned successfully';
        break;
        
      case 'unwarn':
        updateData = {
          isWarned: false,
          warningMessage: null,
          warningDate: null,
        };
        successMessage = 'User warnings removed successfully';
        break;
        
      case 'delete':
        // Handle delete separately as it's not an update
        await prisma.user.deleteMany({
          where: {
            id: { in: userIds },
          },
        });
        
        return NextResponse.json({
          message: 'Users deleted successfully',
          affectedCount: userIds.length,
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Perform bulk update
    const result = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: updateData,
    });

    return NextResponse.json({
      message: successMessage,
      affectedCount: result.count,
    });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}

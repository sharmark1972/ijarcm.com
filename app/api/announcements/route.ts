import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get active announcements for public display
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const targetAudience = searchParams.get('targetAudience');
    const conferenceId = searchParams.get('conferenceId');
    const limit = parseInt(searchParams.get('limit') || '10');

    const now = new Date();
    
    const whereClause: any = {
      isPublished: true,
      OR: [
        { publishedAt: null },
        { publishedAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ]
        }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    if (targetAudience) {
      whereClause.targetAudience = targetAudience;
    }

    if (conferenceId) {
      whereClause.conferenceId = conferenceId;
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        createdAt: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ announcements });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
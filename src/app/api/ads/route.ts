import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get active advertisements for public display
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const limit = parseInt(searchParams.get('limit') || '5');

    const now = new Date();
    
    const whereClause: any = {
      isEnabled: true,
      OR: [
        { startDate: null },
        { startDate: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ]
    };

    if (position) {
      whereClause.position = position;
    }

    const ads = await prisma.advertisement.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        mediaType: true,
        mediaUrl: true,
        linkUrl: true,
        position: true,
        priority: true
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({ ads });

  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
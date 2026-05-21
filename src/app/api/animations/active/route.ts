import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
    // Find active animation using Prisma client
    const activeAnimation = await prisma.animationSettings.findFirst({
      where: {
        isEnabled: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } }
            ]
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } }
            ]
          }
        ]
      }
    });

    if (!activeAnimation) {
      return NextResponse.json({ animationType: 'NONE', customMessage: null });
    }

    return NextResponse.json({
      animationType: activeAnimation.animationType,
      customMessage: activeAnimation.customMessage
    });
  } catch (error) {
    console.error('Error fetching active animation:', error);
    return NextResponse.json({ animationType: 'NONE', customMessage: null });
  }
}

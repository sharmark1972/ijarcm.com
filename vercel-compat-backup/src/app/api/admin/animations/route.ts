import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ANIMATION_TYPES, type AnimationType, type AnimationSetting } from '@/lib/animation-types';

// GET - Fetch all animation settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.animationSettings.findMany({
      orderBy: { animationType: 'asc' }
    });

    // Initialize default settings if none exist
    if (settings.length === 0) {
      const defaultSettings = ANIMATION_TYPES.map(type => ({
        animationType: type,
        isEnabled: false,
        startDate: null,
        endDate: null,
        customMessage: null
      }));

      await prisma.animationSettings.createMany({
        data: defaultSettings
      });

      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching animation settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch animation settings' },
      { status: 500 }
    );
  }
}

// POST - Update animation settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AnimationSetting = await request.json();
    const { animationType, isEnabled, startDate, endDate, customMessage } = body;

    // Validate animation type
    if (!ANIMATION_TYPES.includes(animationType as AnimationType)) {
      return NextResponse.json(
        { error: 'Invalid animation type' },
        { status: 400 }
      );
    }

    // If enabling an animation, disable all others
    if (isEnabled && animationType !== 'NONE') {
      await prisma.animationSettings.updateMany({
        where: {
          animationType: {
            not: animationType
          }
        },
        data: {
          isEnabled: false
        }
      });
    }

    // Upsert the animation setting
    const setting = await prisma.animationSettings.upsert({
      where: { animationType },
      update: {
        isEnabled,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        customMessage
      },
      create: {
        animationType,
        isEnabled,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        customMessage
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Animation settings updated successfully',
      setting
    });
  } catch (error) {
    console.error('Error updating animation settings:', error);
    return NextResponse.json(
      { error: 'Failed to update animation settings' },
      { status: 500 }
    );
  }
}

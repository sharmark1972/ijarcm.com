import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Fetch current maintenance settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const maintenanceSettings = await prisma.maintenanceSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    // Don't return the actual hashed code for security
    const response = maintenanceSettings ? {
      id: maintenanceSettings.id,
      isMaintenanceMode: maintenanceSettings.isMaintenanceMode,
      maintenanceMessage: maintenanceSettings.maintenanceMessage,
      maintenanceStartTime: maintenanceSettings.maintenanceStartTime,
      maintenanceEndTime: maintenanceSettings.maintenanceEndTime,
      hasCode: !!maintenanceSettings.maintenanceCode,
      createdAt: maintenanceSettings.createdAt,
      updatedAt: maintenanceSettings.updatedAt
    } : null;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching maintenance settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update maintenance settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      isMaintenanceMode,
      maintenanceCode,
      maintenanceMessage,
      maintenanceStartTime,
      maintenanceEndTime
    } = body;

    // Validate required fields
    if (typeof isMaintenanceMode !== 'boolean') {
      return NextResponse.json(
        { message: 'isMaintenanceMode must be a boolean' },
        { status: 400 }
      );
    }

    // Hash the maintenance code if provided
    let hashedCode: string | null = null;
    if (maintenanceCode && typeof maintenanceCode === 'string' && maintenanceCode.trim()) {
      hashedCode = await bcrypt.hash(maintenanceCode.trim(), 12);
    }

    // Validate dates if provided
    let startTime: Date | null = null;
    let endTime: Date | null = null;
    
    if (maintenanceStartTime) {
      startTime = new Date(maintenanceStartTime);
      if (isNaN(startTime.getTime())) {
        return NextResponse.json(
          { message: 'Invalid start time format' },
          { status: 400 }
        );
      }
    }

    if (maintenanceEndTime) {
      endTime = new Date(maintenanceEndTime);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          { message: 'Invalid end time format' },
          { status: 400 }
        );
      }
    }

    // Check if end time is after start time
    if (startTime && endTime && endTime <= startTime) {
      return NextResponse.json(
        { message: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Get existing settings or create new
    const existingSettings = await prisma.maintenanceSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    let updatedSettings;
    
    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.maintenanceSettings.update({
        where: { id: existingSettings.id },
        data: {
          isMaintenanceMode,
          maintenanceCode: hashedCode || existingSettings.maintenanceCode,
          maintenanceMessage: maintenanceMessage || existingSettings.maintenanceMessage,
          maintenanceStartTime: startTime || existingSettings.maintenanceStartTime,
          maintenanceEndTime: endTime || existingSettings.maintenanceEndTime
        }
      });
    } else {
      // Create new settings
      updatedSettings = await prisma.maintenanceSettings.create({
        data: {
          isMaintenanceMode,
          maintenanceCode: hashedCode,
          maintenanceMessage: maintenanceMessage || 'Site is currently under maintenance. Please check back later.',
          maintenanceStartTime: startTime,
          maintenanceEndTime: endTime
        }
      });
    }

    // Log the maintenance action
    console.log(`Maintenance mode ${isMaintenanceMode ? 'enabled' : 'disabled'} by admin: ${session.user.email}`);

    // Return response without the hashed code
    const response = {
      id: updatedSettings.id,
      isMaintenanceMode: updatedSettings.isMaintenanceMode,
      maintenanceMessage: updatedSettings.maintenanceMessage,
      maintenanceStartTime: updatedSettings.maintenanceStartTime,
      maintenanceEndTime: updatedSettings.maintenanceEndTime,
      hasCode: !!updatedSettings.maintenanceCode,
      createdAt: updatedSettings.createdAt,
      updatedAt: updatedSettings.updatedAt
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating maintenance settings:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
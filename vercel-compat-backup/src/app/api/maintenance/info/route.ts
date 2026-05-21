import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get maintenance settings from database
    const maintenanceSettings = await prisma.maintenanceSettings.findFirst();
    
    if (!maintenanceSettings) {
      return NextResponse.json({
        message: 'We are currently performing scheduled maintenance. Please check back soon.',
        endTime: null
      });
    }

    return NextResponse.json({
      message: maintenanceSettings.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
      endTime: maintenanceSettings.maintenanceEndTime
    });
  } catch (error) {
    console.error('Error fetching maintenance info:', error);
    return NextResponse.json(
      { 
        message: 'We are currently performing scheduled maintenance. Please check back soon.',
        endTime: null 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
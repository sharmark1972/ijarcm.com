import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { rateLimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

// Rate limiting for code verification attempts
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per minute
});

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const identifier = request.ip || 'anonymous';
    const { success, reset } = await limiter.check(5, identifier); // 5 attempts per minute
    // const { limit, remaining } = await limiter.check(5, identifier); // Not used in current implementation
    
    if (!success) {
      return NextResponse.json(
        { 
          message: 'Too many attempts. Please try again later.',
          retryAfter: Math.round((reset - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { message: 'Access code is required' },
        { status: 400 }
      );
    }

    // Get maintenance settings
    const maintenanceSettings = await prisma.maintenanceSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!maintenanceSettings?.isMaintenanceMode) {
      return NextResponse.json(
        { message: 'Site is not in maintenance mode' },
        { status: 400 }
      );
    }

    if (!maintenanceSettings.maintenanceCode) {
      return NextResponse.json(
        { message: 'No maintenance code configured' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValidCode = await bcrypt.compare(code, maintenanceSettings.maintenanceCode);

    if (!isValidCode) {
      return NextResponse.json(
        { message: 'Invalid access code' },
        { status: 401 }
      );
    }

    // Code is valid
    const response = NextResponse.json(
      { message: 'Access granted' },
      { status: 200 }
    );

    // Set bypass cookie
    response.cookies.set('maintenance_bypass', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Maintenance verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
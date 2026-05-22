import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Free IP geolocation service with timeout and improved error handling
async function getLocationFromIP(ip: string): Promise<{
  country: string | null;
  countryCode: string | null;
  city: string | null;
  region: string | null;
}> {
  try {
    // Skip location lookup for localhost/development IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        country: null,
        countryCode: null,
        city: null,
        region: null,
      };
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Using ipapi.co for free IP geolocation with timeout
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'IJARCM-Analytics/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`Location service returned ${response.status} for IP ${ip}`);
        return {
          country: null,
          countryCode: null,
          city: null,
          region: null,
        };
      }
      
      const data = await response.json();
      
      // Check if the response contains an error
      if (data.error) {
        console.warn(`Location service error for IP ${ip}:`, data.reason || data.error);
        return {
          country: null,
          countryCode: null,
          city: null,
          region: null,
        };
      }
      
      return {
        country: data.country_name || null,
        countryCode: data.country_code || null,
        city: data.city || null,
        region: data.region || null,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Log warning instead of error to reduce noise
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn(`Location lookup timeout for IP ${ip}`);
    } else {
      console.warn(`Location lookup failed for IP ${ip}:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Always return null values gracefully
    return {
      country: null,
      countryCode: null,
      city: null,
      region: null,
    };
  }
}

function getClientIP(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to localhost for development
  return '127.0.0.1';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page, sessionId } = body;
    
    if (!page) {
      return NextResponse.json(
        { error: 'Page parameter is required' },
        { status: 400 }
      );
    }
    
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || null;
    const referer = request.headers.get('referer') || null;
    
    // Check for recent duplicate entries from the same IP and page within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const existingVisitor = await prisma.visitor.findFirst({
      where: {
        ipAddress: ip,
        page,
        visitedAt: {
          gte: fiveMinutesAgo
        }
      }
    });
    
    if (existingVisitor) {
      return NextResponse.json({
        success: true,
        visitorId: existingVisitor.id,
        message: 'Already tracked recently'
      });
    }
    
    // Get location data from IP with timeout
    const locationDataPromise = getLocationFromIP(ip);
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => resolve({
        country: null,
        countryCode: null,
        city: null,
        region: null,
      }), 3000); // 3 second timeout
    });
    
    const locationData = await Promise.race([locationDataPromise, timeoutPromise]) as {
      country: string | null;
      countryCode: string | null;
      city: string | null;
      region: string | null;
    };
    
    // Save visitor data to database
    const visitor = await prisma.visitor.create({
      data: {
        ipAddress: ip,
        country: locationData.country,
        countryCode: locationData.countryCode,
        city: locationData.city,
        region: locationData.region,
        userAgent,
        referer,
        page,
        sessionId: sessionId || null,
      },
    });
    
    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      location: locationData
    });
    
  } catch (error) {
    console.error('Error tracking visitor:', error);
    return NextResponse.json(
      { error: 'Failed to track visitor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d';
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Get visitor statistics
    const [totalVisitors, countryStats, pageStats] = await Promise.all([
      // Total visitors in timeframe
      prisma.visitor.count({
        where: {
          visitedAt: {
            gte: startDate,
          },
        },
      }),
      
      // Visitors by country
      prisma.visitor.groupBy({
        by: ['country', 'countryCode'],
        where: {
          visitedAt: {
            gte: startDate,
          },
          country: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
      
      // Most visited pages
      prisma.visitor.groupBy({
        by: ['page'],
        where: {
          visitedAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      }),
    ]);
    
    return NextResponse.json({
      totalVisitors,
      countryStats: countryStats.map(stat => ({
        country: stat.country,
        countryCode: stat.countryCode,
        count: stat._count.id,
      })),
      pageStats: pageStats.map(stat => ({
        page: stat.page,
        count: stat._count.id,
      })),
      timeframe,
    });
    
  } catch (error) {
    console.error('Error fetching visitor analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

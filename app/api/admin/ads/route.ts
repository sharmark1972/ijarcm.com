import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const adSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  mediaType: z.enum(['IMAGE', 'VIDEO']),
  mediaUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
  position: z.enum(['HOMEPAGE', 'SIDEBAR', 'FOOTER']),
  isEnabled: z.boolean().default(true),
  startDate: z.string().optional().refine((val) => {
    if (!val) return true;
    // Accept both ISO datetime and datetime-local format
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: "Invalid date format" }),
  endDate: z.string().optional().refine((val) => {
    if (!val) return true;
    // Accept both ISO datetime and datetime-local format
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: "Invalid date format" }),
  priority: z.number().int().min(0).max(10).default(0)
});

const updateAdSchema = adSchema.partial();

// POST - Create new advertisement
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
        { error: 'Only administrators can create advertisements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = adSchema.parse(body);

    // Validate media content based on type
    if ((validatedData.mediaType === 'IMAGE' || validatedData.mediaType === 'VIDEO') && !validatedData.mediaUrl) {
      return NextResponse.json(
        { error: 'Media URL is required for image and video types' },
        { status: 400 }
      );
    }

    const advertisement = await prisma.advertisement.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        createdBy: session.user.id
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Advertisement created successfully',
      advertisement
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating advertisement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get advertisements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position');
    const isEnabled = searchParams.get('isEnabled');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const adminView = searchParams.get('admin') === 'true';

    // For non-admin users, only show enabled ads
    const whereClause: any = {};
    
    if (session.user.role !== 'ADMIN' || !adminView) {
      whereClause.isEnabled = true;
      
      // Also filter by date range for public view
      const now = new Date();
      whereClause.OR = [
        { startDate: null },
        { startDate: { lte: now } }
      ];
      whereClause.AND = [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ];
    } else {
      // Admin view - apply filters
      if (position) {
        whereClause.position = position;
      }
      
      if (isEnabled !== null) {
        whereClause.isEnabled = isEnabled === 'true';
      }
    }

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where: whereClause,
        include: session.user.role === 'ADMIN' ? {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        } : undefined,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: adminView ? (page - 1) * limit : 0,
        take: adminView ? limit : undefined
      }),
      adminView ? prisma.advertisement.count({ where: whereClause }) : Promise.resolve(0)
    ]);

    const response: any = { ads };
    
    if (adminView) {
      response.pagination = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update advertisement
export async function PUT(request: NextRequest) {
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
        { error: 'Only administrators can update advertisements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const validatedData = updateAdSchema.parse(updateData);

    // Check if advertisement exists
    const existingAd = await prisma.advertisement.findUnique({
      where: { id }
    });

    if (!existingAd) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    const updatedAd = await prisma.advertisement.update({
      where: { id },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Advertisement updated successfully',
      advertisement: updatedAd
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating advertisement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete advertisement
export async function DELETE(request: NextRequest) {
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
        { error: 'Only administrators can delete advertisements' },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const existingAd = await prisma.advertisement.findUnique({
      where: { id }
    });

    if (!existingAd) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    await prisma.advertisement.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Advertisement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

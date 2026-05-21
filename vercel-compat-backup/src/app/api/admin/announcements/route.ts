import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const announcementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  type: z.enum(['GENERAL', 'MAINTENANCE', 'CONFERENCE', 'DEADLINE', 'SYSTEM']),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']),
  targetAudience: z.enum(['ALL', 'AUTHORS', 'REVIEWERS', 'ADMINS']).optional(),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional()
});

const updateAnnouncementSchema = announcementSchema.partial();

// POST - Create new announcement
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
        { error: 'Only administrators can create announcements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = announcementSchema.parse(body);

    const announcement = await prisma.announcement.create({
      data: {
        ...validatedData,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : null,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
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
      message: 'Announcement created successfully',
      announcement
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get announcements
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
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const isPublished = searchParams.get('isPublished');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const adminView = searchParams.get('admin') === 'true';

    const whereClause: any = {};
    
    // For non-admin users, only show published announcements
    if (session.user.role !== 'ADMIN' || !adminView) {
      whereClause.isPublished = true;
      
      // Also filter by date range for public view
      const now = new Date();
      whereClause.AND = [
        {
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: now } }
          ]
        },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: now } }
          ]
        }
      ];
    } else {
      // Admin view - apply filters
      if (type) {
        whereClause.type = type;
      }
      
      if (priority) {
        whereClause.priority = priority;
      }
      
      if (isPublished !== null) {
        whereClause.isPublished = isPublished === 'true';
      }
      
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } }
        ];
      }
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: whereClause,
        include: {
          creator: session.user.role === 'ADMIN' ? {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          } : undefined
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip: adminView ? (page - 1) * limit : 0,
        take: adminView ? limit : undefined
      }),
      adminView ? prisma.announcement.count({ where: whereClause }) : Promise.resolve(0)
    ]);

    const response: any = { announcements };
    
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
    console.error('Error fetching announcements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update announcement
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
        { error: 'Only administrators can update announcements' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const validatedData = updateAnnouncementSchema.parse(updateData);

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        ...validatedData,
        publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
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
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete announcement
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
        { error: 'Only administrators can delete announcements' },
        { status: 403 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      );
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
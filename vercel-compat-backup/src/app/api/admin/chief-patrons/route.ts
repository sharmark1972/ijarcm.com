import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const chiefPatronSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  institution: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).default(0)
});

const updateChiefPatronSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  title: z.string().min(1, 'Title is required').optional(),
  institution: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  bio: z.string().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().int().min(0).optional()
});

// POST - Create new chief patron
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
        { error: 'Only administrators can create chief patrons' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = chiefPatronSchema.parse(body);

    const chiefPatron = await prisma.chiefPatron.create({
      data: {
        ...validatedData,
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      message: 'Chief patron created successfully',
      chiefPatron
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating chief patron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get chief patrons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};
    
    // For public view, only show active chief patrons
    if (!adminView) {
      whereClause.is_active = true;
    } else {
      // Admin view - check authentication
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
      
      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' as const } },
          { institution: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } }
        ];
      }
    }

    const [chiefPatrons, total] = await Promise.all([
      prisma.chiefPatron.findMany({
        where: whereClause,
        orderBy: [
          { display_order: 'asc' },
          { created_at: 'desc' }
        ],
        skip: adminView ? (page - 1) * limit : 0,
        take: adminView ? limit : undefined
      }),
      adminView ? prisma.chiefPatron.count({ where: whereClause }) : Promise.resolve(0)
    ]);

    const response: any = { chiefPatrons };
    
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
    console.error('Error fetching chief patrons:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update chief patron
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
        { error: 'Only administrators can update chief patrons' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Chief patron ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateChiefPatronSchema.parse(body);

    const chiefPatron = await prisma.chiefPatron.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      message: 'Chief patron updated successfully',
      chiefPatron
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating chief patron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete chief patron
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
        { error: 'Only administrators can delete chief patrons' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Chief patron ID is required' },
        { status: 400 }
      );
    }

    await prisma.chiefPatron.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Chief patron deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting chief patron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
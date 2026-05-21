import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  role: z.enum(['MANAGING_EDITOR', 'ASSOCIATE_EDITOR', 'TECH_LEAD', 'DEVELOPER', 'DESIGNER', 'CONTENT_MANAGER', 'MARKETING', 'MEMBER']),
  institution: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().min(0).default(0)
});

const updateTeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  title: z.string().optional(),
  role: z.enum(['MANAGING_EDITOR', 'ASSOCIATE_EDITOR', 'TECH_LEAD', 'DEVELOPER', 'DESIGNER', 'CONTENT_MANAGER', 'MARKETING', 'MEMBER']).optional(),
  institution: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  bio: z.string().optional(),
  expertise: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional()
});

// POST - Create new team member
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
        { error: 'Only administrators can create team members' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = teamMemberSchema.parse(body);

    const teamMember = await prisma.teamMember.create({
      data: validatedData
    });

    return NextResponse.json({
      message: 'Team member created successfully',
      teamMember
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get team members
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminView = searchParams.get('admin') === 'true';
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};
    
    // For public view, only show active team members
    if (!adminView) {
      whereClause.isActive = true;
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
          { title: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } }
        ];
      }

      if (role) {
        whereClause.role = role;
      }
    }

    const [teamMembers, total] = await Promise.all([
      prisma.teamMember.findMany({
        where: whereClause,
        orderBy: [
          { displayOrder: 'asc' },
          { createdAt: 'desc' }
        ],
        skip: adminView ? (page - 1) * limit : 0,
        take: adminView ? limit : undefined
      }),
      adminView ? prisma.teamMember.count({ where: whereClause }) : Promise.resolve(0)
    ]);

    console.log('Team members query result:', { 
      whereClause, 
      count: teamMembers.length, 
      total,
      teamMembers: teamMembers.map(m => ({ id: m.id, name: m.name, role: m.role }))
    });

    const response: any = { teamMembers };
    
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
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update team member
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
        { error: 'Only administrators can update team members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      message: 'Team member updated successfully',
      teamMember
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member
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
        { error: 'Only administrators can delete team members' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Team member deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

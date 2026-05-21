import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateChiefPatronSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  title: z.string().min(1).max(200).optional(),
  institution: z.string().min(1).max(200).optional(),
  imageUrl: z.string().url().or(z.literal('')).optional(),
  bio: z.string().max(1000).optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

// GET - Get specific chief patron
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const chiefPatron = await prisma.chiefPatron.findUnique({
      where: { id }
    });

    if (!chiefPatron) {
      return NextResponse.json(
        { error: 'Chief patron not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ chiefPatron });

  } catch (error) {
    console.error('Error fetching chief patron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update specific chief patron
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
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

// DELETE - Delete specific chief patron
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Check if chief patron exists
    const existingPatron = await prisma.chiefPatron.findUnique({
      where: { id }
    });

    if (!existingPatron) {
      return NextResponse.json(
        { error: 'Chief patron not found' },
        { status: 404 }
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

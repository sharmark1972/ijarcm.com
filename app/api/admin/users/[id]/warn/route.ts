import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// POST /api/admin/users/[id]/warn - Warn a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Warning message is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from warning themselves
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot warn yourself' },
        { status: 400 }
      );
    }

    // Prevent warning other admins
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot warn other administrators' },
        { status: 400 }
      );
    }

    // Check if user is banned
    if (existingUser.isBanned) {
      return NextResponse.json(
        { error: 'Cannot warn a banned user' },
        { status: 400 }
      );
    }

    // Warn the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isWarned: true,
        warningMessage: message.trim(),
        warningDate: new Date()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isWarned: true,
        warningMessage: true,
        warningDate: true
      }
    });

    return NextResponse.json({
      message: 'User warned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error warning user:', error);
    return NextResponse.json(
      { error: 'Failed to warn user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/warn - Remove warning from a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user actually has a warning
    if (!existingUser.isWarned) {
      return NextResponse.json(
        { error: 'User does not have an active warning' },
        { status: 400 }
      );
    }

    // Remove warning from the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isWarned: false,
        warningMessage: null,
        warningDate: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isWarned: true,
        warningMessage: true,
        warningDate: true
      }
    });

    return NextResponse.json({
      message: 'Warning removed successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error removing warning:', error);
    return NextResponse.json(
      { error: 'Failed to remove warning' },
      { status: 500 }
    );
  }
}

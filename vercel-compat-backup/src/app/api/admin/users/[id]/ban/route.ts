import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// POST /api/admin/users/[id]/ban - Ban a user
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
    const { reason } = body;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ban reason is required' },
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

    // Prevent admin from banning themselves
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot ban yourself' },
        { status: 400 }
      );
    }

    // Prevent banning other admins
    if (existingUser.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'Cannot ban other administrators' },
        { status: 400 }
      );
    }

    // Check if user is already banned
    if (existingUser.isBanned) {
      return NextResponse.json(
        { error: 'User is already banned' },
        { status: 400 }
      );
    }

    // Ban the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isBanned: true,
        banReason: reason.trim()
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isBanned: true,
        banReason: true
      }
    });

    return NextResponse.json({
      message: 'User banned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error banning user:', error);
    return NextResponse.json(
      { error: 'Failed to ban user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id]/ban - Unban a user
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

    // Check if user is actually banned
    if (!existingUser.isBanned) {
      return NextResponse.json(
        { error: 'User is not banned' },
        { status: 400 }
      );
    }

    // Unban the user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isBanned: false,
        banReason: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isBanned: true,
        banReason: true
      }
    });

    return NextResponse.json({
      message: 'User unbanned successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    return NextResponse.json(
      { error: 'Failed to unban user' },
      { status: 500 }
    );
  }
}
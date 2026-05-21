import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ bookmarked: false });
    }

    const paperId = params.id;
    const userId = session.user.id;

    const bookmark = await prisma.bookmark.findFirst({
      where: {
        userId: userId,
        paperId: paperId
      }
    });

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Error checking bookmark status:', error);
    return NextResponse.json({ bookmarked: false });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;
    const userId = session.user.id;

    // Check if bookmark already exists
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: userId,
        paperId: paperId
      }
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Paper already bookmarked' },
        { status: 400 }
      );
    }

    // Create bookmark
    await prisma.bookmark.create({
      data: {
        userId: userId,
        paperId: paperId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark paper' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;
    const userId = session.user.id;

    // Remove bookmark
    await prisma.bookmark.deleteMany({
      where: {
        userId: userId,
        paperId: paperId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}

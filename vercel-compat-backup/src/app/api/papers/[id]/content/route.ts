import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch paper content
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;

    // First verify the paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        submitterId: true
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = paper.submitterId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get paper content (may not exist yet)
    const paperContent = await prisma.paperContent.findUnique({
      where: { paperId }
    });

    // Return empty content if none exists yet
    if (!paperContent) {
      return NextResponse.json({
        success: true,
        content: {
          introduction: '',
          literatureReview: '',
          methodology: '',
          results: '',
          discussion: '',
          conclusion: '',
          references: '',
          images: []
        }
      });
    }

    return NextResponse.json({
      success: true,
      content: {
        introduction: paperContent.introduction,
        literatureReview: paperContent.literatureReview,
        methodology: paperContent.methodology,
        results: paperContent.results,
        discussion: paperContent.discussion,
        conclusion: paperContent.conclusion,
        references: paperContent.references,
        images: paperContent.images
      }
    });
  } catch (error) {
    console.error('Error fetching paper content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper content' },
      { status: 500 }
    );
  }
}

// POST - Save or update paper content
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;
    const body = await request.json();

    // Verify paper exists and user has permission
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        submitterId: true
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = paper.submitterId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Save or update paper content
    const paperContent = await prisma.paperContent.upsert({
      where: { paperId },
      create: {
        paperId,
        introduction: body.introduction || null,
        literatureReview: body.literatureReview || null,
        methodology: body.methodology || null,
        results: body.results || null,
        discussion: body.discussion || null,
        conclusion: body.conclusion || null,
        references: body.references || null,
        images: body.images || []
      },
      update: {
        introduction: body.introduction || null,
        literatureReview: body.literatureReview || null,
        methodology: body.methodology || null,
        results: body.results || null,
        discussion: body.discussion || null,
        conclusion: body.conclusion || null,
        references: body.references || null,
        images: body.images || []
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paper content saved successfully',
      contentId: paperContent.id
    });
  } catch (error) {
    console.error('Error saving paper content:', error);
    return NextResponse.json(
      { error: 'Failed to save paper content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete paper content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;

    // Verify paper exists and user has permission
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        submitterId: true
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = paper.submitterId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete paper content
    await prisma.paperContent.delete({
      where: { paperId }
    });

    return NextResponse.json({
      success: true,
      message: 'Paper content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting paper content:', error);
    return NextResponse.json(
      { error: 'Failed to delete paper content' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload';

export async function POST(
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

    const paperId = params.id;

    // Check if paper exists and user has permission using raw query
    const existingPaper = await prisma.$queryRaw`
      SELECT id, submitter_id, status, cover_image
      FROM papers
      WHERE id = ${paperId}
    ` as any[];
    
    if (!existingPaper || existingPaper.length === 0) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }
    
    const paper = existingPaper[0];

    // Check permissions (only admins can upload cover images)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to upload cover image' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer and upload to R2
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const coverImagePath = await uploadToR2(buffer, file.name, 'papers/covers');

    // Delete old cover image if exists
    if (paper.cover_image) {
      try {
        await deleteFromR2(paper.cover_image);
      } catch (error) {
        console.error('Error deleting old cover image:', error);
      }
    }

    await prisma.$executeRaw`
      UPDATE papers
      SET cover_image = ${coverImagePath}
      WHERE id = ${paperId}
    `;

    return NextResponse.json({
      success: true,
      coverImage: coverImagePath,
      message: 'Cover image uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading cover image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const paperId = params.id;

    // Check if paper exists and user has permission using raw query
    const existingPaper = await prisma.$queryRaw`
      SELECT id, submitter_id, status, cover_image
      FROM papers
      WHERE id = ${paperId}
    ` as any[];
    
    if (!existingPaper || existingPaper.length === 0) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }
    
    const paper = existingPaper[0];

    // Check permissions (only admins can delete cover images)
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete cover image' },
        { status: 403 }
      );
    }

    if (!paper.cover_image) {
      return NextResponse.json(
        { error: 'No cover image to delete' },
        { status: 404 }
      );
    }

    // Delete the file from R2
    try {
      await deleteFromR2(paper.cover_image);
    } catch (error) {
      console.error('Error deleting cover image file:', error);
    }

    // Update paper to remove cover image reference
    await prisma.$executeRaw`
      UPDATE papers
      SET cover_image = NULL
      WHERE id = ${paperId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Cover image deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cover image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
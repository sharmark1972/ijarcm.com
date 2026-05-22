import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2, deleteFromR2 } from '@/lib/r2-upload';
import { isRemoteFilePath } from '@/lib/file-storage';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const ebook = await prisma.ebook.findUnique({
      where: { id: params.id }
    });

    if (!ebook) {
      return NextResponse.json({ error: 'Ebook not found' }, { status: 404 });
    }

    return NextResponse.json({ ebook });
  } catch (error) {
    console.error('Error fetching ebook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ebook' },
      { status: 500 }
    );
  }
}

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
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if ebook exists
    const existingEbook = await prisma.ebook.findUnique({
      where: { id: params.id }
    });

    if (!existingEbook) {
      return NextResponse.json({ error: 'Ebook not found' }, { status: 404 });
    }

    // Parse form data
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const tags = formData.get('tags') as string;
    const accessType = formData.get('accessType') as string;
    const price = formData.get('price') as string;
    const trialPages = formData.get('trialPages') as string;
    const totalPages = formData.get('totalPages') as string;
    const isPublished = formData.get('isPublished') === 'true';
    const pdfFile = formData.get('pdfFile') as File;
    const coverFile = formData.get('coverFile') as File;

    // Validate required fields
    if (!title || !author || !description || !category || !accessType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, description, category, and accessType are required' },
        { status: 400 }
      );
    }

    // Validate file type for PDF if provided
    if (pdfFile && !pdfFile.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed for ebook content' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit for PDF) if provided
    if (pdfFile) {
      const maxPdfSize = 50 * 1024 * 1024; // 50MB
      if (pdfFile.size > maxPdfSize) {
        return NextResponse.json(
          { error: 'PDF file size must be less than 50MB' },
          { status: 400 }
        );
      }
    }

    // Validate cover image if provided
    if (coverFile && !coverFile.type.includes('image')) {
      return NextResponse.json(
        { error: 'Only image files are allowed for cover' },
        { status: 400 }
      );
    }

    // Validate cover image size if provided (5MB limit)
    if (coverFile) {
      const maxCoverSize = 5 * 1024 * 1024; // 5MB
      if (coverFile.size > maxCoverSize) {
        return NextResponse.json(
          { error: 'Cover image size must be less than 5MB' },
          { status: 400 }
        );
      }
    }

    // Validate access type
    const validAccessTypes = ['PUBLIC', 'LOGGED_IN_ONLY', 'PAID'];
    if (!validAccessTypes.includes(accessType)) {
      return NextResponse.json(
        { error: 'Invalid access type value' },
        { status: 400 }
      );
    }

    // Validate price for paid access
    let parsedPrice: number | null = null;
    if (accessType === 'PAID') {
      if (!price) {
        return NextResponse.json(
          { error: 'Price is required for paid access type' },
          { status: 400 }
        );
      }
      parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number' },
          { status: 400 }
        );
      }
    }

    const timestamp = Date.now();
    let relativePdfPath = existingEbook.file_path;
    let relativeCoverPath = existingEbook.coverImage;

    // Save new PDF file if provided
    if (pdfFile) {
      if (isRemoteFilePath(existingEbook.file_path)) {
        await deleteFromR2(existingEbook.file_path);
      }

      const pdfExtension = pdfFile.name.split('.').pop();
      const pdfFileName = `ebook_${timestamp}.${pdfExtension}`;
      const pdfBytes = await pdfFile.arrayBuffer();
      const pdfBuffer = Buffer.from(pdfBytes);
      relativePdfPath = await uploadToR2(pdfBuffer, pdfFileName, 'ebooks', pdfFile.type || 'application/pdf');
    }

    // Save new cover image if provided
    if (coverFile) {
      if (isRemoteFilePath(existingEbook.coverImage)) {
        await deleteFromR2(existingEbook.coverImage);
      }

      const coverExtension = coverFile.name.split('.').pop();
      const coverFileName = `ebook_cover_${timestamp}.${coverExtension}`;
      const coverBytes = await coverFile.arrayBuffer();
      const coverBuffer = Buffer.from(coverBytes);
      relativeCoverPath = await uploadToR2(coverBuffer, coverFileName, 'ebooks/covers', coverFile.type || 'application/octet-stream');
    }

    // Update ebook record in database
    const ebook = await prisma.ebook.update({
      where: { id: params.id },
      data: {
        title,
        author,
        description,
        category,
        tags: tags || null,
        access_type: accessType as 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID',
        price: parsedPrice,
        trial_pages: trialPages ? parseInt(trialPages) : existingEbook.trial_pages,
        total_pages: totalPages ? parseInt(totalPages) : existingEbook.total_pages,
        is_published: isPublished,
        published_at: isPublished && !existingEbook.published_at ? new Date() : existingEbook.published_at,
        file_path: relativePdfPath,
        coverImage: relativeCoverPath
      }
    });

    // Fetch updated ebook
    const updatedEbook = await prisma.ebook.findUnique({
      where: { id: ebook.id }
    });

    return NextResponse.json({
      success: true,
      ebook: updatedEbook,
      message: 'Ebook updated successfully'
    });

  } catch (error) {
    console.error('Error updating ebook:', error);
    return NextResponse.json(
      { error: 'Failed to update ebook' },
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Check if ebook exists
    const existingEbook = await prisma.ebook.findUnique({
      where: { id: params.id }
    });

    if (!existingEbook) {
      return NextResponse.json({ error: 'Ebook not found' }, { status: 404 });
    }

    if (isRemoteFilePath(existingEbook.file_path)) {
      await deleteFromR2(existingEbook.file_path);
    }

    if (isRemoteFilePath(existingEbook.coverImage)) {
      await deleteFromR2(existingEbook.coverImage);
    }

    // Delete ebook record (this will cascade delete related records)
    await prisma.ebook.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Ebook deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ebook:', error);
    return NextResponse.json(
      { error: 'Failed to delete ebook' },
      { status: 500 }
    );
  }
}

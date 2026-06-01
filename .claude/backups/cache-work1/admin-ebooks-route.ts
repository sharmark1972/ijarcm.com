import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2-upload';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const accessTypeFilter = searchParams.get('accessType') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        author?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        tags?: { contains: string; mode: 'insensitive' };
      }>;
      category?: string;
      access_type?: 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID';
    } = {};

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { author: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    if (categoryFilter !== 'ALL') {
      where.category = categoryFilter;
    }

    if (accessTypeFilter !== 'ALL') {
      where.access_type = accessTypeFilter as 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID';
    }

    // Get total count
    const totalEbooks = await prisma.ebook.count({ where });
    const totalPages = Math.ceil(totalEbooks / limit);

    // Get ebooks with pagination
    const ebooks = await prisma.ebook.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format ebooks data
    const formattedEbooks = ebooks.map(ebook => ({
      id: ebook.id,
      title: ebook.title,
      author: ebook.author,
      description: ebook.description,
      category: ebook.category,
      tags: ebook.tags ? ebook.tags.split(',').map(t => t.trim()) : [],
      accessType: ebook.access_type,
      price: ebook.price,
      isPublished: ebook.is_published,
      publishedAt: ebook.published_at,
      trialPages: ebook.trial_pages,
      totalPages: ebook.total_pages,
      coverImage: ebook.coverImage,
      filePath: ebook.file_path,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      createdBy: ebook.created_by,
      purchaseCount: 0,
      viewCount: 0
    }));

    return NextResponse.json({
      ebooks: formattedEbooks,
      totalEbooks,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching ebooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ebooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
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
    if (!title || !author || !description || !category || !accessType || !pdfFile) {
      return NextResponse.json(
        { error: 'Missing required fields: title, author, description, category, accessType, and pdfFile are required' },
        { status: 400 }
      );
    }

    // Validate file type for PDF
    if (!pdfFile.type.includes('pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are allowed for ebook content' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit for PDF)
    const maxPdfSize = 50 * 1024 * 1024; // 50MB
    if (pdfFile.size > maxPdfSize) {
      return NextResponse.json(
        { error: 'PDF file size must be less than 50MB' },
        { status: 400 }
      );
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

    // Upload PDF to R2
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(pdfBytes);
    const relativePdfPath = await uploadToR2(pdfBuffer, pdfFile.name, 'ebooks');

    // Upload cover image if provided
    let relativeCoverPath: string | null = null;
    if (coverFile) {
      const coverBytes = await coverFile.arrayBuffer();
      const coverBuffer = Buffer.from(coverBytes);
      relativeCoverPath = await uploadToR2(coverBuffer, coverFile.name, 'ebooks/covers');
    }

    // Create ebook record in database
    const ebook = await prisma.ebook.create({
      data: {
        title,
        author,
        description,
        category,
        tags: tags || null,
        access_type: accessType as 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID',
        price: parsedPrice,
        trial_pages: trialPages ? parseInt(trialPages) : 5,
        total_pages: totalPages ? parseInt(totalPages) : null,
        is_published: isPublished,
        published_at: isPublished ? new Date() : null,
        file_path: relativePdfPath,
        coverImage: relativeCoverPath,
        created_by: session.user.id
      }
    });

    // Fetch created ebook with relationships
    const createdEbook = await prisma.ebook.findUnique({
      where: { id: ebook.id }
    });

    return NextResponse.json({
      success: true,
      ebook: createdEbook,
      message: 'Ebook created successfully'
    });

  } catch (error) {
    console.error('Error creating ebook:', error);
    return NextResponse.json(
      { error: 'Failed to create ebook' },
      { status: 500 }
    );
  }
}
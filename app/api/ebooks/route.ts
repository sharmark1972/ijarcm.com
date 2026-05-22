import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const accessTypeFilter = searchParams.get('accessType') || 'ALL';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Build where clause - only show published ebooks
    const where: {
      is_published: boolean;
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' };
        author?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        tags?: { contains: string; mode: 'insensitive' };
      }>;
      category?: string;
      access_type?: 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID';
    } = {
      is_published: true
    };

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

    // Note: featured field not available in current schema

    // Get total count
    const totalEbooks = await prisma.ebook.count({ where });
    const totalPages = Math.ceil(totalEbooks / limit);

    // Get ebooks with pagination
    const ebooks = await prisma.ebook.findMany({
      where,
      orderBy: {
        published_at: 'desc'
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
      trialPages: ebook.trial_pages,
      totalPages: ebook.total_pages,
      coverImage: ebook.coverImage,
      createdAt: ebook.createdAt,
      updatedAt: ebook.updatedAt,
      publishedAt: ebook.published_at,
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
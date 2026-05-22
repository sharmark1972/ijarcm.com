import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ebook = await prisma.ebook.findUnique({
      where: {
        id: params.id,
        is_published: true
      },
      select: {
        id: true,
        title: true,
        author: true,
        description: true,
        category: true,
        tags: true,
        access_type: true,
        price: true,
        trial_pages: true,
        total_pages: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        published_at: true
      }
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
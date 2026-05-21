import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/seo/[id] - Get specific SEO configuration
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const seoConfig = await prisma.sEOConfig.findUnique({
      where: {
        id: params.id
      }
    });

    if (!seoConfig) {
      return NextResponse.json(
        { error: 'SEO configuration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ seoConfig });
  } catch (error) {
    console.error('Error fetching SEO config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/seo/[id] - Update SEO configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      page,
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      canonicalUrl,
      robots
    } = body;

    // Validate required fields
    if (!page || !title || !description) {
      return NextResponse.json(
        { error: 'Page, title, and description are required' },
        { status: 400 }
      );
    }

    // Check if SEO config exists
    const existingConfig = await prisma.sEOConfig.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SEO configuration not found' },
        { status: 404 }
      );
    }

    // Check if another config with the same page exists (excluding current)
    const duplicateConfig = await prisma.sEOConfig.findFirst({
      where: {
        page,
        id: {
          not: params.id
        }
      }
    });

    if (duplicateConfig) {
      return NextResponse.json(
        { error: 'SEO configuration for this page already exists' },
        { status: 409 }
      );
    }

    const updatedConfig = await prisma.sEOConfig.update({
      where: {
        id: params.id
      },
      data: {
        page,
        title,
        description,
        keywords: keywords || null,
        ogTitle: ogTitle || null,
        ogDescription: ogDescription || null,
        ogImage: ogImage || null,
        twitterTitle: twitterTitle || null,
        twitterDescription: twitterDescription || null,
        twitterImage: twitterImage || null,
        canonicalUrl: canonicalUrl || null,
        robots: robots || 'index, follow',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ seoConfig: updatedConfig });
  } catch (error) {
    console.error('Error updating SEO config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/seo/[id] - Delete SEO configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if SEO config exists
    const existingConfig = await prisma.sEOConfig.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SEO configuration not found' },
        { status: 404 }
      );
    }

    await prisma.sEOConfig.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json(
      { message: 'SEO configuration deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting SEO config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
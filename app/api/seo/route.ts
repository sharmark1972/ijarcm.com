import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Validation schema for SEO config
const seoConfigSchema = z.object({
  page: z.string().min(1, 'Page is required'),
  title: z.string().min(1, 'Title is required').max(60, 'Title must be under 60 characters'),
  description: z.string().min(1, 'Description is required').max(160, 'Description must be under 160 characters'),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url().optional().or(z.literal('')),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url().optional().or(z.literal('')),
  canonicalUrl: z.string().url().optional().or(z.literal('')),
  robots: z.string().optional(),
});

// Check if user is admin
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return false;
  }
  return true;
}

// GET - Fetch all SEO configs or specific page
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};

    if (page) {
      whereClause.page = page;
    }

    if (search) {
      whereClause.OR = [
        { page: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [seoConfigs, total] = await Promise.all([
      prisma.sEOConfig.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.sEOConfig.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      data: seoConfigs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching SEO configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SEO configurations' },
      { status: 500 }
    );
  }
}

// POST - Create new SEO config
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = seoConfigSchema.parse(body);

    // Check if SEO config for this page already exists
    const existingConfig = await prisma.sEOConfig.findUnique({
      where: { page: validatedData.page },
    });

    if (existingConfig) {
      return NextResponse.json(
        { error: 'SEO configuration for this page already exists' },
        { status: 409 }
      );
    }

    // Create new SEO config
    const seoConfig = await prisma.sEOConfig.create({
      data: validatedData,
    });

    return NextResponse.json({
      message: 'SEO configuration created successfully',
      data: seoConfig,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating SEO config:', error);
    return NextResponse.json(
      { error: 'Failed to create SEO configuration' },
      { status: 500 }
    );
  }
}

// PUT - Update existing SEO config
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'SEO config ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validatedData = seoConfigSchema.parse(body);

    // Check if SEO config exists
    const existingConfig = await prisma.sEOConfig.findUnique({
      where: { id: id as string },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'SEO configuration not found' },
        { status: 404 }
      );
    }

    // Check if another config exists for the same page (if page is being changed)
    if (validatedData.page !== existingConfig.page) {
      const duplicateConfig = await prisma.sEOConfig.findUnique({
        where: { page: validatedData.page },
      });

      if (duplicateConfig) {
        return NextResponse.json(
          { error: 'SEO configuration for this page already exists' },
          { status: 409 }
        );
      }
    }

    // Update SEO config
    const updatedConfig = await prisma.sEOConfig.update({
      where: { id: id as string },
      data: validatedData,
    });

    return NextResponse.json({
      message: 'SEO configuration updated successfully',
      data: updatedConfig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating SEO config:', error);
    return NextResponse.json(
      { error: 'Failed to update SEO configuration' },
      { status: 500 }
    );
  }
}

// DELETE - Delete SEO config
export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // For bulk delete

    if (!id && !ids) {
      return NextResponse.json(
        { error: 'SEO config ID or IDs are required' },
        { status: 400 }
      );
    }

    if (ids) {
      // Bulk delete
      const idArray = ids.split(',').filter(Boolean);
      
      const deleteResult = await prisma.sEOConfig.deleteMany({
        where: {
          id: {
            in: idArray,
          },
        },
      });

      return NextResponse.json({
        message: `${deleteResult.count} SEO configurations deleted successfully`,
        deletedCount: deleteResult.count,
      });
    } else {
      // Single delete
      const existingConfig = await prisma.sEOConfig.findUnique({
        where: { id: id as string },
      });

      if (!existingConfig) {
        return NextResponse.json(
          { error: 'SEO configuration not found' },
          { status: 404 }
        );
      }

      await prisma.sEOConfig.delete({
        where: { id: id as string },
      });

      return NextResponse.json({
        message: 'SEO configuration deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error deleting SEO config:', error);
    return NextResponse.json(
      { error: 'Failed to delete SEO configuration' },
      { status: 500 }
    );
  }
}

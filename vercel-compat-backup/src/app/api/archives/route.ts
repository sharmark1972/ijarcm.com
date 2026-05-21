import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const createArchiveSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  volume: z.string().min(1, 'Volume is required'),
  issue: z.string().min(1, 'Issue is required'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  publishedDate: z.string().transform((str) => new Date(str)),
  coverImageUrl: z.string().url().optional(),
  isPublished: z.boolean().optional()
});

const updateArchiveSchema = createArchiveSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const volume = searchParams.get('volume');
    const isPublished = searchParams.get('isPublished');
    const includeArchivePapers = searchParams.get('includeArchivePapers');

    const where: Prisma.ArchiveWhereInput = {};
    if (year) where.year = parseInt(year);
    if (volume) where.volume = volume;
    if (isPublished !== null) where.isPublished = isPublished === 'true';

    const include = includeArchivePapers === 'true' ? {
      archivePapers: {
          include: {
            paper: {
              select: {
                id: true,
                title: true,
                abstract: true,
                keywords: true,
                filePath: true,
                publishedAt: true,
                paperAuthors: {
                  include: {
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        institution: true
                      }
                    }
                  },
                  orderBy: { authorOrder: Prisma.SortOrder.asc }
                }
              }
            }
          },
          orderBy: { createdAt: Prisma.SortOrder.asc }
        }
    } : undefined;

    const archives = await prisma.archive.findMany({
      where,
      include: {
        ...include,
        _count: {
          select: {
            archivePapers: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { volume: 'desc' },
        { issue: 'desc' }
      ]
    });

    return NextResponse.json(archives);
  } catch (error) {
    console.error('Error fetching archives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archives' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createArchiveSchema.parse(body);

    // Check if archive with same volume and issue already exists
    const existingArchive = await prisma.archive.findFirst({
      where: {
        volume: validatedData.volume,
        issue: validatedData.issue
      }
    });

    if (existingArchive) {
      return NextResponse.json(
        { error: 'An archive with this volume and issue already exists' },
        { status: 400 }
      );
    }

    const archive = await prisma.archive.create({
      data: {
        ...validatedData,
        isPublished: validatedData.isPublished ?? false
      }
    });

    return NextResponse.json(archive, { status: 201 });
  } catch (error) {
    console.error('Error creating archive:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create archive' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const archiveId = searchParams.get('id');

    if (!archiveId) {
      return NextResponse.json(
        { error: 'Archive ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateArchiveSchema.parse(body);

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: archiveId }
    });

    if (!existingArchive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      );
    }

    // Check if volume/issue combination is being changed and if it conflicts
    if ((validatedData.volume || validatedData.issue) && 
        (validatedData.volume !== existingArchive.volume || validatedData.issue !== existingArchive.issue)) {
      const volumeIssueConflict = await prisma.archive.findFirst({
        where: {
          volume: validatedData.volume ?? existingArchive.volume,
          issue: validatedData.issue ?? existingArchive.issue,
          id: { not: archiveId }
        }
      });

      if (volumeIssueConflict) {
        return NextResponse.json(
          { error: 'An archive with this volume and issue already exists' },
          { status: 400 }
        );
      }
    }

    const updatedArchive = await prisma.archive.update({
      where: { id: archiveId },
      data: validatedData
    });

    return NextResponse.json(updatedArchive);
  } catch (error) {
    console.error('Error updating archive:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update archive' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const archiveId = searchParams.get('id');

    if (!archiveId) {
      return NextResponse.json(
        { error: 'Archive ID is required' },
        { status: 400 }
      );
    }

    // Check if archive exists
    const existingArchive = await prisma.archive.findUnique({
      where: { id: archiveId },
      include: { archivePapers: true }
    });

    if (!existingArchive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      );
    }

    // Delete archive papers first, then archive
    await prisma.archivePaper.deleteMany({
      where: { archiveId }
    });

    await prisma.archive.delete({
      where: { id: archiveId }
    });

    return NextResponse.json({ message: 'Archive deleted successfully' });
  } catch (error) {
    console.error('Error deleting archive:', error);
    return NextResponse.json(
      { error: 'Failed to delete archive' },
      { status: 500 }
    );
  }
}
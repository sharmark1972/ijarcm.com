import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const issueUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  volume: z.string().min(1, 'Volume is required').optional(),
  issueNumber: z.string().min(1, 'Issue number is required').optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  publishDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }).optional(),
  coverImage: z.string().url().optional().or(z.literal('')).optional(),
  isPublished: z.boolean().optional(),
});

// GET - Get a single issue by ID
export async function GET(
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

    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        papers: {
          select: {
            id: true,
            title: true,
            abstract: true,
            status: true,
            publishedAt: true,
            paperAuthors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: { papers: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

// PUT - Update an issue
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

    const body = await request.json();
    const validatedData = issueUpdateSchema.parse(body);

    // Check if issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: { id: params.id },
    });

    if (!existingIssue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // If volume or issueNumber is being updated, check for duplicates
    if (validatedData.volume || validatedData.issueNumber) {
      const duplicateIssue = await prisma.issue.findFirst({
        where: {
          volume: validatedData.volume || existingIssue.volume,
          issueNumber: validatedData.issueNumber || existingIssue.issueNumber,
          id: { not: params.id },
        },
      });

      if (duplicateIssue) {
        return NextResponse.json(
          { error: 'An issue with this volume and issue number already exists' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (validatedData.title !== undefined) updateData.title = validatedData.title;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.volume !== undefined) updateData.volume = validatedData.volume;
    if (validatedData.issueNumber !== undefined) updateData.issueNumber = validatedData.issueNumber;
    if (validatedData.year !== undefined) updateData.year = validatedData.year;
    if (validatedData.publishDate !== undefined) updateData.publishDate = new Date(validatedData.publishDate);
    if (validatedData.coverImage !== undefined) updateData.coverImage = validatedData.coverImage || null;
    if (validatedData.isPublished !== undefined) updateData.isPublished = validatedData.isPublished;

    const issue = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an issue
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

    // Check if issue exists
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if issue has papers
    if (issue._count.papers > 0) {
      return NextResponse.json(
        { error: 'Cannot delete issue with published papers. Please remove papers first.' },
        { status: 400 }
      );
    }

    await prisma.issue.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}

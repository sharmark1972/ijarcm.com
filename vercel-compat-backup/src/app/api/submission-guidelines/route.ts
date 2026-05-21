import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createGuidelineSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  category: z.enum(['GENERAL', 'FORMATTING', 'SUBMISSION_PROCESS', 'ETHICAL_GUIDELINES', 'TECHNICAL_REQUIREMENTS', 'REVIEW_PROCESS']),
  displayOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional()
});

const updateGuidelineSchema = createGuidelineSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (category) where.category = category;
    if (isActive !== null) where.isPublished = isActive === 'true';

    const guidelines = await prisma.submissionGuideline.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json(guidelines);
  } catch (error) {
    console.error('Error fetching submission guidelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission guidelines' },
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
    const validatedData = createGuidelineSchema.parse(body);

    // Get the next display order for the category
    const maxOrder = await prisma.submissionGuideline.findFirst({
      where: { category: validatedData.category },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });

    const guideline = await prisma.submissionGuideline.create({
      data: {
        ...validatedData,
        displayOrder: validatedData.displayOrder ?? (maxOrder?.displayOrder ?? 0) + 1,
        isPublished: validatedData.isPublished ?? true
      }
    });

    return NextResponse.json(guideline, { status: 201 });
  } catch (error) {
    console.error('Error creating submission guideline:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create submission guideline' },
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
    const guidelineId = searchParams.get('id');

    if (!guidelineId) {
      return NextResponse.json(
        { error: 'Guideline ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateGuidelineSchema.parse(body);

    // Check if guideline exists
    const existingGuideline = await prisma.submissionGuideline.findUnique({
      where: { id: guidelineId }
    });

    if (!existingGuideline) {
      return NextResponse.json(
        { error: 'Submission guideline not found' },
        { status: 404 }
      );
    }

    const updatedGuideline = await prisma.submissionGuideline.update({
      where: { id: guidelineId },
      data: validatedData
    });

    return NextResponse.json(updatedGuideline);
  } catch (error) {
    console.error('Error updating submission guideline:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update submission guideline' },
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
    const guidelineId = searchParams.get('id');

    if (!guidelineId) {
      return NextResponse.json(
        { error: 'Guideline ID is required' },
        { status: 400 }
      );
    }

    // Check if guideline exists
    const existingGuideline = await prisma.submissionGuideline.findUnique({
      where: { id: guidelineId }
    });

    if (!existingGuideline) {
      return NextResponse.json(
        { error: 'Submission guideline not found' },
        { status: 404 }
      );
    }

    await prisma.submissionGuideline.delete({
      where: { id: guidelineId }
    });

    return NextResponse.json({ message: 'Submission guideline deleted successfully' });
  } catch (error) {
    console.error('Error deleting submission guideline:', error);
    return NextResponse.json(
      { error: 'Failed to delete submission guideline' },
      { status: 500 }
    );
  }
}
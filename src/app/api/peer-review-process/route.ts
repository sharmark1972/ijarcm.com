import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createPeerReviewProcessSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  step: z.number().int().min(1, 'Step number must be at least 1'),
  displayOrder: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional()
});

const updatePeerReviewProcessSchema = createPeerReviewProcessSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (isActive !== null) where.isPublished = isActive === 'true';

    const processes = await prisma.peerReviewProcess.findMany({
      where,
      orderBy: [
        { step: 'asc' },
        { title: 'asc' }
      ]
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error('Error fetching peer review processes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peer review processes' },
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
    const validatedData = createPeerReviewProcessSchema.parse(body);

    // Check if step number already exists
    const existingStep = await prisma.peerReviewProcess.findFirst({
      where: { step: validatedData.step }
    });

    if (existingStep) {
      return NextResponse.json(
        { error: 'A step with this number already exists' },
        { status: 400 }
      );
    }

    const process = await prisma.peerReviewProcess.create({
      data: {
        ...validatedData,
        isPublished: validatedData.isPublished ?? true
      }
    });

    return NextResponse.json(process, { status: 201 });
  } catch (error) {
    console.error('Error creating peer review process:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create peer review process' },
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
    const processId = searchParams.get('id');

    if (!processId) {
      return NextResponse.json(
        { error: 'Process ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updatePeerReviewProcessSchema.parse(body);

    // Check if process exists
    const existingProcess = await prisma.peerReviewProcess.findUnique({
      where: { id: processId }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Peer review process not found' },
        { status: 404 }
      );
    }

    // Check if step number is being changed and if it conflicts
    if (validatedData.step && validatedData.step !== existingProcess.step) {
      const stepConflict = await prisma.peerReviewProcess.findFirst({
        where: {
          step: validatedData.step,
          id: { not: processId }
        }
      });

      if (stepConflict) {
        return NextResponse.json(
          { error: 'A step with this number already exists' },
          { status: 400 }
        );
      }
    }

    const updatedProcess = await prisma.peerReviewProcess.update({
      where: { id: processId },
      data: validatedData
    });

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error('Error updating peer review process:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update peer review process' },
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
    const processId = searchParams.get('id');

    if (!processId) {
      return NextResponse.json(
        { error: 'Process ID is required' },
        { status: 400 }
      );
    }

    // Check if process exists
    const existingProcess = await prisma.peerReviewProcess.findUnique({
      where: { id: processId }
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: 'Peer review process not found' },
        { status: 404 }
      );
    }

    await prisma.peerReviewProcess.delete({
      where: { id: processId }
    });

    return NextResponse.json({ message: 'Peer review process deleted successfully' });
  } catch (error) {
    console.error('Error deleting peer review process:', error);
    return NextResponse.json(
      { error: 'Failed to delete peer review process' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAdvisoryMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  expertise: z.string().optional(),
  resumeUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  email: z.string().email().optional(),
  institution: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional()
});

const updateAdvisoryMemberSchema = createAdvisoryMemberSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    const where: Record<string, unknown> = {};
    if (isActive !== null) where.isActive = isActive === 'true';

    const members = await prisma.advisoryBoardMember.findMany({
      where,
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching advisory board members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advisory board members' },
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

    const contentType = request.headers.get('content-type');
    let formData;

    if (contentType?.includes('multipart/form-data')) {
      const data = await request.formData();
      formData = {
        name: data.get('name'),
        title: data.get('title'),
        expertise: data.get('expertise'),
        resumeUrl: data.get('resumeUrl'),
        imageUrl: data.get('imageUrl'),
        email: data.get('email'),
        institution: data.get('institution'),
        position: data.get('position'),
        bio: data.get('bio'),
        displayOrder: data.get('displayOrder') ? parseInt(data.get('displayOrder') as string) : undefined,
        isActive: data.get('isActive') === 'true',
      };
    } else {
      formData = await request.json();
    }

    const validatedData = createAdvisoryMemberSchema.parse(formData);

    const maxOrder = await prisma.advisoryBoardMember.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true }
    });

    const member = await prisma.advisoryBoardMember.create({
      data: {
        name: validatedData.name,
        title: validatedData.title || null,
        expertise: validatedData.expertise || null,
        resumeUrl: validatedData.resumeUrl || null,
        imageUrl: validatedData.imageUrl || null,
        email: validatedData.email || null,
        institution: validatedData.institution || null,
        position: validatedData.position || null,
        bio: validatedData.bio || null,
        displayOrder: validatedData.displayOrder ?? (maxOrder?.displayOrder ?? 0) + 1,
        isActive: validatedData.isActive ?? true
      }
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error creating advisory board member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create advisory board member' },
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
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const contentType = request.headers.get('content-type');
    let formData;

    if (contentType?.includes('multipart/form-data')) {
      const data = await request.formData();
      formData = {
        id: memberId,
        name: data.get('name'),
        title: data.get('title'),
        expertise: data.get('expertise'),
        resumeUrl: data.get('resumeUrl'),
        imageUrl: data.get('imageUrl'),
        email: data.get('email'),
        institution: data.get('institution'),
        position: data.get('position'),
        bio: data.get('bio'),
        displayOrder: data.get('displayOrder') ? parseInt(data.get('displayOrder') as string) : undefined,
        isActive: data.get('isActive') === 'true',
      };
    } else {
      const jsonData = await request.json();
      formData = { ...jsonData, id: memberId };
    }

    const validatedData = updateAdvisoryMemberSchema.parse(formData);

    const existingMember = await prisma.advisoryBoardMember.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Advisory board member not found' },
        { status: 404 }
      );
    }

    const updatedMember = await prisma.advisoryBoardMember.update({
      where: { id: memberId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.title !== undefined && { title: validatedData.title }),
        ...(validatedData.expertise !== undefined && { expertise: validatedData.expertise }),
        ...(validatedData.resumeUrl !== undefined && { resumeUrl: validatedData.resumeUrl }),
        ...(validatedData.imageUrl !== undefined && { imageUrl: validatedData.imageUrl }),
        ...(validatedData.email !== undefined && { email: validatedData.email }),
        ...(validatedData.institution !== undefined && { institution: validatedData.institution }),
        ...(validatedData.position !== undefined && { position: validatedData.position }),
        ...(validatedData.bio !== undefined && { bio: validatedData.bio }),
        ...(validatedData.displayOrder !== undefined && { displayOrder: validatedData.displayOrder }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive })
      }
    });

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('Error updating advisory board member:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update advisory board member' },
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
    const memberId = searchParams.get('id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const existingMember = await prisma.advisoryBoardMember.findUnique({
      where: { id: memberId }
    });

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Advisory board member not found' },
        { status: 404 }
      );
    }

    await prisma.advisoryBoardMember.delete({
      where: { id: memberId }
    });

    return NextResponse.json({ message: 'Advisory board member deleted successfully' });
  } catch (error) {
    console.error('Error deleting advisory board member:', error);
    return NextResponse.json(
      { error: 'Failed to delete advisory board member' },
      { status: 500 }
    );
  }
}

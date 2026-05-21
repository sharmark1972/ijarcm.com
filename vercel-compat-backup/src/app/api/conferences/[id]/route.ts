import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, ConferenceStatus } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/conferences/[id] - Get specific conference
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;
    
    const conference = await prisma.conference.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      );
    }

    // Check if conference is public or user is admin
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === UserRole.ADMIN;
    
    if (!conference.isPublic && !isAdmin) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(conference);
  } catch (error) {
    console.error('Error fetching conference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conference' },
      { status: 500 }
    );
  }
}

// PUT /api/conferences/[id] - Update conference (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      venue,
      website,
      status,
      isPublic
    } = body;

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    });

    if (!existingConference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      );
    }

    // Validation
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (venue !== undefined) updateData.venue = venue;
    if (website !== undefined) updateData.website = website;
    if (status !== undefined) updateData.status = status;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    const conference = await prisma.conference.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(conference);
  } catch (error) {
    console.error('Error updating conference:', error);
    return NextResponse.json(
      { error: 'Failed to update conference' },
      { status: 500 }
    );
  }
}

// DELETE /api/conferences/[id] - Delete conference (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    });

    if (!existingConference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      );
    }

    await prisma.conference.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Conference deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting conference:', error);
    return NextResponse.json(
      { error: 'Failed to delete conference' },
      { status: 500 }
    );
  }
}
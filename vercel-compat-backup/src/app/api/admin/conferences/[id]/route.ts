import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conference = await prisma.conference.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        venue: true,
        website: true,
        status: true,
        videoUrl: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
      },
    });

    if (!conference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      videoUrl,
      isPublic
    } = body;

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id: params.id },
    });

    if (!existingConference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
    }

    // Validate dates if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start >= end) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Validate video URL if provided
    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        return NextResponse.json(
          { error: 'Invalid video URL format' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (location !== undefined) updateData.location = location;
    if (venue !== undefined) updateData.venue = venue;
    if (website !== undefined) updateData.website = website;
    if (status !== undefined) updateData.status = status;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // Update conference
    const updatedConference = await prisma.conference.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        venue: true,
        website: true,
        status: true,
        videoUrl: true,
        isPublic: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Conference updated successfully',
      conference: updatedConference,
    });
  } catch (error) {
    console.error('Error updating conference:', error);
    return NextResponse.json(
      { error: 'Failed to update conference' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id: params.id },
    });

    if (!existingConference) {
      return NextResponse.json({ error: 'Conference not found' }, { status: 404 });
    }

    // Delete conference
    await prisma.conference.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      message: 'Conference deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting conference:', error);
    return NextResponse.json(
      { error: 'Failed to delete conference' },
      { status: 500 }
    );
  }
}
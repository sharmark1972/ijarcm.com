import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateIssueCover } from '@/lib/issueCoverGenerator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
    const { issueId } = body;

    if (!issueId) {
      return NextResponse.json(
        { error: 'Issue ID is required' },
        { status: 400 }
      );
    }

    // Get issue details
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
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

    // Generate new cover image
    const coverImagePath = await generateIssueCover({
      volume: issue.volume,
      issueNumber: issue.issueNumber,
      year: issue.year,
      title: issue.title,
      paperCount: issue._count.papers,
    });

    // Update issue with new cover
    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        coverImage: coverImagePath,
      },
    });

    return NextResponse.json({
      success: true,
      issue: updatedIssue,
      coverImage: coverImagePath,
    });
  } catch (error) {
    console.error('Error regenerating cover:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate cover' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Trigger plagiarism check for a specific paper
export async function POST(
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
        { error: 'Only administrators can trigger plagiarism checks' },
        { status: 403 }
      );
    }

    const paperId = params.id;

    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        title: true,
        abstract: true,
        filePath: true,
        submitter: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending or in-progress check
    const existingCheck = await prisma.plagiarismCheck.findFirst({
      where: {
        paperId: paperId,
        status: {
          in: ['PENDING', 'CHECKING']
        }
      }
    });

    if (existingCheck) {
      return NextResponse.json(
        { error: 'Plagiarism check already in progress for this paper' },
        { status: 409 }
      );
    }

    // Create a pending plagiarism check
    const plagiarismCheck = await prisma.plagiarismCheck.create({
      data: {
        paperId: paperId,
        checkResult: {},
        similarity: 0,
        status: 'PENDING',
        checkedBy: session.user.id
      },
      include: {
        paper: {
          select: {
            title: true,
            submitter: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Here you would typically integrate with a plagiarism detection service
    // For now, we'll simulate the process
    
    // Update status to checking
    await prisma.plagiarismCheck.update({
      where: { id: plagiarismCheck.id },
      data: { status: 'CHECKING' }
    });

    // Simulate plagiarism check (in a real implementation, this would be async)
    // You would integrate with services like Turnitin, Copyscape, or custom solutions
    setTimeout(async () => {
      try {
        // Simulate check results
        const mockResults = {
          sources: [
            {
              url: 'https://example.com/source1',
              similarity: 15.5,
              matchedText: 'Sample matched text from source'
            }
          ],
          summary: 'Plagiarism check completed. Low similarity detected.',
          details: {
            totalSources: 1,
            highestSimilarity: 15.5,
            averageSimilarity: 15.5
          }
        };

        await prisma.plagiarismCheck.update({
          where: { id: plagiarismCheck.id },
          data: {
            status: 'COMPLETED',
            similarity: 15.5,
            checkResult: mockResults,
            sources: [
              {
                url: 'https://example.com/source1',
                title: 'Example Academic Paper',
                similarity: 15.5
              }
            ]
          }
        });
      } catch (error) {
        console.error('Error updating plagiarism check:', error);
        await prisma.plagiarismCheck.update({
          where: { id: plagiarismCheck.id },
          data: { status: 'FAILED' }
        });
      }
    }, 5000); // Simulate 5 second processing time

    return NextResponse.json({
      message: 'Plagiarism check initiated successfully',
      checkId: plagiarismCheck.id,
      status: 'CHECKING'
    });

  } catch (error) {
    console.error('Error initiating plagiarism check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get plagiarism check status for a specific paper
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

    const paperId = params.id;

    // Check if user has permission to view this paper's plagiarism check
    if (session.user.role !== 'ADMIN') {
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: { submitterId: true }
      });

      if (!paper || paper.submitterId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const plagiarismChecks = await prisma.plagiarismCheck.findMany({
      where: { paperId: paperId },
      include: {
        checker: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { checkedAt: 'desc' }
    });

    return NextResponse.json({
      checks: plagiarismChecks
    });

  } catch (error) {
    console.error('Error fetching plagiarism checks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
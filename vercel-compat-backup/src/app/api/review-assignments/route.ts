import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const assignmentSchema = z.object({
  paperId: z.string(),
  reviewerId: z.string(),
  dueDate: z.string().optional()
});

const bulkAssignmentSchema = z.object({
  paperId: z.string(),
  reviewerIds: z.array(z.string()),
  dueDate: z.string().optional()
});

// POST - Create new review assignment(s)
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
        { error: 'Only administrators can assign reviewers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bulk } = body;

    if (bulk) {
      // Handle bulk assignment
      const validatedData = bulkAssignmentSchema.parse(body);
      const { paperId, reviewerIds, dueDate } = validatedData;

      // Verify paper exists
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true, title: true, status: true }
      });

      if (!paper) {
        return NextResponse.json(
          { error: 'Paper not found' },
          { status: 404 }
        );
      }

      // Verify all reviewers exist and have REVIEWER role
      const reviewers = await prisma.user.findMany({
        where: {
          id: { in: reviewerIds },
          role: 'REVIEWER'
        },
        select: { id: true, firstName: true, lastName: true, email: true }
      });

      if (reviewers.length !== reviewerIds.length) {
        return NextResponse.json(
          { error: 'One or more reviewers not found or invalid' },
          { status: 400 }
        );
      }

      // Check for existing assignments
      const existingAssignments = await prisma.reviewAssignment.findMany({
        where: {
          paperId,
          reviewerId: { in: reviewerIds }
        }
      });

      if (existingAssignments.length > 0) {
        const existingReviewerIds = existingAssignments.map(a => a.reviewerId);
        return NextResponse.json(
          { 
            error: 'Some reviewers are already assigned to this paper',
            existingAssignments: existingReviewerIds
          },
          { status: 400 }
        );
      }

      // Create assignments
      const assignments = await prisma.reviewAssignment.createMany({
        data: reviewerIds.map(reviewerId => ({
          paperId,
          reviewerId,
          assignedById: session.user.id,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          status: 'ASSIGNED'
        }))
      });

      // Update paper status to UNDER_REVIEW if not already
      if (paper.status === 'SUBMITTED') {
        await prisma.paper.update({
          where: { id: paperId },
          data: { status: 'UNDER_REVIEW' }
        });
      }

      return NextResponse.json({
        message: `Successfully assigned ${assignments.count} reviewers`,
        assignments: assignments.count,
        reviewers: reviewers.map(r => ({ id: r.id, name: `${r.firstName} ${r.lastName}` }))
      });

    } else {
      // Handle single assignment
      const validatedData = assignmentSchema.parse(body);
      const { paperId, reviewerId, dueDate } = validatedData;

      // Verify paper exists
      const paper = await prisma.paper.findUnique({
        where: { id: paperId },
        select: { id: true, title: true, status: true }
      });

      if (!paper) {
        return NextResponse.json(
          { error: 'Paper not found' },
          { status: 404 }
        );
      }

      // Verify reviewer exists and has REVIEWER role
      const reviewer = await prisma.user.findUnique({
        where: { id: reviewerId },
        select: { id: true, firstName: true, lastName: true, email: true, role: true }
      });

      if (!reviewer || reviewer.role !== 'REVIEWER') {
        return NextResponse.json(
          { error: 'Reviewer not found or invalid' },
          { status: 400 }
        );
      }

      // Check for existing assignment
      const existingAssignment = await prisma.reviewAssignment.findFirst({
        where: {
          paperId,
          reviewerId
        }
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: 'Reviewer is already assigned to this paper' },
          { status: 400 }
        );
      }

      // Create assignment
      const assignment = await prisma.reviewAssignment.create({
        data: {
          paperId,
          reviewerId,
          assignedById: session.user.id,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          status: 'ASSIGNED'
        },
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              institution: true
            }
          },
          paper: {
            select: {
              title: true,
              status: true
            }
          }
        }
      });

      // Update paper status to UNDER_REVIEW if not already
      if (paper.status === 'SUBMITTED') {
        await prisma.paper.update({
          where: { id: paperId },
          data: { status: 'UNDER_REVIEW' }
        });
      }

      return NextResponse.json({
        message: 'Reviewer assigned successfully',
        assignment: {
          id: assignment.id,
          paperId: assignment.paperId,
          reviewerId: assignment.reviewerId,
          dueDate: assignment.dueDate,
          status: assignment.status,
          reviewer: assignment.reviewer,
          paper: assignment.paper
        }
      });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating review assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get review assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const reviewerId = searchParams.get('reviewerId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};

    // Build where clause based on user role and parameters
    if (session.user.role === 'ADMIN') {
      // Admin can see all assignments
      if (paperId) whereClause.paperId = paperId;
      if (reviewerId) whereClause.reviewerId = reviewerId;
      if (status) whereClause.status = status;
    } else if (session.user.role === 'REVIEWER') {
      // Reviewers can only see their own assignments
      whereClause.reviewerId = session.user.id;
      if (paperId) whereClause.paperId = paperId;
      if (status) whereClause.status = status;
    } else {
      // Authors can see assignments for their papers
      const userPapers = await prisma.paper.findMany({
        where: { submitterId: session.user.id },
        select: { id: true }
      });
      
      const paperIds = userPapers.map(p => p.id);
      whereClause.paperId = { in: paperIds };
      
      if (paperId && paperIds.includes(paperId)) {
        whereClause.paperId = paperId;
      }
    }

    const [assignments, total] = await Promise.all([
      prisma.reviewAssignment.findMany({
        where: whereClause,
        include: {
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              institution: true,
              email: session.user.role === 'ADMIN'
            }
          },
          paper: {
            select: {
              title: true,
              status: true,
              submittedAt: true
            }
          },
          assignedBy: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { assignedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.reviewAssignment.count({ where: whereClause })
    ]);

    return NextResponse.json({
      assignments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching review assignments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove review assignment
export async function DELETE(request: NextRequest) {
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
        { error: 'Only administrators can remove review assignments' },
        { status: 403 }
      );
    }

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const assignment = await prisma.reviewAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        paper: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if review has already been submitted
    const existingReview = await prisma.review.findFirst({
      where: {
        paperId: assignment.paperId,
        reviewerId: assignment.reviewerId
      }
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Cannot remove assignment - review has already been submitted' },
        { status: 400 }
      );
    }

    // Delete the assignment
    await prisma.reviewAssignment.delete({
      where: { id: assignmentId }
    });

    // Check if this was the last assignment for the paper
    const remainingAssignments = await prisma.reviewAssignment.count({
      where: { paperId: assignment.paperId }
    });

    // If no more assignments, update paper status back to SUBMITTED
    if (remainingAssignments === 0 && assignment.paper.status === 'UNDER_REVIEW') {
      await prisma.paper.update({
        where: { id: assignment.paperId },
        data: { status: 'SUBMITTED' }
      });
    }

    return NextResponse.json({
      message: 'Review assignment removed successfully'
    });

  } catch (error) {
    console.error('Error removing review assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
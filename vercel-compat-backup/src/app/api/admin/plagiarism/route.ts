import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const plagiarismCheckSchema = z.object({
  paperId: z.string().uuid(),
  similarity: z.number().min(0).max(100),
  checkResult: z.object({
    sources: z.array(z.object({
      url: z.string(),
      similarity: z.number(),
      matchedText: z.string()
    })).optional(),
    summary: z.string().optional(),
    details: z.any().optional()
  }),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    similarity: z.number()
  })).optional()
});

// POST - Create plagiarism check
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
        { error: 'Only administrators can perform plagiarism checks' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = plagiarismCheckSchema.parse(body);

    // Check if paper exists
    const paper = await prisma.paper.findUnique({
      where: { id: validatedData.paperId }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Create plagiarism check record
    const plagiarismCheck = await prisma.plagiarismCheck.create({
      data: {
        paperId: validatedData.paperId,
        checkResult: validatedData.checkResult,
        similarity: validatedData.similarity,
        sources: validatedData.sources || [],
        status: 'COMPLETED',
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
        },
        checker: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Plagiarism check completed successfully',
      check: plagiarismCheck
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating plagiarism check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get plagiarism checks
export async function GET(request: NextRequest) {
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
        { error: 'Only administrators can view plagiarism checks' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paperId = searchParams.get('paperId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const whereClause: any = {};
    
    if (paperId) {
      whereClause.paperId = paperId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    const [checks, total] = await Promise.all([
      prisma.plagiarismCheck.findMany({
        where: whereClause,
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
          },
          checker: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { checkedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.plagiarismCheck.count({ where: whereClause })
    ]);

    return NextResponse.json({
      checks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching plagiarism checks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete plagiarism check
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
        { error: 'Only administrators can delete plagiarism checks' },
        { status: 403 }
      );
    }

    const { checkId } = await request.json();

    if (!checkId) {
      return NextResponse.json(
        { error: 'Check ID is required' },
        { status: 400 }
      );
    }

    const check = await prisma.plagiarismCheck.findUnique({
      where: { id: checkId }
    });

    if (!check) {
      return NextResponse.json(
        { error: 'Plagiarism check not found' },
        { status: 404 }
      );
    }

    await prisma.plagiarismCheck.delete({
      where: { id: checkId }
    });

    return NextResponse.json({
      message: 'Plagiarism check deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting plagiarism check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
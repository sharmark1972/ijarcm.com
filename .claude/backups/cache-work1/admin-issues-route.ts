import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateIssueCover } from '@/lib/issueCoverGenerator';

export const dynamic = 'force-dynamic';

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  volume: z.string().min(1, 'Volume is required'),
  issueNumber: z.string().min(1, 'Issue number is required'),
  year: z.number().int().min(1900).max(2100),
  publishDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  coverImage: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

// GET - List all issues
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const publishedOnly = searchParams.get('published') === 'true';
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { volume: { contains: search } },
        { issueNumber: { contains: search } },
      ];
    }

    if (publishedOnly) {
      where.isPublished = true;
    }

    const [issues, totalIssues] = await Promise.all([
      prisma.issue.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { year: 'desc' },
          { volume: 'desc' },
          { issueNumber: 'desc' },
        ],
        include: {
          _count: {
            select: { papers: true },
          },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    return NextResponse.json({
      issues,
      totalIssues,
      totalPages: Math.ceil(totalIssues / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

// POST - Create a new issue
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
    const validatedData = issueSchema.parse(body);

    // Check if issue with same volume and issue number already exists
    const existingIssue = await prisma.issue.findFirst({
      where: {
        volume: validatedData.volume,
        issueNumber: validatedData.issueNumber,
      },
    });

    if (existingIssue) {
      return NextResponse.json(
        { error: 'An issue with this volume and issue number already exists' },
        { status: 400 }
      );
    }

    // Generate cover image if not provided
    let coverImagePath = validatedData.coverImage;
    if (!coverImagePath) {
      try {
        // Get paper count for this issue
        const paperCount = await prisma.paper.count({
          where: {
            volumeNumber: validatedData.volume,
            issueNumber: validatedData.issueNumber,
          },
        });
        
        coverImagePath = await generateIssueCover({
          volume: validatedData.volume,
          issueNumber: validatedData.issueNumber,
          year: validatedData.year,
          title: validatedData.title,
          paperCount,
        });
      } catch (error) {
        console.error('Error generating cover image:', error);
        // Continue without cover image if generation fails
      }
    }

    const issue = await prisma.issue.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        volume: validatedData.volume,
        issueNumber: validatedData.issueNumber,
        year: validatedData.year,
        publishDate: new Date(validatedData.publishDate),
        coverImage: coverImagePath || null,
        isPublished: validatedData.isPublished ?? false,
      },
      include: {
        _count: {
          select: { papers: true },
        },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

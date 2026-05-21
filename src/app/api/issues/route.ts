import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET - List all published issues
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const volume = searchParams.get('volume');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page number must be greater than 0' },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate year parameter if provided
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
        return NextResponse.json(
          { error: 'Invalid year parameter' },
          { status: 400 }
        );
      }
    }

    const where: Prisma.IssueWhereInput = {
      isPublished: true,
    };

    if (year) {
      where.year = parseInt(year);
    }

    if (volume) {
      where.volume = volume;
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
        select: {
          id: true,
          title: true,
          description: true,
          volume: true,
          issueNumber: true,
          year: true,
          publishDate: true,
          coverImage: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              papers: true,
            },
          },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    const formattedIssues = issues.map((issue) => ({
      id: issue.id,
      title: issue.title,
      description: issue.description,
      volume: issue.volume,
      issue: issue.issueNumber,
      year: issue.year,
      publicationDate: issue.publishDate.toISOString(),
      coverImage: issue.coverImage,
      paperCount: issue._count.papers,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      issues: formattedIssues,
      pagination: {
        totalIssues,
        totalPages: Math.ceil(totalIssues / limit),
        currentPage: page,
        limit,
        hasNextPage: page < Math.ceil(totalIssues / limit),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

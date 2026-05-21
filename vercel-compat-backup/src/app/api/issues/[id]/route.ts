import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { 
        id: params.id,
        isPublished: true // Only show published issues to public
      },
      include: {
        papers: {
          where: {
            status: 'PUBLISHED'
          },
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            category: true,
            publishedAt: true,
            paperAuthors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
              orderBy: {
                authorOrder: 'asc',
              },
            },
            _count: {
              select: {
                downloads: true,
              },
            },
          },
          orderBy: {
            publishedAt: 'desc',
          },
        },
        _count: {
          select: { papers: true },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

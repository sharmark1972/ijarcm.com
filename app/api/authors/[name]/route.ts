import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const authorName = decodeURIComponent(params.name);
    
    // Split the name to search by first and last name
    const nameParts = authorName.trim().split(' ');
    if (nameParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid author name format. Expected "First Last"' },
        { status: 400 }
      );
    }

    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Find the author by first and last name
    const author = await prisma.user.findFirst({
      where: {
        firstName: {
          contains: firstName
        },
        lastName: {
          contains: lastName
        },
        role: {
          in: ['AUTHOR', 'REVIEWER', 'ADMIN']
        }
      },
      include: {
        paperAuthors: {
          include: {
            paper: {
              select: {
                id: true,
                title: true,
                abstract: true,
                publishedAt: true,
                status: true
              }
            }
          },
          orderBy: {
            paper: {
              publishedAt: 'desc'
            }
          }
        }
      }
    });

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    // Format the response
    const response = {
      id: author.id,
      firstName: author.firstName,
      lastName: author.lastName,
      email: author.email,
      bio: author.bio,
      institution: author.institution,
      createdAt: author.createdAt.toISOString(),
      papers: author.paperAuthors.map(paperAuthor => ({
        id: paperAuthor.paper.id,
        title: paperAuthor.paper.title,
        abstract: paperAuthor.paper.abstract,
        publishedAt: paperAuthor.paper.publishedAt?.toISOString(),
        status: paperAuthor.paper.status
      }))
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const addPaperToArchiveSchema = z.object({
  archiveId: z.string().min(1, 'Archive ID is required'),
  paperId: z.string().min(1, 'Paper ID is required'),
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().min(1).optional()
});

const updateArchivePaperSchema = z.object({
  pageStart: z.number().int().min(1).optional(),
  pageEnd: z.number().int().min(1).optional()
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const archiveId = searchParams.get('archiveId');
    const includeAllPapers = searchParams.get('includeAllPapers') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const sort = searchParams.get('sort') || 'date-desc';
    const skip = (page - 1) * limit;

    // Determine sorting order
    let orderBy: Prisma.PaperOrderByWithRelationInput = { publishedAt: Prisma.SortOrder.desc };
    switch (sort) {
      case 'date-asc':
        orderBy = { publishedAt: Prisma.SortOrder.asc };
        break;
      case 'title-asc':
        orderBy = { title: Prisma.SortOrder.asc };
        break;
      case 'title-desc':
        orderBy = { title: Prisma.SortOrder.desc };
        break;
      case 'downloads':
        orderBy = { downloads: { _count: Prisma.SortOrder.desc } };
        break;
      default:
        orderBy = { publishedAt: Prisma.SortOrder.desc };
    }

    // If includeAllPapers is true, fetch all published papers regardless of archive association
    if (includeAllPapers) {
      // Get total count for pagination
      const totalCount = await prisma.paper.count({
        where: { status: 'PUBLISHED' }
      });

      const publishedPapers = await prisma.paper.findMany({
        where: { status: 'PUBLISHED' },
        include: {
          paperAuthors: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  institution: true
                }
              }
            },
            orderBy: { authorOrder: Prisma.SortOrder.asc }
          },
          _count: {
            select: {
              downloads: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      });

      // Transform the data to match the expected format
      const transformedPapers = publishedPapers.map((paper) => {
        const authorNames = paper.paperAuthors.map((author) =>
          `${author.user.firstName} ${author.user.lastName}`.trim()
        );

        return {
          id: paper.id,
          archiveId: null, // These papers are not specifically linked to an archive
          paperId: paper.id,
          pageStart: null,
          pageEnd: null,
          createdAt: paper.submittedAt,
          paper: {
            id: paper.id,
            title: paper.title,
            abstract: paper.abstract,
            keywords: paper.keywords,
            filePath: paper.filePath,
            publishedAt: paper.publishedAt,
            paperAuthors: paper.paperAuthors
          },
          archive: null, // No specific archive for these papers
          authors: authorNames.join(', '), // Add authors as a string for compatibility
          downloads: paper._count?.downloads || 0,
          authorDetails: paper.paperAuthors.map(author => ({
            firstName: author.user.firstName,
            lastName: author.user.lastName,
            institution: author.user.institution
          }))
        };
      }).filter(paper => paper && paper.paper && paper.paper.title); // Filter out any invalid papers

      const totalPages = Math.ceil(totalCount / limit);

      return NextResponse.json({
        papers: transformedPapers,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    }

    // Original behavior for specific archive papers
    if (!archiveId) {
      return NextResponse.json(
        { error: 'Archive ID is required' },
        { status: 400 }
      );
    }

    const archivePapers = await prisma.archivePaper.findMany({
      where: { archiveId },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            filePath: true,
            publishedAt: true,
            paperAuthors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    institution: true
                  }
                }
              },
              orderBy: { authorOrder: Prisma.SortOrder.asc }
            }
          }
        },
        archive: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        }
      },
      orderBy: { createdAt: Prisma.SortOrder.asc }
    });

    // Transform the data to match the expected format
    const transformedArchivePapers = archivePapers.map((archivePaper) => {
      const authorNames = archivePaper.paper.paperAuthors.map((author) =>
        `${author.user.firstName} ${author.user.lastName}`.trim()
      );

      return {
        ...archivePaper,
        authors: authorNames.join(', '), // Add authors as a string for compatibility
        downloads: 0 // Archive papers don't have download count in this context
      };
    });

    return NextResponse.json(transformedArchivePapers);
  } catch (error) {
    console.error('Error fetching archive papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archive papers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = addPaperToArchiveSchema.parse(body);

    // Check if archive exists
    const archive = await prisma.archive.findUnique({
      where: { id: validatedData.archiveId }
    });

    if (!archive) {
      return NextResponse.json(
        { error: 'Archive not found' },
        { status: 404 }
      );
    }

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

    // Check if paper is already in this archive
    const existingArchivePaper = await prisma.archivePaper.findFirst({
      where: {
        archiveId: validatedData.archiveId,
        paperId: validatedData.paperId
      }
    });

    if (existingArchivePaper) {
      return NextResponse.json(
        { error: 'Paper is already in this archive' },
        { status: 400 }
      );
    }

    const archivePaper = await prisma.archivePaper.create({
      data: {
        archiveId: validatedData.archiveId,
        paperId: validatedData.paperId,
        pageStart: validatedData.pageStart,
        pageEnd: validatedData.pageEnd
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            filePath: true,
            publishedAt: true,
            paperAuthors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    institution: true
                  }
                }
              },
              orderBy: { authorOrder: Prisma.SortOrder.asc }
            }
          }
        },
        archive: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        }
      }
    });

    return NextResponse.json(archivePaper, { status: 201 });
  } catch (error) {
    console.error('Error adding paper to archive:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to add paper to archive' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const archivePaperId = searchParams.get('id');

    if (!archivePaperId) {
      return NextResponse.json(
        { error: 'Archive Paper ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateArchivePaperSchema.parse(body);

    // Check if archive paper exists
    const existingArchivePaper = await prisma.archivePaper.findUnique({
      where: { id: archivePaperId }
    });

    if (!existingArchivePaper) {
      return NextResponse.json(
        { error: 'Archive paper not found' },
        { status: 404 }
      );
    }

    const updatedArchivePaper = await prisma.archivePaper.update({
      where: { id: archivePaperId },
      data: validatedData,
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            abstract: true,
            keywords: true,
            filePath: true,
            publishedAt: true,
            paperAuthors: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    institution: true
                  }
                }
              },
              orderBy: { authorOrder: Prisma.SortOrder.asc }
            }
          }
        },
        archive: {
          select: {
            id: true,
            title: true,
            volume: true,
            issue: true,
            year: true
          }
        }
      }
    });

    return NextResponse.json(updatedArchivePaper);
  } catch (error) {
    console.error('Error updating archive paper:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update archive paper' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const archivePaperId = searchParams.get('id');

    if (!archivePaperId) {
      return NextResponse.json(
        { error: 'Archive Paper ID is required' },
        { status: 400 }
      );
    }

    // Check if archive paper exists
    const existingArchivePaper = await prisma.archivePaper.findUnique({
      where: { id: archivePaperId }
    });

    if (!existingArchivePaper) {
      return NextResponse.json(
        { error: 'Archive paper not found' },
        { status: 404 }
      );
    }

    await prisma.archivePaper.delete({
      where: { id: archivePaperId }
    });

    return NextResponse.json({ message: 'Paper removed from archive successfully' });
  } catch (error) {
    console.error('Error removing paper from archive:', error);
    return NextResponse.json(
      { error: 'Failed to remove paper from archive' },
      { status: 500 }
    );
  }
}
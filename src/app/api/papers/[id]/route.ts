import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { unlink } from 'fs/promises';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const updatePaperSchema = z.object({
  title: z.string().min(1).optional(),
  abstract: z.string().min(1).optional(),
  keywords: z.array(z.string()).optional(),
  category: z.string().min(1).optional(),
  status: z.enum(['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'ACCEPTED', 'REJECTED', 'PUBLISHED']).optional(),
  authors: z.array(z.object({
    id: z.string().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional().or(z.literal('')),
    institution: z.string().optional(),
    isCorresponding: z.boolean().default(false)
  })).optional(),
  issueId: z.string().optional().nullable(),
  volumeNumber: z.string().optional(),
  issueNumber: z.string().optional(),
  publicationDate: z.string().optional(),
  uniqueNumber: z.string().optional(),
  doi: z.string().optional(),
  doiStatus: z.enum(['PENDING', 'SUBMITTED', 'REGISTERED', 'FAILED']).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const paperId = params.id;

    // Use raw query to include cover_image field and new publication fields
    const paper = await prisma.$queryRaw`
      SELECT
        p.id, p.title, p.abstract, p.keywords, p.file_path, p.cover_image, p.status, p.category,
        p.submitted_at, p.published_at, p.submitter_id, p.issue_id,
        p.volume_number, p.issue_number, p.publication_date, p.unique_number,
        p.doi, p.doi_status, p.doi_registered_at, p.crossref_metadata,
        COUNT(DISTINCT d.id) as download_count,
        COUNT(DISTINCT r.id) as review_count
      FROM papers p
      LEFT JOIN downloads d ON p.id = d.paper_id
      LEFT JOIN reviews r ON p.id = r.paper_id
      WHERE p.id = ${paperId}
      GROUP BY p.id
    ` as any[];
    
    if (!paper || paper.length === 0) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }
    
    const paperData = paper[0];
    
    // Fetch issue details if paper is linked to an issue
    let issueDetails: {
      id: string;
      title: string;
      volume: string;
      issueNumber: string;
      year: number;
      publishDate: Date;
    } | null = null;
    if (paperData.issue_id) {
      issueDetails = await prisma.issue.findUnique({
        where: { id: paperData.issue_id },
        select: {
          id: true,
          title: true,
          volume: true,
          issueNumber: true,
          year: true,
          publishDate: true,
        },
      });
    }
    
    // Fetch related data separately
    const paperAuthors = await prisma.paperAuthor.findMany({
      where: { paperId },
      orderBy: { authorOrder: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        }
      }
    });
    
    const submitter = await prisma.user.findUnique({
      where: { id: paperData.submitter_id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        institution: true
      }
    });
    
    const reviews = await prisma.review.findMany({
      where: { paperId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    
    const downloads = await prisma.download.findMany({
      where: { paperId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            institution: true
          }
        }
      },
      orderBy: { downloadedAt: 'desc' },
      take: 10
    });
    
    // Format the paper object
    const formattedPaper = {
      id: paperData.id,
      title: paperData.title,
      abstract: paperData.abstract,
      keywords: paperData.keywords,
      filePath: paperData.file_path,
      coverImage: paperData.cover_image,
      status: paperData.status,
      category: paperData.category,
      submittedAt: paperData.submitted_at,
      publishedAt: paperData.published_at,
      submitterId: paperData.submitter_id,
      issueId: paperData.issue_id,
      issueDetails: issueDetails,
      // Include volume details (legacy support)
      volumeNumber: paperData.volume_number,
      issueNumber: paperData.issue_number,
      publicationDate: paperData.publication_date,
      uniqueNumber: paperData.unique_number,
      paperAuthors,
      submitter,
      reviews,
      downloads,
      _count: {
        downloads: parseInt(paperData.download_count) || 0,
        reviews: parseInt(paperData.review_count) || 0
      }
    };

    // Check permissions - visitors can view published papers
    const canView =
      !session && formattedPaper.status === 'PUBLISHED' ||
      session?.user?.role === 'ADMIN' ||
      formattedPaper.submitterId === session?.user?.id ||
      (session?.user?.role === 'REVIEWER' && reviews.some(r => r.reviewer.id === session?.user?.id)) ||
      formattedPaper.status === 'PUBLISHED';

    if (!canView) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this paper' },
        { status: 403 }
      );
    }

    return NextResponse.json({ paper: formattedPaper });

  } catch (error) {
    console.error('Error fetching paper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const paperId = params.id;
    const body = await request.json();

    // Debug: Log the received body
    console.log('Received update data:', JSON.stringify(body, null, 2));

    // Validate request body
    const validationResult = updatePaperSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if paper exists
    const existingPaper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        submitterId: true,
        status: true
      }
    });

    if (!existingPaper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canEdit = 
      session.user.role === 'ADMIN' ||
      (existingPaper.submitterId === session.user.id && ['SUBMITTED'].includes(existingPaper.status));

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Insufficient permissions to edit this paper' },
        { status: 403 }
      );
    }

    // Special handling for status changes
    if (data.status && session.user.role !== 'ADMIN') {
      // Only admins can change status
      delete data.status;
    }

    // Convert keywords array to string if provided
    const updateData: any = { ...data };
    if (updateData.keywords) {
      updateData.keywords = Array.isArray(updateData.keywords) ? updateData.keywords.join(', ') : updateData.keywords;
    }

    // Handle issueId validation if provided
    if (updateData.issueId !== undefined && updateData.issueId !== null) {
      if (updateData.issueId) {
        const issue = await prisma.issue.findUnique({
          where: { id: updateData.issueId },
        });

        if (!issue) {
          return NextResponse.json(
            { error: 'Selected issue does not exist' },
            { status: 400 }
          );
        }

        if (!issue.isPublished) {
          return NextResponse.json(
            { error: 'Cannot assign paper to unpublished issue' },
            { status: 400 }
          );
        }
      } else {
        updateData.issueId = null;
      }
    }

    // Handle optional publication fields (legacy support)
    if (updateData.volumeNumber !== undefined) {
      updateData.volumeNumber = updateData.volumeNumber || undefined;
    }
    if (updateData.issueNumber !== undefined) {
      updateData.issueNumber = updateData.issueNumber || undefined;
    }
    if (updateData.publicationDate !== undefined) {
      updateData.publicationDate = updateData.publicationDate ? new Date(updateData.publicationDate) : undefined;
    }
    if (updateData.uniqueNumber !== undefined) {
      updateData.uniqueNumber = updateData.uniqueNumber || undefined;
    }

    // Remove authors from updateData as we'll handle them separately
    const authors = updateData.authors;
    delete updateData.authors;

    // Debug: Log if authors were found
    if (authors && Array.isArray(authors)) {
      console.log('Found authors in request:', authors.length);
    } else {
      console.log('No authors found in request');
    }

    // Update paper and authors in a transaction
    const updatedPaper = await prisma.$transaction(async (tx) => {
      // Update paper basic information
      const paper = await tx.paper.update({
        where: { id: paperId },
        data: updateData
      });

      // Handle authors if provided
      if (authors && Array.isArray(authors)) {
        // Delete existing author relationships
        await tx.paperAuthor.deleteMany({
          where: { paperId }
        });

        // Create new author relationships
        for (let i = 0; i < authors.length; i++) {
          const author = authors[i];
          
          // Check if user exists by email
          let user = await tx.user.findUnique({
            where: { email: author.email }
          });
          
          // If user doesn't exist, create a new user account
          if (!user) {
            // Generate a temporary password for the new user
            const tempPassword = Math.random().toString(36).slice(-8);
            const bcrypt = await import('bcrypt');
            const passwordHash = await bcrypt.hash(tempPassword, 10);
            
            user = await tx.user.create({
              data: {
                email: author.email,
                firstName: author.firstName,
                lastName: author.lastName,
                passwordHash,
                role: 'AUTHOR',
                institution: author.institution || '',
                isVerified: false,
              }
            });
          } else {
            // Update existing user's information if it has changed
            await tx.user.update({
              where: { id: user.id },
              data: {
                firstName: author.firstName,
                lastName: author.lastName,
                institution: author.institution || user.institution,
              }
            });
          }
          
          // Create the PaperAuthor relationship
          await tx.paperAuthor.create({
            data: {
              paperId: paper.id,
              userId: user.id,
              authorOrder: i + 1,
              isCorresponding: author.isCorresponding || false,
            }
          });
        }
      }

      // Fetch the updated paper with authors
      return await tx.paper.findUnique({
        where: { id: paperId },
        include: {
          paperAuthors: {
            orderBy: { authorOrder: 'asc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          submitter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    });

    return NextResponse.json({
      success: true,
      paper: updatedPaper,
      message: 'Paper updated successfully'
    });

  } catch (error) {
    console.error('Error updating paper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const paperId = params.id;

    // Check if paper exists
    const existingPaper = await prisma.paper.findUnique({
      where: { id: paperId },
      select: {
        id: true,
        submitterId: true,
        status: true,
        filePath: true,
        title: true
      }
    });

    if (!existingPaper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const canDelete = 
      session.user.role === 'ADMIN' ||
      (existingPaper.submitterId === session.user.id && existingPaper.status === 'SUBMITTED');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete this paper' },
        { status: 403 }
      );
    }

    // Delete associated records first (due to foreign key constraints)
    await prisma.$transaction(async (tx) => {
      await tx.download.deleteMany({ where: { paperId } });
      await tx.bookmark.deleteMany({ where: { paperId } });
      await tx.review.deleteMany({ where: { paperId } });
      await tx.reviewAssignment.deleteMany({ where: { paperId } });
      await tx.paperAuthor.deleteMany({ where: { paperId } });
      await tx.plagiarismCheck.deleteMany({ where: { paperId } });
      await tx.certificate.deleteMany({ where: { paperId } });
      await tx.citation.deleteMany({ where: { paperId } });
      await tx.archivePaper.deleteMany({ where: { paperId } });
      await tx.paperContent.deleteMany({ where: { paperId } });
      await tx.paper.delete({ where: { id: paperId } });
    }, { timeout: 30000 });

    // Delete the file from filesystem
    try {
      if (existingPaper.filePath) {
        const fullPath = join(process.cwd(), existingPaper.filePath);
        await unlink(fullPath);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Don't fail the request if file deletion fails
    }

    return NextResponse.json({
      success: true,
      message: 'Paper deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting paper:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

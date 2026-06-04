import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateScopusPDF } from '@/lib/generateScopusPDF';
import { uploadToR2 } from '@/lib/r2-upload';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trust the authenticated session role for admin access.
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'ALL';
    const categoryFilter = searchParams.get('category') || 'ALL';
    const issueFilter = searchParams.get('issueId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build where clause
    const where: any = {};

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { abstract: { contains: searchTerm, mode: 'insensitive' } },
        { keywords: { contains: searchTerm, mode: 'insensitive' } },
        {
          paperAuthors: {
            some: {
              user: {
                OR: [
                  { firstName: { contains: searchTerm, mode: 'insensitive' } },
                  { lastName: { contains: searchTerm, mode: 'insensitive' } }
                ]
              }
            }
          }
        }
      ];
    }

    if (statusFilter !== 'ALL') {
      where.status = statusFilter;
    }

    if (categoryFilter !== 'ALL') {
      where.category = categoryFilter;
    }

    if (issueFilter) {
      where.issueId = issueFilter;
    }

    // Get total count
    const totalPapers = await prisma.paper.count({ where });
    const totalPages = Math.ceil(totalPapers / limit);

    // Get papers with pagination
    const papers = await prisma.paper.findMany({
      where,
      include: {
        submitter: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        },
        paperAuthors: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                institution: true
              }
            }
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        reviews: {
          select: {
            id: true
          }
        },
        issue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issueNumber: true,
            year: true,
            isPublished: true
          }
        },
        _count: {
          select: {
            downloads: true
          }
        },
        plagiarismChecks: {
          select: {
            id: true,
            status: true,
            similarity: true,
            checkedAt: true
          },
          orderBy: {
            checkedAt: 'desc'
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format papers data
    const formattedPapers = papers.map(paper => ({
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.paperAuthors.map(author => `${author.user.firstName} ${author.user.lastName}`),
      keywords: paper.keywords ? paper.keywords.split(',').map(k => k.trim()) : [],
      status: paper.status,
      submittedAt: paper.submittedAt,
      publishedAt: paper.publishedAt,
      reviewCount: paper.reviews.length,
      downloadCount: paper._count.downloads,
      category: paper.category,
      submittedBy: {
        name: paper.submitter ? `${paper.submitter.firstName} ${paper.submitter.lastName}` : 'Unknown',
        email: paper.submitter?.email || '',
        institution: paper.submitter?.institution || ''
      },
      fileUrl: paper.filePath ? `/api/papers/${paper.id}/download` : null,
      issue: paper.issue ? {
        id: paper.issue.id,
        title: paper.issue.title,
        volume: paper.issue.volume,
        issueNumber: paper.issue.issueNumber,
        year: paper.issue.year,
        isPublished: paper.issue.isPublished
      } : null,
      volumeNumber: paper.volumeNumber,
      issueNumber: paper.issueNumber,
      publicationDate: paper.publicationDate,
      uniqueNumber: paper.uniqueNumber,
      plagiarismChecks: paper.plagiarismChecks.map(check => ({
        id: check.id,
        status: check.status,
        similarityScore: check.similarity,
        createdAt: check.checkedAt
      }))
    }));

    return NextResponse.json({
      papers: formattedPapers,
      totalPapers,
      totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching papers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch papers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
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

    // Parse form data
    const formData = await request.formData();
    
    const title = formData.get('title') as string;
    const abstract = formData.get('abstract') as string;
    const category = formData.get('category') as string;
    const paperType = formData.get('paperType') as 'REVIEW' | 'IMPLEMENTATION' | null;
    const status = formData.get('status') as string;
    const keywords = formData.get('keywords') as string;
    const authorsData = formData.get('authors') as string;
    const issueId = formData.get('issueId') as string | null;
    const file = formData.get('file') as File;
    const sourceFile = formData.get('sourceFile') as File | null;
    const generatePDF = formData.get('generatePDF') === 'true';
    const introduction = formData.get('introduction') as string | null;
    const literatureReview = formData.get('literatureReview') as string | null;
    const methodology = formData.get('methodology') as string | null;
    const results = formData.get('results') as string | null;
    const discussion = formData.get('discussion') as string | null;
    const conclusion = formData.get('conclusion') as string | null;
    const references = formData.get('references') as string | null;

    // Validate required fields
    if (!title || !abstract || !category || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: title, abstract, category, and status are required' },
        { status: 400 }
      );
    }

    // Validate that either file is provided or generatePDF is enabled
    if (!file && !generatePDF) {
      return NextResponse.json(
        { error: 'Either a PDF file must be uploaded or PDF generation must be enabled' },
        { status: 400 }
      );
    }

    // Validate file type if file is provided
    if (file && !file.type.includes('pdf') && !file.type.includes('msword') && !file.type.includes('wordprocessingml')) {
      return NextResponse.json(
        { error: 'Only PDF, DOC, and DOCX files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit) if file is provided
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file && file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    if (sourceFile && sourceFile.size > maxSize) {
      return NextResponse.json(
        { error: 'Source DOCX file size must be less than 10MB' },
        { status: 400 }
      );
    }

    if (sourceFile && !sourceFile.type.includes('msword') && !sourceFile.type.includes('wordprocessingml')) {
      return NextResponse.json(
        { error: 'Only DOC and DOCX source files are allowed' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'ACCEPTED', 'PUBLISHED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Parse authors
    let authors: Array<{
      email?: string;
      firstName?: string;
      lastName?: string;
      isCorresponding?: boolean
    }> = [];
    try {
      if (authorsData) {
        const parsedAuthors = JSON.parse(authorsData);
        
        // Validate email format if provided (but don't require it)
        for (const author of parsedAuthors) {
          if (author.email && typeof author.email === 'string' && author.email.trim() !== '') {
            // Basic email validation only if email is provided
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(author.email.trim())) {
              return NextResponse.json(
                { error: `Invalid email format: ${author.email}` },
                { status: 400 }
              );
            }
          }
        }
        
        authors = parsedAuthors;
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authors data format' },
        { status: 400 }
      );
    }

    let relativeFilePath: string;

    if (generatePDF) {
      // Generate PDF from content using Scopus format
      try {
        // Fetch issue details if issueId is provided
        let issueData;
        if (issueId) {
          issueData = await prisma.issue.findUnique({
            where: { id: issueId },
            select: {
              volume: true,
              issueNumber: true,
              year: true,
              publishDate: true
            }
          });
        }

        const pdfData = {
          title,
          abstract,
          authors: authors.map(a => ({
            name: `${a.firstName || ''} ${a.lastName || ''}`.trim(),
            email: a.email,
            isCorresponding: a.isCorresponding
          })),
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
          category,
          paperType: paperType || undefined,
          issue: issueData,
          doi: formData.get('doi') as string | undefined,
          introduction: introduction || undefined,
          literatureReview: literatureReview || undefined,
          methodology: methodology || undefined,
          results: results || undefined,
          discussion: discussion || undefined,
          conclusion: conclusion || undefined,
          references: references || undefined
        };

        const pdfBuffer = await generateScopusPDF(pdfData);

        relativeFilePath = await uploadToR2(pdfBuffer, `paper_${Date.now()}_generated.pdf`, 'papers', 'application/pdf');
      } catch (pdfError) {
        console.error('Error generating PDF:', pdfError);
        return NextResponse.json(
          { error: 'Failed to generate PDF from content' },
          { status: 500 }
        );
      }
    } else {
      // Save uploaded file
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `paper_${timestamp}.${fileExtension}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      relativeFilePath = await uploadToR2(buffer, fileName, 'papers', file.type || 'application/octet-stream');
    }

    let sourceFilePath: string | null = null;
    let sourceFileName: string | null = null;
    let sourceFileSize: number | null = null;

    if (sourceFile) {
      const sourceBytes = await sourceFile.arrayBuffer();
      const sourceBuffer = Buffer.from(sourceBytes);
      const sourceExtension = sourceFile.name.split('.').pop() || 'docx';
      const storedSourceName = `paper_source_${Date.now()}.${sourceExtension}`;
      sourceFilePath = await uploadToR2(
        sourceBuffer,
        storedSourceName,
        'paper-sources',
        sourceFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      sourceFileName = sourceFile.name;
      sourceFileSize = sourceFile.size;
    }

    // Validate issue if provided
    if (issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
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
    }

    // Create paper record in database
    const paper = await prisma.paper.create({
      data: {
        title,
        abstract,
        keywords: keywords || null,
        category,
        status: status as 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'ACCEPTED' | 'PUBLISHED' | 'REJECTED',
        filePath: relativeFilePath,
        sourceFilePath,
        sourceFileName,
        sourceFileSize,
        submitterId: session.user.id,
        issueId: issueId || null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        doi: formData.get('doi') as string | null
      }
    });

    // Handle authors if provided
    if (authors.length > 0) {
      for (let i = 0; i < authors.length; i++) {
        const authorData = authors[i];
        
        let user;
        
        // Only process if email is provided
        if (authorData.email && authorData.email.trim()) {
          const email = authorData.email.trim().toLowerCase();
          
          // Find or create user for author
          user = await prisma.user.findUnique({
            where: { email: email }
          });

          if (!user) {
            // Create a basic user record for author
            const [firstName, ...lastNameParts] = email.split('@')[0].split('.');
            const lastName = lastNameParts.join(' ') || 'Author';
            
            user = await prisma.user.create({
              data: {
                email: email,
                firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
                lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
                passwordHash: '', // Empty password hash for auto-created authors
                role: 'AUTHOR',
                isVerified: false
              }
            });
          }
        } else {
          // Create a user without email for authors who don't have one
          user = await prisma.user.create({
            data: {
              firstName: authorData.firstName || 'Author',
              lastName: authorData.lastName || `${i + 1}`, // Use author number as placeholder
              passwordHash: '', // Empty password for authors without email
              role: 'AUTHOR',
              isVerified: false,
            }
          } as any); // Use type assertion to bypass TypeScript error
        }

        // Create paper author relationship
        await prisma.paperAuthor.create({
          data: {
            paperId: paper.id,
            userId: user.id,
            authorOrder: i + 1,
            isCorresponding: authorData.isCorresponding || false
          }
        });
      }
    }

    // Fetch created paper with all relationships
    const createdPaper = await prisma.paper.findUnique({
      where: { id: paper.id },
      include: {
        paperAuthors: {
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
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        submitter: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        downloads: true,
        plagiarismChecks: {
          orderBy: {
            checkedAt: 'desc'
          },
          take: 1
        },
        issue: {
          select: {
            id: true,
            title: true,
            volume: true,
            issueNumber: true,
            year: true,
            isPublished: true
          }
        }
      }
    });

    // Save paper content if provided
    if (introduction || literatureReview || methodology || results || discussion || conclusion || references) {
      await prisma.paperContent.create({
        data: {
          paperId: paper.id,
          introduction: introduction || null,
          literatureReview: literatureReview || null,
          methodology: methodology || null,
          results: results || null,
          discussion: discussion || null,
          conclusion: conclusion || null,
          references: references || null,
          images: [] // Initialize with empty array, can be updated later
        }
      });
    }

    revalidatePath('/library');
    revalidatePath('/archives');
    revalidatePath('/');
    return NextResponse.json({
      success: true,
      paper: createdPaper,
      message: 'Paper created successfully'
    });

  } catch (error) {
    console.error('Error creating paper:', error);
    return NextResponse.json(
      { error: 'Failed to create paper' },
      { status: 500 }
    );
  }
}

// Helper function to build content string from sections
function buildContentString(sections: {
  introduction: string;
  methodology: string;
  results: string;
  discussion: string;
  conclusion: string;
  references: string;
}): string {
  const parts: string[] = [];
  
  if (sections.introduction.trim()) {
    parts.push(`1. INTRODUCTION\n${sections.introduction}`);
  }
  
  if (sections.methodology.trim()) {
    parts.push(`2. METHODOLOGY\n${sections.methodology}`);
  }
  
  if (sections.results.trim()) {
    parts.push(`3. RESULTS\n${sections.results}`);
  }
  
  if (sections.discussion.trim()) {
    parts.push(`4. DISCUSSION\n${sections.discussion}`);
  }
  
  if (sections.conclusion.trim()) {
    parts.push(`5. CONCLUSION\n${sections.conclusion}`);
  }
  
  if (sections.references.trim()) {
    parts.push(`REFERENCES\n${sections.references}`);
  }
  
  return parts.join('\n\n');
}

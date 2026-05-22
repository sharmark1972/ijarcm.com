import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2-upload';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const abstract = formData.get('abstract') as string;
    const keywords = formData.get('keywords') as string;
    const category = formData.get('category') as string;
    const authors = formData.get('authors') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const suggestedReviewers = formData.get('suggestedReviewers') as string;
    const conflictOfInterest = formData.get('conflictOfInterest') as string;
    const ethicsStatement = formData.get('ethicsStatement') as string;
    const fundingInformation = formData.get('fundingInformation') as string;
    const isDraft = formData.get('isDraft') === 'true';
    const manuscriptFile = formData.get('manuscript') as File;
    
    // New optional publication fields
    const volumeNumber = formData.get('volumeNumber') as string;
    const issueNumber = formData.get('issueNumber') as string;
    const publicationDate = formData.get('publicationDate') as string;
    const uniqueNumber = formData.get('uniqueNumber') as string;

    // Validate required fields
    if (!title || !abstract || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, abstract, and category are required' },
        { status: 400 }
      );
    }

    // Parse JSON fields safely
    let parsedKeywords, parsedAuthors;
    try {
      parsedKeywords = keywords ? JSON.parse(keywords) : [];
      parsedAuthors = authors ? JSON.parse(authors) : [];
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON format in keywords or authors field' },
        { status: 400 }
      );
    }

    let filePath = '';
    if (manuscriptFile) {
      try {
        const bytes = await manuscriptFile.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudflare R2
        filePath = await uploadToR2(buffer, manuscriptFile.name, 'papers');
      } catch (fileError) {
        console.error('Error handling file upload:', fileError);
        return NextResponse.json(
          { error: 'Failed to upload manuscript file' },
          { status: 500 }
        );
      }
    }

    // Create paper submission
    const paper = await prisma.paper.create({
      data: {
        title,
        abstract,
        keywords: Array.isArray(parsedKeywords) ? parsedKeywords.join(', ') : parsedKeywords,
        category,
        filePath: manuscriptFile ? filePath : '',
        status: 'SUBMITTED', // Use SUBMITTED for both draft and final submission
        submitterId: session.user.id,
        submittedAt: new Date(),
        // Add optional publication fields
        volumeNumber: volumeNumber || null,
        issueNumber: issueNumber || null,
        publicationDate: publicationDate ? new Date(publicationDate) : null,
        uniqueNumber: uniqueNumber || null,
      },
    });

    // Create PaperAuthor records for each author
    if (parsedAuthors && Array.isArray(parsedAuthors) && parsedAuthors.length > 0) {
      for (let i = 0; i < parsedAuthors.length; i++) {
        const author = parsedAuthors[i];
        
        let user;
        
        // Only create/find user if email is provided
        if (author.email && author.email.trim()) {
          // Check if user exists by email
          user = await prisma.user.findUnique({
            where: { email: author.email }
          });
          
          // If user doesn't exist, create a new user account
          if (!user) {
            // Generate a temporary password for the new user
            const tempPassword = Math.random().toString(36).slice(-8);
            const passwordHash = await import('bcrypt').then(bcrypt =>
              bcrypt.hash(tempPassword, 10)
            );
            
            user = await prisma.user.create({
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
          }
        } else {
          // Create a user without email for authors who don't have one
          user = await prisma.user.create({
            data: {
              firstName: author.firstName,
              lastName: author.lastName,
              passwordHash: '', // Empty password for authors without email
              role: 'AUTHOR',
              institution: author.institution || '',
              isVerified: false,
            }
          } as any); // Use type assertion to bypass TypeScript error
        }
        
        // Create the PaperAuthor relationship
        await prisma.paperAuthor.create({
          data: {
            paperId: paper.id,
            userId: user.id,
            authorOrder: i + 1,
            isCorresponding: author.isCorresponding || false,
          }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      paperId: paper.id,
      message: isDraft ? 'Paper saved as draft' : 'Paper submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting paper:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A paper with this title already exists' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to submit paper. Please try again.' },
      { status: 500 }
    );
  }
}

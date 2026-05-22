import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateScopusPDF } from '@/lib/generateScopusPDF';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const keywords = formData.get('keywords') as string;
    const authorsData = formData.get('authors') as string;
    const issueId = formData.get('issueId') as string | null;
    const introduction = formData.get('introduction') as string | null;
    const literatureReview = formData.get('literatureReview') as string | null;
    const methodology = formData.get('methodology') as string | null;
    const results = formData.get('results') as string | null;
    const discussion = formData.get('discussion') as string | null;
    const conclusion = formData.get('conclusion') as string | null;
    const references = formData.get('references') as string | null;
    const doi = formData.get('doi') as string | null;

    // Validate required fields
    if (!title || !abstract || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: title, abstract, and category are required' },
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
        authors = parsedAuthors;
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid authors data format' },
        { status: 400 }
      );
    }

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

    // Build content string from sections
    const buildContentString = (sections: {
      introduction: string;
      methodology: string;
      results: string;
      discussion: string;
      conclusion: string;
      references: string;
    }): string => {
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
    };

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
      doi: doi || undefined,
      introduction: introduction || undefined,
      literatureReview: literatureReview || undefined,
      methodology: methodology || undefined,
      results: results || undefined,
      discussion: discussion || undefined,
      conclusion: conclusion || undefined,
      references: references || undefined
    };

    // Generate PDF
    const pdfBuffer = await generateScopusPDF(pdfData);

    // Return PDF as base64 for preview
    const base64Pdf = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      pdfData: `data:application/pdf;base64,${base64Pdf}`,
      message: 'PDF generated successfully for preview'
    });

  } catch (error) {
    console.error('Error generating preview PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview PDF' },
      { status: 500 }
    );
  }
}

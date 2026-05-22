import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateScopusPDF } from '@/lib/generateScopusPDF';
import { uploadToR2 } from '@/lib/r2-upload';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paperId = params.id;

    // Get paper with content
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        paperAuthors: {
          include: {
            user: true
          }
        },
        paperContent: true
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN';
    const isOwner = paper.submitterId === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if paper has content saved
    if (!paper.paperContent) {
      return NextResponse.json(
        { error: 'No saved content found for this paper' },
        { status: 404 }
      );
    }

    // Prepare data for PDF generation
    const paperData = {
      title: paper.title,
      abstract: paper.abstract,
      authors: paper.paperAuthors.map(pa => ({
        name: `${pa.user.firstName} ${pa.user.lastName}`,
        email: pa.user.email || undefined,
        isCorresponding: pa.isCorresponding
      })),
      keywords: paper.keywords ? paper.keywords.split(',').map(k => k.trim()) : [],
      category: paper.category || '',
      introduction: paper.paperContent.introduction || '',
      literatureReview: paper.paperContent.literatureReview || '',
      methodology: paper.paperContent.methodology || '',
      results: paper.paperContent.results || '',
      discussion: paper.paperContent.discussion || '',
      conclusion: paper.paperContent.conclusion || '',
      references: paper.paperContent.references || ''
    };

    // Generate PDF
    const pdfBuffer = await generateScopusPDF(paperData);

    const filename = `${paperId}-regenerated-${Date.now()}.pdf`;
    const filePath = await uploadToR2(pdfBuffer, filename, 'papers', 'application/pdf');

    // Update paper with new file path
    await prisma.paper.update({
      where: { id: paperId },
      data: {
        filePath
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Paper regenerated successfully',
      filePath
    });
  } catch (error) {
    console.error('Error regenerating paper:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate paper' },
      { status: 500 }
    );
  }
}

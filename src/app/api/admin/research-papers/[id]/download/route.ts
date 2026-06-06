import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getResearchPaperDraft } from '@/lib/research-papers/research-paper-service';
import { generatePreviewPdfFromData } from '@/lib/research-papers/pdf-service';
import { downloadFromR2 } from '@/lib/r2-upload';
import mammoth from 'mammoth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const draft = await getResearchPaperDraft(params.id);
    if (!draft) {
      return NextResponse.json({ error: 'Research paper draft not found' }, { status: 404 });
    }

    const safeTitle = (draft.title || 'research-paper')
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase()
      .slice(0, 60);

    console.log('[DOWNLOAD] draft.pdfPath —', (draft as any).pdfPath ?? 'NULL');

    // Agar PDF R2 mein save hai to seedha serve karo
    if ((draft as any).pdfPath) {
      console.log('[DOWNLOAD] Serving PDF from R2 —', (draft as any).pdfPath);
      const pdfBuffer = await downloadFromR2((draft as any).pdfPath);
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // PDF nahi hai — DOCX se images extract karke fresh generate karo
    console.log('[DOWNLOAD] No saved PDF — generating fresh with images from DOCX');

    let sections = draft.sections.map((s: any) => ({
      heading: s.heading,
      content: s.content || '',
      isFullWidth: s.isFullWidth ?? true,
    }));

    // R2 se DOCX download karke images extract karo
    if ((draft as any).sourceFilePath) {
      try {
        const docxBuffer = await downloadFromR2((draft as any).sourceFilePath);
        const imageMap: Map<string, string> = new Map();

        await mammoth.convertToHtml(
          { buffer: docxBuffer },
          {
            convertImage: mammoth.images.imgElement((image) =>
              image.read('base64').then((imageBuffer) => {
                const src = `data:${image.contentType};base64,${imageBuffer}`;
                imageMap.set(`img-${imageMap.size}`, src);
                return { src };
              })
            ),
          }
        );

        console.log('[DOWNLOAD] Images extracted from DOCX —', imageMap.size, 'images');
      } catch (docxError) {
        console.warn('[DOWNLOAD] DOCX image extraction failed (non-fatal):', docxError);
      }
    }

    const pdfBuffer = await generatePreviewPdfFromData({
      title: draft.title || '',
      abstract: draft.abstract || '',
      keywords: Array.isArray(draft.keywords) ? draft.keywords as string[] : [],
      doi: draft.doi || undefined,
      bodyColumnMode: (draft as any).bodyColumnMode === 'single-column' ? 'single-column' : 'two-column',
      authors: draft.authors.map((a: any) => ({
        name: a.name,
        email: a.email || undefined,
        affiliation: a.affiliation || undefined,
      })),
      sections,
      issue: draft.issue ? {
        volume: draft.issue.volume,
        issueNumber: draft.issue.issueNumber,
        year: draft.issue.year,
        publishDate: draft.issue.publishDate.toISOString(),
      } : null,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeTitle}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error downloading research paper PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

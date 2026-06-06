import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storeResearchPaperFile } from '@/lib/research-papers/storage';
import { validatePublishReady } from '@/lib/research-papers/validation';
import { uploadToR2 } from '@/lib/r2-upload';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();

    const title = formData.get('title') as string;
    const abstract = formData.get('abstract') as string;
    const keywordsRaw = formData.get('keywords') as string;
    const doi = formData.get('doi') as string | null;
    const issueId = formData.get('issueId') as string | null;
    const bodyColumnMode = (formData.get('bodyColumnMode') as string) || 'two-column';
    const authorsRaw = formData.get('authors') as string;
    const sectionsRaw = formData.get('sections') as string;
    const sourceFileName = formData.get('sourceFileName') as string;
    const sourceFileSize = parseInt(formData.get('sourceFileSize') as string) || 0;
    const docxFile = formData.get('docx') as File | null;
    const pdfFile = formData.get('pdf') as File | null;

    // Parse JSON fields
    let keywords: string[] = [];
    let authors: Array<{ name: string; email?: string | null; affiliation?: string | null; isCorresponding: boolean }> = [];
    let sections: Array<{ heading: string; content: string; isFullWidth: boolean }> = [];

    try {
      keywords = JSON.parse(keywordsRaw || '[]');
      authors = JSON.parse(authorsRaw || '[]');
      sections = JSON.parse(sectionsRaw || '[]');
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in authors, sections, or keywords' }, { status: 400 });
    }

    // Validate required fields
    const validStatuses = ['DRAFT', 'EDITING', 'READY', 'PUBLISHED'];
    const rawStatus = (formData.get('status') as string) || 'DRAFT';
    const status = validStatuses.includes(rawStatus) ? rawStatus : 'DRAFT';

    const draftForValidation = {
      title: title || null,
      abstract: abstract || null,
      issueId: issueId || null,
      status,
      authors: authors.map((a) => ({ name: a.name })),
      sections: sections.map((s) => ({ heading: s.heading, content: s.content })),
    };

    try {
      validatePublishReady(draftForValidation);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : 'Validation failed' }, { status: 400 });
    }

    // Upload DOCX to R2 if provided
    let storedSourceFilePath: string | null = null;
    if (docxFile && docxFile.size > 0) {
      console.log('[SERVER STEP 4a] DOCX upload to R2 start — file:', docxFile.name, 'size:', docxFile.size);
      const stored = await storeResearchPaperFile(docxFile);
      storedSourceFilePath = stored.fileUrl;
      console.log('[SERVER STEP 4a] DOCX upload to R2 done — path:', storedSourceFilePath);
    } else {
      console.log('[SERVER STEP 4a] No DOCX file provided — sourceFilePath will be null');
    }

    // Create ResearchPaperDraft in DB
    console.log('[SERVER STEP 4b] Creating ResearchPaperDraft in DB —', {
      title,
      authors: authors.length,
      sections: sections.length,
      issueId,
      status: 'PUBLISHED',
    });
    const draft = await prisma.researchPaperDraft.create({
      data: {
        title,
        abstract,
        keywords,
        doi: doi || null,
        issueId: issueId || null,
        bodyColumnMode,
        sourceFilePath: storedSourceFilePath,
        sourceFileName: sourceFileName || (docxFile?.name ?? null),
        sourceFileSize: docxFile?.size ?? sourceFileSize,
        status: status as any,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        createdBy: session.user.id,
        authors: {
          create: authors
            .filter((a) => a.name.trim())
            .map((a, index) => ({
              name: a.name.trim(),
              email: a.email?.trim() || null,
              affiliation: a.affiliation?.trim() || null,
              isCorresponding: a.isCorresponding,
              authorOrder: index,
            })),
        },
        sections: {
          create: sections
            .filter((s) => s.heading || s.content)
            .map((s, index) => ({
              heading: s.heading.trim(),
              content: s.content,
              isFullWidth: s.isFullWidth ?? true,
              sectionOrder: index,
            })),
        },
      },
      include: {
        authors: { orderBy: { authorOrder: 'asc' } },
        sections: { orderBy: { sectionOrder: 'asc' } },
        issue: { select: { title: true, volume: true, issueNumber: true, year: true } },
      },
    });

    console.log('[SERVER STEP 4b] ResearchPaperDraft created in DB ✅ —', {
      id: draft.id,
      status: draft.status,
      sectionsInDB: draft.sections?.length,
      authorsInDB: draft.authors?.length,
      sourceFilePath: draft.sourceFilePath,
    });

    // Browser ka PDF blob seedha R2 par upload karo
    let pdfPath: string | null = null;
    if (pdfFile && pdfFile.size > 0) {
      try {
        console.log('[SERVER STEP 4c] PDF upload to R2 start — size:', pdfFile.size);
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const safeTitle = (draft.title || 'research-paper')
          .replace(/[^a-z0-9]/gi, '-')
          .replace(/-+/g, '-')
          .toLowerCase()
          .slice(0, 60);

        pdfPath = await uploadToR2(
          pdfBuffer,
          `${safeTitle}.pdf`,
          `research-papers/pdfs/${draft.id}`,
          'application/pdf',
        );

        await prisma.researchPaperDraft.update({
          where: { id: draft.id },
          data: { pdfPath },
        });

        console.log('[SERVER STEP 4c] PDF uploaded to R2 ✅ —', pdfPath);
      } catch (pdfError) {
        console.error('[SERVER STEP 4c] PDF upload failed (non-fatal):', pdfError);
      }
    }

    // Create Paper record if status is PUBLISHED and PDF is available
    if (status === 'PUBLISHED' && pdfPath) {
      try {
        console.log('[SERVER STEP 4d] Creating Paper record in DB —', { draftId: draft.id, issueId });

        const keywordsString = Array.isArray(draft.keywords)
          ? (draft.keywords as string[]).join(', ')
          : '';

        const paper = await prisma.paper.create({
          data: {
            title: draft.title || '',
            abstract: draft.abstract || '',
            keywords: keywordsString || null,
            filePath: pdfPath,
            status: 'PUBLISHED',
            submitterId: session.user.id,
            issueId: issueId || null,
            doi: doi || null,
            publishedAt: new Date(),
            sourceFilePath: storedSourceFilePath,
            sourceFileName: sourceFileName || (docxFile?.name ?? null),
            sourceFileSize: docxFile?.size ?? sourceFileSize,
            researchPaperDraftId: draft.id,
          },
        });

        // Authors create karo — email se user dhundho, nahi mila to banao
        for (let i = 0; i < draft.authors.length; i++) {
          const a = draft.authors[i];
          let user;
          if (a.email?.trim()) {
            const email = a.email.trim().toLowerCase();
            user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  firstName: a.name.split(' ')[0] || a.name,
                  lastName: a.name.split(' ').slice(1).join(' ') || 'Author',
                  passwordHash: '',
                  role: 'AUTHOR',
                  isVerified: false,
                },
              });
            }
          } else {
            const nameParts = a.name.trim().split(' ');
            user = await prisma.user.create({
              data: {
                firstName: nameParts[0] || a.name,
                lastName: nameParts.slice(1).join(' ') || 'Author',
                passwordHash: '',
                role: 'AUTHOR',
                isVerified: false,
              },
            } as any);
          }
          await prisma.paperAuthor.create({
            data: {
              paperId: paper.id,
              userId: user.id,
              authorOrder: i + 1,
              isCorresponding: a.isCorresponding,
            },
          });
        }

        console.log('[SERVER STEP 4d] Paper record created ✅ —', { paperId: paper.id });
      } catch (paperError) {
        console.error('[SERVER STEP 4d] Paper record creation failed (non-fatal):', paperError);
      }
    }

    return NextResponse.json({ draft, message: 'Research paper published successfully' });
  } catch (error) {
    console.error('Error submitting research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

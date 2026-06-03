import { ResearchPaperStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  extractStructuredDataFromDocx,
} from './docx-extractor';
import { tryGeminiOnly, tryZaiOnly } from './gemini-extractor';
import {
  removeStoredResearchPaperFile,
  validateResearchPaperFile,
} from './storage';
import { validateDraftUpdate, validatePublishReady } from './validation';
import type { ResearchPaperDraftUpdateInput } from './types';
import { generateResearchPaperPdf } from './pdf-service';

const includeDraftRelations = {
  authors: { orderBy: { authorOrder: 'asc' as const } },
  sections: { orderBy: { sectionOrder: 'asc' as const } },
  issue: {
    select: {
      id: true,
      title: true,
      volume: true,
      issueNumber: true,
      year: true,
      publishDate: true,
      isPublished: true,
    },
  },
};

export type ExtractionStep = 'gemini' | 'zai' | 'basic';

export type ExtractionMode = 'auto' | 'gemini' | 'zai' | 'basic';

export async function createResearchPaperDraftFromUpload(
  file: File,
  onStep: (step: ExtractionStep) => void,
  extractionMode: ExtractionMode = 'auto',
) {
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  const extension = validateResearchPaperFile(file);
  const structured = await extractStructuredDataFromDocx(fileBuffer, extension);
  const plainText = structured.rawHtml
    ? structured.rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  type AiResult = Awaited<ReturnType<typeof tryGeminiOnly>>;
  let aiResult: AiResult = null;
  let usedStep: ExtractionStep = 'basic';

  if (extractionMode === 'basic') {
    // Without AI — sirf basic extraction
    onStep('basic');
    usedStep = 'basic';
  } else if (extractionMode === 'gemini') {
    // Sirf Gemini
    onStep('gemini');
    aiResult = await tryGeminiOnly(plainText);
    usedStep = aiResult ? 'gemini' : 'basic';
    if (!aiResult) onStep('basic');
  } else if (extractionMode === 'zai') {
    // Sirf ZAI
    onStep('zai');
    aiResult = await tryZaiOnly(plainText);
    usedStep = aiResult ? 'zai' : 'basic';
    if (!aiResult) onStep('basic');
  } else {
    // Auto — Gemini → ZAI → basic
    onStep('gemini');
    aiResult = await tryGeminiOnly(plainText);

    if (!aiResult) {
      onStep('zai');
      aiResult = await tryZaiOnly(plainText);
    }

    if (!aiResult) {
      onStep('basic');
      usedStep = 'basic';
    } else {
      usedStep = aiResult ? 'gemini' : 'zai';
    }
  }

  const title = aiResult?.title || structured.title;
  const abstract = aiResult?.abstract || structured.abstract;
  const keywords = aiResult?.keywords?.length ? aiResult.keywords : structured.keywords;
  const affiliation = aiResult?.affiliation || structured.affiliation;
  const authors = aiResult?.authors?.length
    ? aiResult.authors.map((a) => ({
        name: a.name,
        email: aiResult?.email || undefined,
        affiliation: affiliation || undefined,
        isCorresponding: a.isCorresponding,
      }))
    : structured.authors;

  const sanitizedKeywords = keywords.filter((k) => typeof k === 'string');
  const sectionsForDraft = structured.sections.map((section, index) => ({
    heading: section.heading ? section.heading.trim() : 'Untitled Section',
    content: section.content ? section.content.trim() : '',
    sectionOrder: index,
    isFullWidth: true,
  }));

  return {
    extractedData: {
      title: title ? title.trim() : '',
      abstract: abstract ? abstract.trim() : '',
      keywords: sanitizedKeywords,
      authors: authors.map((author, index) => ({
        name: author.name.trim(),
        email: author.email ? author.email.trim() : '',
        affiliation: author.affiliation ? author.affiliation.trim() : '',
        isCorresponding: Boolean(author.isCorresponding),
        authorOrder: index,
      })),
      sections: sectionsForDraft,
      sourceFileName: file.name,
      sourceFileSize: file.size,
    },
    extractionMethod: usedStep,
  };
}


export async function listResearchPaperDrafts(params: {
  page?: number;
  limit?: number;
  status?: ResearchPaperStatus | 'ALL';
  search?: string;
}) {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || 10, 1), 50);
  const where: any = {};

  if (params.status && params.status !== 'ALL') {
    where.status = params.status;
  }

  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { abstract: { contains: params.search } },
      { sourceFileName: { contains: params.search } },
    ];
  }

  const [drafts, total] = await Promise.all([
    prisma.researchPaperDraft.findMany({
      where,
      include: includeDraftRelations,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.researchPaperDraft.count({ where }),
  ]);

  return {
    drafts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getResearchPaperDraft(id: string) {
  return prisma.researchPaperDraft.findUnique({
    where: { id },
    include: includeDraftRelations,
  });
}

export async function updateResearchPaperDraft(id: string, input: ResearchPaperDraftUpdateInput) {
  validateDraftUpdate(input);

  const existing = await prisma.researchPaperDraft.findUnique({ where: { id } });
  if (!existing) throw new Error('Research paper draft not found.');

  const bodyColumnMode = normalizeBodyColumnMode(input.bodyColumnMode);

  await prisma.researchPaperDraft.update({
    where: { id },
    data: {
      title: input.title === undefined ? undefined : input.title || null,
      shortTitle: input.shortTitle === undefined ? undefined : input.shortTitle || null,
      abstract: input.abstract === undefined ? undefined : input.abstract || null,
      keywords: input.keywords === undefined ? undefined : input.keywords,
      doi: input.doi === undefined ? undefined : input.doi || null,
      issueId: input.issueId === undefined ? undefined : input.issueId || null,
      bodyColumnMode: input.bodyColumnMode === undefined ? undefined : bodyColumnMode,
      status: input.status || ResearchPaperStatus.EDITING,
    } as any,
  });

  if (input.authors) {
    await prisma.researchPaperAuthor.deleteMany({ where: { draftId: id } });
    const authorsToCreate = input.authors
      .map((author, index) => ({
        draftId: id,
        name: author.name.trim(),
        email: author.email?.trim() || null,
        affiliation: author.affiliation?.trim() || null,
        authorOrder: index,
        isCorresponding: Boolean(author.isCorresponding),
      }))
      .filter((author) => author.name.length > 0);

    if (authorsToCreate.length > 0) {
      await prisma.researchPaperAuthor.createMany({
        data: authorsToCreate,
      });
    }
  }

  if (input.sections) {
    await prisma.researchPaperSection.deleteMany({ where: { draftId: id } });
    const sectionsToCreate = input.sections
      .map((section, index) => ({
        draftId: id,
        heading: section.heading.trim(),
        content: section.content || '',
        sectionOrder: index,
        isFullWidth: section.isFullWidth ?? true,
      }))
      .filter((section) => section.heading.length > 0 || section.content.length > 0);

    if (sectionsToCreate.length > 0) {
      await prisma.researchPaperSection.createMany({
        data: sectionsToCreate,
      });
    }
  }

  return prisma.researchPaperDraft.findUniqueOrThrow({
    where: { id },
    include: includeDraftRelations,
  });
}

export async function deleteResearchPaperDraft(id: string) {
  const existing = await prisma.researchPaperDraft.findUnique({ where: { id } });
  if (!existing) throw new Error('Research paper draft not found.');

  await prisma.researchPaperDraft.delete({ where: { id } });
  await removeStoredResearchPaperFile(existing.sourceFilePath);
  await removeStoredResearchPaperFile(existing.pdfPath);
  await removeStoredResearchPaperFile(existing.previewPdfPath);
}

export async function publishResearchPaperDraft(id: string) {
  const draft = await prisma.researchPaperDraft.findUnique({
    where: { id },
    include: {
      authors: true,
      sections: true,
    },
  });

  if (!draft) throw new Error('Research paper draft not found.');
  validatePublishReady(draft);
  await generateResearchPaperPdf(id, 'final');

  return prisma.researchPaperDraft.update({
    where: { id },
    data: {
      status: ResearchPaperStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    include: includeDraftRelations,
  });
}

function styleUrlsInHtml(html: string): string {
  // Match URLs: https://example.com, www.example.com, or doi.org links
  const urlRegex = /(?<![">])(https?:\/\/[^\s<>")\]]+|www\.[^\s<>")\]]+|doi\.org\/[^\s<>")\]]+)/gi;

  return html.replace(urlRegex, (match) => {
    // Ensure proper URL format
    let fullUrl = match;
    if (match.startsWith('www.')) {
      fullUrl = `https://${match}`;
    }

    // Create styled link - will be rendered in PDF with blue color
    return `<a href="${escapeHtml(fullUrl)}" style="color: #0066cc; text-decoration: underline;">${escapeHtml(match)}</a>`;
  });
}

function detectTableCaptions(html: string): Array<{ caption: string; tableHtml: string; index: number }> {
  const results: Array<{ caption: string; tableHtml: string; index: number }> = [];

  // Match caption patterns: "Table 1:", "Figure 1:", "Fig 2.", etc.
  const captionRegex = /(Table|Figure|Fig|Figure)\s+(\d+[\w]*)\s*[:.\-]?\s*([^\n<]*)/gi;
  let match;

  while ((match = captionRegex.exec(html)) !== null) {
    const captionStart = match.index;
    const captionText = match[0];

    // Look for table after caption (within next 500 chars)
    const searchAfterCaption = html.slice(captionStart, captionStart + 1000);
    const tableMatch = searchAfterCaption.match(/<table[\s\S]*?<\/table>/i);

    if (tableMatch) {
      results.push({
        caption: captionText,
        tableHtml: tableMatch[0],
        index: captionStart,
      });
    }
  }

  return results;
}

function wrapTableWithCaption(html: string): string {
  const captions = detectTableCaptions(html);

  if (captions.length === 0) return html;

  let result = html;

  // Process captions in reverse order to maintain indices
  for (let i = captions.length - 1; i >= 0; i--) {
    const { caption, tableHtml, index } = captions[i];

    // Find the actual position of table in result (may have shifted)
    const tableIndex = result.indexOf(tableHtml);

    if (tableIndex !== -1) {
      // Wrap table with caption styling
      const wrapped = `<div style="text-align: center; margin: 12px 0;">
        <p style="font-weight: bold; font-size: 0.95em; margin: 0 0 8px 0;">${escapeHtml(caption)}</p>
        ${tableHtml}
      </div>`;

      result = result.substring(0, tableIndex) + wrapped + result.substring(tableIndex + tableHtml.length);
    }
  }

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeBodyColumnMode(value: unknown) {
  return value === 'single-column' ? 'single-column' : 'two-column';
}

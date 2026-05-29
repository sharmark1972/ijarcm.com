import { ResearchPaperStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { extractDocumentText } from './docx-extractor';
import { parseResearchPaperText } from './parser';
import {
  removeStoredResearchPaperFile,
  storeResearchPaperFile,
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

export async function createResearchPaperDraftFromUpload(file: File, createdBy: string, issueId?: string | null) {
  const storedFile = await storeResearchPaperFile(file);
  const extracted = await extractDocumentText(storedFile.absolutePath, storedFile.extension);
  const parsed = parseResearchPaperText(extracted.text);

  return prisma.researchPaperDraft.create({
    data: {
      title: parsed.title || null,
      abstract: parsed.abstract || null,
      keywords: parsed.keywords,
      issueId: issueId || null,
      createdBy,
      sourceFilePath: storedFile.relativePath,
      sourceFileName: storedFile.originalName,
      sourceFileSize: storedFile.size,
      extractedText: extracted.text || null,
      status: extracted.text ? ResearchPaperStatus.EXTRACTED : ResearchPaperStatus.UPLOADED,
      authors: {
        create: parsed.authors.map((author, index) => ({
          name: author.name,
          email: author.email || null,
          affiliation: author.affiliation || parsed.affiliation || null,
          authorOrder: index,
          isCorresponding: Boolean(author.isCorresponding),
        })),
      },
      sections: {
        create: parsed.sections.map((section, index) => ({
          heading: section.heading,
          content: section.content,
          sectionOrder: index,
        })),
      },
    },
    include: includeDraftRelations,
  });
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

  await prisma.researchPaperDraft.update({
    where: { id },
    data: {
      title: input.title === undefined ? undefined : input.title || null,
      shortTitle: input.shortTitle === undefined ? undefined : input.shortTitle || null,
      abstract: input.abstract === undefined ? undefined : input.abstract || null,
      keywords: input.keywords === undefined ? undefined : input.keywords,
      doi: input.doi === undefined ? undefined : input.doi || null,
      issueId: input.issueId === undefined ? undefined : input.issueId || null,
      status: input.status || ResearchPaperStatus.EDITING,
    },
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

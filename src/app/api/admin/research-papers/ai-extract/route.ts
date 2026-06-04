import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  enhanceExtractedResearchPaperData,
  ExtractionMode,
} from '@/lib/research-papers/research-paper-service';
import type { ExtractedStructuredData } from '@/lib/research-papers/docx-extractor';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  let body: {
    structured?: ExtractedStructuredData;
    sourceFileName?: string;
    sourceFileSize?: number;
    extractionMode?: ExtractionMode;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.structured?.rawHtml) {
    return NextResponse.json({ error: 'Extracted document data is required' }, { status: 400 });
  }

  const steps: ExtractionMode[] = [];
  const result = await enhanceExtractedResearchPaperData(
    body.structured,
    body.sourceFileName || '',
    body.sourceFileSize || 0,
    (step) => steps.push(step),
    body.extractionMode || 'auto',
  );

  return NextResponse.json({ ...result, steps });
}

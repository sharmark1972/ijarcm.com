import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generatePreviewPdfFromData, PreviewPdfData } from '@/lib/research-papers/pdf-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  let data: PreviewPdfData;
  try {
    data = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!data.title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const pdfBuffer = await generatePreviewPdfFromData(data);
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Preview PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview PDF' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createResearchPaperDraftFromUpload } from '@/lib/research-papers/research-paper-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const issueId = formData.get('issueId');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const draft = await createResearchPaperDraftFromUpload(
      file,
      session.user.id,
      typeof issueId === 'string' ? issueId : null,
    );

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error) {
    console.error('Error uploading research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

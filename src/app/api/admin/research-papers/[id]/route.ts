import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  deleteResearchPaperDraft,
  getResearchPaperDraft,
  updateResearchPaperDraft,
} from '@/lib/research-papers/research-paper-service';
import type { ResearchPaperDraftUpdateInput } from '@/lib/research-papers/types';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const draft = await getResearchPaperDraft(params.id);
    if (!draft) {
      return NextResponse.json({ error: 'Research paper draft not found' }, { status: 404 });
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error fetching research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = (await request.json()) as ResearchPaperDraftUpdateInput;
    const draft = await updateResearchPaperDraft(params.id, body);

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error updating research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await deleteResearchPaperDraft(params.id);
    return NextResponse.json({ message: 'Research paper draft deleted successfully' });
  } catch (error) {
    console.error('Error deleting research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 },
    );
  }
}

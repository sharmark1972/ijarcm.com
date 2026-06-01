import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { publishResearchPaperDraft } from '@/lib/research-papers/research-paper-service';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const draft = await publishResearchPaperDraft(params.id);
    revalidatePath('/library');
    revalidatePath('/archives');
    revalidatePath('/');
    return NextResponse.json({ draft, message: 'Research paper published successfully' });
  } catch (error) {
    console.error('Error publishing research paper:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 400 },
    );
  }
}

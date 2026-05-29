import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ResearchPaperStatus } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { listResearchPaperDrafts } from '@/lib/research-papers/research-paper-service';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ResearchPaperStatus | 'ALL' | null;
    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 10);
    const search = searchParams.get('search') || undefined;

    const result = await listResearchPaperDrafts({
      page,
      limit,
      search,
      status: status || 'ALL',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing research papers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateIssueCover } from '@/lib/issueCoverGenerator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { volume, issueNumber, year, title } = await request.json();

    if (!volume || !issueNumber || !year || !title) {
      return NextResponse.json({ error: 'volume, issueNumber, year, title required' }, { status: 400 });
    }

    const coverUrl = await generateIssueCover({
      volume: String(volume),
      issueNumber: String(issueNumber),
      year: parseInt(year),
      title: String(title),
    });

    return NextResponse.json({ success: true, coverUrl });
  } catch (error) {
    console.error('Cover generation failed:', error);
    return NextResponse.json({ error: 'Failed to generate cover' }, { status: 500 });
  }
}

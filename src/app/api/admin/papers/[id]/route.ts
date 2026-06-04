import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadToR2 } from '@/lib/r2-upload';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const paper = await prisma.paper.findUnique({
    where: { id: params.id },
    include: {
      paperAuthors: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: { authorOrder: 'asc' },
      },
      issue: { select: { id: true, title: true, volume: true, issueNumber: true, year: true } },
    },
  });

  if (!paper) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  return NextResponse.json({ paper });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const existing = await prisma.paper.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Paper not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const title = formData.get('title') as string;
  const abstract = formData.get('abstract') as string;
  const category = formData.get('category') as string;
  const status = formData.get('status') as string;
  const keywords = formData.get('keywords') as string;
  const authorsData = formData.get('authors') as string;
  const issueId = formData.get('issueId') as string | null;
  const doi = formData.get('doi') as string | null;
  const paperType = formData.get('paperType') as string | null;
  const file = formData.get('file') as File | null;
  const sourceFile = formData.get('sourceFile') as File | null;

  if (!title || !abstract || !category || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUIRED', 'ACCEPTED', 'PUBLISHED', 'REJECTED'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  // Upload new PDF if provided
  let filePath = existing.filePath;
  if (file && file.size > 0) {
    filePath = await uploadToR2(
      Buffer.from(await file.arrayBuffer()),
      `paper_${Date.now()}.pdf`,
      'papers',
      'application/pdf',
    );
  }

  const maxSize = 10 * 1024 * 1024;
  if (sourceFile && sourceFile.size > maxSize) {
    return NextResponse.json({ error: 'Source DOCX file size must be less than 10MB' }, { status: 400 });
  }

  if (sourceFile && !sourceFile.type.includes('msword') && !sourceFile.type.includes('wordprocessingml')) {
    return NextResponse.json({ error: 'Only DOC and DOCX source files are allowed' }, { status: 400 });
  }

  let sourceFilePath = existing.sourceFilePath;
  let sourceFileName = existing.sourceFileName;
  let sourceFileSize = existing.sourceFileSize;
  if (sourceFile && sourceFile.size > 0) {
    const sourceExtension = sourceFile.name.split('.').pop() || 'docx';
    sourceFilePath = await uploadToR2(
      Buffer.from(await sourceFile.arrayBuffer()),
      `paper_source_${Date.now()}.${sourceExtension}`,
      'paper-sources',
      sourceFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    sourceFileName = sourceFile.name;
    sourceFileSize = sourceFile.size;
  }

  // Validate issue
  if (issueId) {
    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 400 });
  }

  // Update paper
  const updatedPaper = await prisma.paper.update({
    where: { id: params.id },
    data: {
      title,
      abstract,
      keywords: keywords || null,
      category,
      status: status as any,
      filePath,
      sourceFilePath,
      sourceFileName,
      sourceFileSize,
      issueId: issueId || null,
      doi: doi || null,
      publishedAt: status === 'PUBLISHED' ? (existing.publishedAt || new Date()) : existing.publishedAt,
    },
  });

  // Update authors — delete existing, recreate
  if (authorsData) {
    let authors: Array<{ firstName?: string; lastName?: string; email?: string; isCorresponding?: boolean }> = [];
    try { authors = JSON.parse(authorsData); } catch { authors = []; }

    await prisma.paperAuthor.deleteMany({ where: { paperId: params.id } });

    for (let i = 0; i < authors.length; i++) {
      const a = authors[i];
      let user;

      if (a.email?.trim()) {
        const email = a.email.trim().toLowerCase();
        user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              firstName: a.firstName || email.split('@')[0],
              lastName: a.lastName || 'Author',
              passwordHash: '',
              role: 'AUTHOR',
              isVerified: false,
            },
          });
        }
      } else {
        user = await prisma.user.create({
          data: {
            firstName: a.firstName || 'Author',
            lastName: a.lastName || `${i + 1}`,
            passwordHash: '',
            role: 'AUTHOR',
            isVerified: false,
          },
        } as any);
      }

      await prisma.paperAuthor.create({
        data: { paperId: params.id, userId: user.id, authorOrder: i + 1, isCorresponding: a.isCorresponding || false },
      });
    }
  }

  revalidatePath('/library');
  revalidatePath('/archives');
  revalidatePath('/');
  return NextResponse.json({ paper: updatedPaper });
}

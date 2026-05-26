import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generateCertificateNumber(abbr = 'IJARCM'): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${abbr}-${year}-${randomNum}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only admins can generate certificates
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paperId, userId, type = 'PUBLICATION', conferenceName, authorName, institution, topic, prize, customDate, journalId } = body;

    let paper: {
      id: string;
      title: string;
      status: string;
      submitterId: string;
      paperAuthors: Array<{ userId: string }>;
    } | null = null;
    
    if (type !== 'CONFERENCE' && !paperId) {
      return NextResponse.json(
        { error: 'Paper ID is required for non-conference certificates' },
        { status: 400 }
      );
    }

    // Check if paper exists and is published (only for non-conference certificates)
    if (type !== 'CONFERENCE') {
      paper = await prisma.paper.findUnique({
        where: { id: paperId },
        include: {
          submitter: true,
          paperAuthors: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!paper) {
        return NextResponse.json(
          { error: 'Paper not found' },
          { status: 404 }
        );
      }

      if (paper.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Certificate can only be generated for published papers' },
          { status: 400 }
        );
      }

      // Only check user association if userId is provided
      if (userId) {
        const isAuthor = paper.paperAuthors.some(author => author.userId === userId);
        const isSubmitter = paper.submitterId === userId;

        if (!isAuthor && !isSubmitter) {
          return NextResponse.json(
            { error: 'User is not associated with this paper' },
            { status: 400 }
          );
        }
      }
    }

    // For conference certificates, validate conference name is provided
    if (type === 'CONFERENCE' && !conferenceName) {
      return NextResponse.json(
        { error: 'Conference name is required for conference certificates' },
        { status: 400 }
      );
    }

    // Check if certificate already exists (only if userId is provided)
    if (userId) {
      let whereQuery: Record<string, unknown>;
      if (type === 'CONFERENCE') {
        whereQuery = { userId, type, isValid: true };
      } else {
        whereQuery = { paperId, userId, type, isValid: true };
      }
      
      const existingCertificate = await prisma.certificate.findFirst({
        where: whereQuery,
      });

      if (existingCertificate) {
        const errorMessage = type === 'CONFERENCE'
          ? 'Certificate already exists for this user and conference'
          : 'Certificate already exists for this user and paper';
        
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }
    }

    // Get user details if userId is provided
    let user: {
      id: string;
      institution: string | null;
      firstName: string;
      lastName: string;
      email: string | null;
    } | null = null;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          institution: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    // Fetch journal abbreviation if journalId provided
    let journalAbbr = 'IJARCM';
    if (journalId) {
      const journal = await prisma.journal.findUnique({ where: { id: journalId }, select: { abbreviation: true } });
      if (journal) journalAbbr = journal.abbreviation;
    }

    // Generate certificate
    const certificateNumber = generateCertificateNumber(journalAbbr);

    // Create certificate with proper data structure
    const certificateData = {
      certificateNumber,
      type,
      title: type === 'CONFERENCE' ? conferenceName : (paper?.title || ''),
      authorName: authorName || (user ? `${user.firstName} ${user.lastName}` : 'Guest'),
      institution: institution || (user?.institution ?? null),
      topic: topic || null,
      prize: prize || null,
      customDate: customDate ? new Date(customDate) : null,
      ...(type !== 'CONFERENCE' && paperId && { paperId }),
      ...(userId && { userId }),
      ...(journalId && { journalId }),
    };

    const certificate = await prisma.certificate.create({
      data: certificateData,
    });

    // Type assertion needed because customDate may not be recognized yet
    const certificateWithDate = certificate as typeof certificate & { customDate: Date | null };

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        type: certificate.type,
        title: certificate.title,
        authorName: certificate.authorName,
        institution: certificate.institution,
        topic: certificate.topic,
        prize: certificate.prize,
        issuedAt: certificate.issuedAt,
        customDate: certificateWithDate.customDate,
      },
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate certificate', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const paperId = searchParams.get('paperId');
    const certificateNumber = searchParams.get('certificateNumber');
    const search = searchParams.get('search');
    const typeFilter = searchParams.get('type');

    const baseWhere: Record<string, unknown> = { isValid: true };

    // If not admin, only show user's own certificates
    if (session.user.role !== 'ADMIN') {
      baseWhere.userId = session.user.id;
    } else if (userId) {
      baseWhere.userId = userId;
    }

    if (paperId) baseWhere.paperId = paperId;
    if (certificateNumber) baseWhere.certificateNumber = certificateNumber;
    if (typeFilter && typeFilter !== 'ALL') baseWhere.type = typeFilter;

    const certificates = await prisma.certificate.findMany({
      where: {
        ...baseWhere,
        ...(search ? {
          OR: [
            { authorName: { contains: search } },
            { certificateNumber: { contains: search } },
            { title: { contains: search } },
            { institution: { contains: search } },
          ],
        } : {}),
      },
      include: {
        paper: {
          select: {
            id: true,
            title: true,
            publishedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            institution: true,
          },
        },
        journal: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    // Add topic and prize to each certificate
    const certificatesWithTopicAndPrize = certificates.map(cert => ({
      ...cert,
      topic: cert.topic,
      prize: cert.prize,
    }));

    return NextResponse.json({
      certificates: certificatesWithTopicAndPrize,
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

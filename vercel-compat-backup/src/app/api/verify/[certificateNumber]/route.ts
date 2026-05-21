import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { certificateNumber: string } }
) {
  try {
    const certificateNumber = params.certificateNumber;

    if (!certificateNumber) {
      return NextResponse.json(
        { error: 'Certificate number is required' },
        { status: 400 }
      );
    }

    // Find the certificate in the database
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        paper: {
          select: {
            title: true,
            status: true,
            publishedAt: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            institution: true
          }
        }
      }
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found or has been revoked' },
        { status: 404 }
      );
    }

    // Check if certificate is valid
    if (!certificate.isValid) {
      return NextResponse.json(
        { error: 'Certificate has been revoked' },
        { status: 410 }
      );
    }

    // Return certificate details
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
        customDate: certificate.customDate,
        isValid: certificate.isValid,
        paper: certificate.paper,
        user: certificate.user
      }
    });

  } catch (error) {
    console.error('Error verifying certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
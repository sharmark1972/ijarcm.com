import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Insufficient permissions to generate certificate' },
        { status: 403 }
      );
    }

    const paperId = params.id;

    // Fetch paper with author details
    const paper = await prisma.paper.findUnique({
      where: { id: paperId },
      include: {
        paperAuthors: {
          orderBy: { authorOrder: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                institution: true
              }
            }
          }
        }
      }
    });

    if (!paper) {
      return NextResponse.json(
        { error: 'Paper not found' },
        { status: 404 }
      );
    }

    // Check if paper is published
    if (paper.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Certificate can only be generated for published papers' },
        { status: 400 }
      );
    }

    // Get the first author as the primary certificate recipient
    const primaryAuthor = paper.paperAuthors[0]?.user;
    if (!primaryAuthor) {
      return NextResponse.json(
        { error: 'No author found for this paper' },
        { status: 400 }
      );
    }

    // Check if certificate already exists for this paper and author
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        paperId,
        userId: primaryAuthor.id,
        type: 'PUBLICATION',
        isValid: true
      }
    });

    let certificateNumber;
    let issuedAt;

    if (existingCertificate) {
      // Use existing certificate
      certificateNumber = existingCertificate.certificateNumber;
      issuedAt = existingCertificate.issuedAt;
    } else {
      // Generate new unique certificate number
      const year = new Date().getFullYear();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      certificateNumber = `IJARCM-${year}-${randomSuffix}`;
      
      // Use paper's publish date as issue date
      issuedAt = paper.publishedAt || new Date();

      // Store certificate in database
      await prisma.certificate.create({
        data: {
          paperId,
          userId: primaryAuthor.id,
          certificateNumber,
          type: 'PUBLICATION',
          title: paper.title,
          authorName: `${primaryAuthor.firstName} ${primaryAuthor.lastName}`,
          institution: primaryAuthor.institution || '',
          issuedAt
        }
      });
    }

    // Generate QR code for verification
    const baseUrl = process.env.NEXTAUTH_URL || 'https://ijarcm.com';
    const verificationUrl = `${baseUrl}/verify/${certificateNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      }
    });

    // Generate certificate HTML
    const certificateHTML = generateCertificateHTML({
      certificateNumber,
      authorName: `${primaryAuthor.firstName} ${primaryAuthor.lastName}`,
      title: paper.title,
      institution: primaryAuthor.institution || '',
      issuedAt: issuedAt.toISOString(),
      type: 'PUBLICATION',
      qrCodeDataUrl
    });

    return NextResponse.json({
      success: true,
      certificateHTML,
      certificateNumber,
      authorName: `${primaryAuthor.firstName} ${primaryAuthor.lastName}`,
      paperTitle: paper.title,
      issuedAt,
      isExisting: !!existingCertificate
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCertificateHTML({
  certificateNumber,
  authorName,
  title,
  institution,
  issuedAt,
  type,
  qrCodeDataUrl
}: {
  certificateNumber: string;
  authorName: string;
  title: string;
  institution: string;
  issuedAt: string;
  type: string;
  qrCodeDataUrl: string;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCertificateTypeText = (type: string) => {
    switch (type) {
      case 'PUBLICATION':
        return 'CERTIFICATE OF PUBLICATION';
      default:
        return 'CERTIFICATE OF ACHIEVEMENT';
    }
  };

  const getCertificateDescription = (type: string) => {
    switch (type) {
      case 'PUBLICATION':
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) hereby certifies that the distinguished scholar named herein has successfully completed the publication of an original research contribution. This scholarly work has undergone comprehensive double-blind peer review, demonstrating adherence to the highest standards of academic excellence and research integrity.';
      default:
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) hereby presents this certificate in formal recognition of distinguished scholarly achievement and contribution to academic excellence.';
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Certificate of Publication - IJARCM</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Libre Baskerville', Georgia, serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 30px;
        }
        
        .certificate {
          background: linear-gradient(135deg, #fffef8 0%, #fef9e7 15%, #fdf3d0 30%, #fef9e7 50%, #fffcf2 70%, #fffef8 100%);
          border: 4px solid #92400e;
          border-radius: 12px;
          padding: 50px 70px;
          width: 1200px;
          min-height: 850px;
          position: relative;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35), 0 15px 40px rgba(0,0,0,0.25), inset 0 0 100px rgba(184,134,11,0.03);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        /* Elegant Corner Flourishes */
        .corner-flourish {
          position: absolute;
          width: 160px;
          height: 160px;
          opacity: 0.6;
        }
        
        .corner-flourish.top-left { top: 0; left: 0; }
        .corner-flourish.top-right { top: 0; right: 0; transform: scaleX(-1); }
        .corner-flourish.bottom-left { bottom: 0; left: 0; transform: scaleY(-1); }
        .corner-flourish.bottom-right { bottom: 0; right: 0; transform: scale(-1, -1); }
        
        /* Inner Frame Borders */
        .inner-frame {
          position: absolute;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          border: 2px solid #d97706;
          border-radius: 8px;
          opacity: 0.5;
          pointer-events: none;
        }
        
        .inner-frame-2 {
          position: absolute;
          top: 28px;
          left: 28px;
          right: 28px;
          bottom: 28px;
          border: 1px solid #fbbf24;
          border-radius: 6px;
          opacity: 0.3;
          pointer-events: none;
        }
        
        /* Top Decorative Border */
        .top-decoration {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 75%;
          height: 30px;
        }
        
        /* Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg);
          font-size: 140px;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #92400e;
          opacity: 0.02;
          pointer-events: none;
          letter-spacing: 0.3em;
        }
        
        /* Header Section */
        .header {
          text-align: center;
          margin-bottom: 25px;
          position: relative;
          z-index: 10;
        }
        
        /* Prestigious Seal */
        .seal {
          width: 96px;
          height: 96px;
          margin: 0 auto 20px;
          background: radial-gradient(circle at 30% 30%, #fbbf24 0%, #92400e 50%, #451a03 100%);
          border: 4px solid #b8860b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.2);
          position: relative;
        }
        
        .seal::before {
          content: '';
          position: absolute;
          inset: 8px;
          border: 1px solid #b8860b;
          border-radius: 50%;
          opacity: 0.5;
        }
        
        .seal-icon {
          font-size: 36px;
        }
        
        .certificate-title {
          font-size: 40px;
          font-weight: 700;
          color: #78350f;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-family: 'Playfair Display', Georgia, serif;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        /* Elegant Decorative Divider */
        .divider {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .divider-line {
          width: 130px;
          height: 2px;
          background: linear-gradient(to right, transparent, #b8860b);
        }
        
        .divider-line.right {
          background: linear-gradient(to left, transparent, #b8860b);
        }
        
        .divider-stars {
          display: flex;
          gap: 4px;
          color: #b8860b;
        }
        
        .divider-stars span:nth-child(2) {
          font-size: 16px;
        }
        
        .institution-name {
          font-size: 21px;
          color: #78350f;
          margin-bottom: 5px;
          font-weight: 600;
          letter-spacing: 0.05em;
        }
        
        .institution-subtitle {
          font-size: 17px;
          color: #92400e;
          font-style: italic;
        }
        
        .issn-container {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          margin-top: 12px;
          padding: 8px 20px;
          background: linear-gradient(135deg, rgba(146,64,14,0.08) 0%, rgba(217,119,6,0.08) 100%);
          border: 1px solid rgba(217,119,6,0.4);
          border-radius: 50px;
          font-size: 13px;
          font-family: 'Courier New', monospace;
          color: #78350f;
        }
        
        .issn-separator {
          color: #d97706;
        }
        
        /* Main Content Area */
        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        
        .description {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.8;
          margin-bottom: 25px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
          text-align: justify;
          text-indent: 2em;
        }
        
        /* Recipient Section */
        .recipient {
          margin-bottom: 25px;
        }
        
        .recipient-label {
          font-size: 13px;
          color: #92400e;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          font-weight: 600;
        }
        
        .recipient-name {
          font-size: 48px;
          font-weight: 700;
          color: #78350f;
          margin-bottom: 8px;
          font-family: Georgia, 'Times New Roman', serif;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
          position: relative;
          display: inline-block;
          padding: 0 40px 8px;
          letter-spacing: 0.05em;
        }
        
        .recipient-name::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 80%;
          height: 2px;
          background: linear-gradient(to right, transparent, #b8860b, transparent);
        }
        
        .recipient-institution {
          font-size: 16px;
          color: #6b7280;
          font-style: italic;
          margin-top: 12px;
        }
        
        /* Paper Title Section */
        .paper-section {
          margin-bottom: 25px;
        }
        
        .paper-label {
          font-size: 13px;
          color: #92400e;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-weight: 600;
        }
        
        .paper-title {
          font-size: 17px;
          font-weight: 500;
          color: #78350f;
          line-height: 1.6;
          max-width: 900px;
          margin: 0 auto;
          font-family: 'Libre Baskerville', Georgia, serif;
        }
        
        /* Footer Section */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 10;
          margin-top: auto;
          margin-bottom: 20px;
          padding-top: 20px;
          border-top: 2px solid rgba(184,134,11,0.3);
        }
        
        .date-section,
        .cert-number-section,
        .signature-section {
          text-align: center;
        }
        
        .date-section { text-align: left; }
        .signature-section { text-align: right; }
        
        .section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #92400e;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-weight: 600;
        }
        
        .section-label.center {
          justify-content: center;
        }
        
        .date-value,
        .cert-value {
          font-size: 17px;
          font-weight: 600;
          color: #78350f;
        }
        
        .cert-value {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.05em;
        }
        
        .signature-image {
          width: 140px;
          height: 56px;
          margin-bottom: 8px;
          object-fit: contain;
          margin-left: auto;
        }
        
        .signature-line {
          width: 145px;
          border-top: 2px solid #92400e;
          padding-top: 8px;
        }
        
        .signature-title {
          font-size: 14px;
          color: #78350f;
          font-weight: 600;
        }
        
        .signature-org {
          font-size: 12px;
          color: #6b7280;
        }
        
        /* Legal Notice */
        .legal-notice {
          position: relative;
          z-index: 10;
          margin-bottom: 12px;
        }
        
        .notice-box {
          background: linear-gradient(135deg, rgba(146,64,14,0.05) 0%, rgba(217,119,6,0.05) 100%);
          border: 1px solid rgba(217,119,6,0.3);
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .notice-icon {
          color: #92400e;
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .notice-content {
          font-size: 11px;
          color: #4b5563;
          line-height: 1.6;
        }
        
        .notice-title {
          font-weight: 700;
          color: #78350f;
          margin-bottom: 4px;
        }
        
        /* Verification Portal */
        .verification {
          background: linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%);
          border: 2px solid #b8860b;
          border-radius: 10px;
          padding: 16px 20px;
          text-align: center;
          position: relative;
          z-index: 10;
          box-shadow: 0 4px 20px rgba(146,64,14,0.3);
        }
        
        .verification-title {
          font-size: 11px;
          font-weight: 700;
          color: #fbbf24;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.2em;
        }
        
        .verification-url {
          font-size: 17px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          color: #ffffff;
          letter-spacing: 0.03em;
        }
        
        .verification-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.8);
          margin-top: 8px;
          font-style: italic;
        }
        
        /* QR Code */
        .qr-section {
          position: absolute;
          top: 25px;
          right: 70px;
          text-align: center;
          z-index: 10;
        }
        
        .qr-code {
          width: 90px;
          height: 90px;
          border: 3px solid #ffffff;
          border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        
        .qr-text {
          font-size: 10px;
          color: #6b7280;
          margin-top: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: none;
          }
          
          .certificate {
            width: 297mm;
            min-height: 210mm;
            margin: 0;
            padding: 12mm 18mm;
            box-sizing: border-box;
            page-break-after: avoid;
            page-break-inside: avoid;
            box-shadow: none;
            overflow: visible !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 0;
            overflow: visible;
          }
          
          .certificate-title {
            font-size: 30px !important;
          }
          
          .recipient-name {
            font-size: 36px !important;
          }
          
          .description {
            font-size: 13px !important;
          }
          
          .qr-code {
            width: 22mm !important;
            height: 22mm !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <!-- Corner Flourishes -->
        <div class="corner-flourish top-left">
          <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <defs>
              <linearGradient id="corner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#92400e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#d97706;stop-opacity:0.3" />
              </linearGradient>
            </defs>
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill="url(#corner-grad)"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill="#92400e"/>
            <circle cx="25" cy="25" r="6" fill="#b8860b"/>
            <circle cx="50" cy="12" r="3" fill="#d97706"/>
            <circle cx="12" cy="50" r="3" fill="#d97706"/>
            <path d="M35 8 Q45 18 35 28 Q25 18 35 8" fill="#b8860b" opacity="0.7"/>
            <path d="M8 35 Q18 45 28 35 Q18 25 8 35" fill="#b8860b" opacity="0.7"/>
          </svg>
        </div>
        <div class="corner-flourish top-right">
          <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill="url(#corner-grad)"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill="#92400e"/>
            <circle cx="25" cy="25" r="6" fill="#b8860b"/>
            <circle cx="50" cy="12" r="3" fill="#d97706"/>
            <circle cx="12" cy="50" r="3" fill="#d97706"/>
          </svg>
        </div>
        <div class="corner-flourish bottom-left">
          <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill="#92400e" opacity="0.3"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill="#92400e"/>
            <circle cx="25" cy="25" r="6" fill="#b8860b"/>
          </svg>
        </div>
        <div class="corner-flourish bottom-right">
          <svg viewBox="0 0 200 200" style="width: 100%; height: 100%;">
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill="#92400e" opacity="0.3"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill="#92400e"/>
            <circle cx="25" cy="25" r="6" fill="#b8860b"/>
          </svg>
        </div>
        
        <!-- Inner Frames -->
        <div class="inner-frame"></div>
        <div class="inner-frame-2"></div>
        
        <!-- Top Decoration -->
        <div class="top-decoration">
          <svg viewBox="0 0 600 30" style="width: 100%; height: 100%;">
            <defs>
              <linearGradient id="top-border-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#92400e;stop-opacity:0" />
                <stop offset="20%" style="stop-color:#92400e;stop-opacity:1" />
                <stop offset="50%" style="stop-color:#b8860b;stop-opacity:1" />
                <stop offset="80%" style="stop-color:#92400e;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#92400e;stop-opacity:0" />
              </linearGradient>
            </defs>
            <line x1="0" y1="15" x2="250" y2="15" stroke="url(#top-border-grad)" stroke-width="2"/>
            <line x1="350" y1="15" x2="600" y2="15" stroke="url(#top-border-grad)" stroke-width="2"/>
            <circle cx="300" cy="15" r="8" fill="#b8860b"/>
            <circle cx="300" cy="15" r="4" fill="#92400e"/>
            <circle cx="265" cy="15" r="3" fill="#d97706"/>
            <circle cx="335" cy="15" r="3" fill="#d97706"/>
          </svg>
        </div>
        
        <!-- Watermark -->
        <div class="watermark">IJARCM</div>
        
        <!-- QR Code Section -->
        <div class="qr-section">
          <img src="${qrCodeDataUrl}" alt="Verification QR Code" class="qr-code" />
          <p class="qr-text">Scan to Verify</p>
        </div>
        
        <!-- Header Section -->
        <div class="header">
          <div class="seal">
            <span class="seal-icon">ðŸ†</span>
          </div>
          <h1 class="certificate-title">${getCertificateTypeText(type)}</h1>
          <div class="divider">
            <div class="divider-line"></div>
            <div class="divider-stars">
              <span>â˜…</span>
              <span>â˜…</span>
              <span>â˜…</span>
            </div>
            <div class="divider-line right"></div>
          </div>
          <h2 class="institution-name">International Journal of Academic Research</h2>
          <h3 class="institution-subtitle">in Commerce &amp; Management (IJARCM)</h3>
          <div class="issn-container">
            <span>ISSN (Print): 2455-0116</span>
            <span class="issn-separator">â€¢</span>
            <span>ISSN (Online): 2395-6410</span>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <p class="description">
            ${getCertificateDescription(type)}
          </p>
          
          <div class="recipient">
            <p class="recipient-label">This is to certify that</p>
            <h2 class="recipient-name">${authorName}</h2>
            ${institution ? `<p class="recipient-institution">${institution}</p>` : ''}
          </div>
          
          <div class="paper-section">
            <p class="paper-label">For the Research Paper Entitled</p>
            <h3 class="paper-title">"${title}"</h3>
          </div>
        </div>
        
        <!-- Footer Section -->
        <div class="footer">
          <div class="date-section">
            <div class="section-label">
              <span>ðŸ“…</span>
              <span>Date of Issuance</span>
            </div>
            <p class="date-value">${formatDate(issuedAt)}</p>
          </div>
          
          <div class="cert-number-section">
            <div class="section-label center">
              <span>ðŸ›¡ï¸</span>
              <span>Certificate Reference</span>
            </div>
            <p class="cert-value">${certificateNumber}</p>
          </div>
          
          <div class="signature-section">
            <img src="/uploads/signatures/managing-director-signature.svg" alt="Authorized Signature" class="signature-image" onerror="this.src='/uploads/signatures/managing-director-signature.png'" />
            <div class="signature-line">
              <p class="signature-title">Managing Director</p>
              <p class="signature-org">IJARCM</p>
            </div>
          </div>
        </div>
        
        <!-- Legal Notice -->
        <div class="legal-notice">
          <div class="notice-box">
            <span class="notice-icon">âš–ï¸</span>
            <div class="notice-content">
              <p class="notice-title">Legal Notice</p>
              <p>This certificate serves as official documentation of academic achievement and is issued solely for personal and professional portfolio purposes. The International Journal of Academic Research in Commerce &amp; Management (IJARCM) maintains exclusive authority over certificate verification and authenticity validation.</p>
            </div>
          </div>
        </div>
        
        <!-- Verification Portal -->
        <div class="verification">
          <p class="verification-title">Official Verification & DOI Portal</p>
          <p class="verification-url">ijarcm.com/verify/${certificateNumber}</p>
          <p class="verification-hint">Verify the authenticity of this certificate using the reference number above</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Award, Calendar, Shield, Star, BookOpen, GraduationCap } from 'lucide-react';
import { ISSN_PRINT, ISSN_ONLINE, type CertificateProps } from '@/types/certificate';

// Managing Director Signature - use the PNG asset that exists in public/
const MANAGING_DIRECTOR_SIGNATURE = '/managing-director-signature.png';

export default function Certificate({
  certificateNumber,
  authorName,
  title,
  institution,
  issuedAt,
  type,
  showDownload = true,
  isPreview = false,
  conferenceName,
  conferenceDates,
  topic,
  prize,
  customDate,
  template = 'classic',
  conferenceParticipationType = 'both',
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 1123,
        height: 794,
      });
      const link = document.createElement('a');
      link.download = `certificate-${certificateNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayDate = customDate || issuedAt;

  const getCertificateTypeText = (type: string, participationType?: 'participation' | 'presentation' | 'both') => {
    switch (type) {
      case 'PUBLICATION':
        return 'CERTIFICATE OF PUBLICATION';
      case 'PARTICIPATION':
        return 'CERTIFICATE OF PARTICIPATION';
      case 'REVIEW':
        return 'CERTIFICATE OF PEER REVIEW';
      case 'AWARD':
        return 'CERTIFICATE OF EXCELLENCE';
      case 'CONFERENCE':
        switch (participationType) {
          case 'participation':
            return 'CERTIFICATE OF CONFERENCE PARTICIPATION';
          case 'presentation':
            return 'CERTIFICATE OF CONFERENCE PRESENTATION';
          case 'both':
          default:
            return 'CERTIFICATE OF CONFERENCE PARTICIPATION AND PRESENTATION';
        }
      default:
        return 'CERTIFICATE OF ACHIEVEMENT';
    }
  };

  const getCertificateDescription = (type: string) => {
    switch (type) {
      case 'PUBLICATION':
        return 'IJARCM hereby certifies that the distinguished scholar named herein has successfully published an original research contribution, which has undergone rigorous double-blind peer review, demonstrating adherence to the highest standards of academic excellence and research integrity.';
      case 'PARTICIPATION':
        return 'IJARCM takes pride in recognizing the valuable participation and scholarly engagement of the individual named herein. Their dedication to advancing academic discourse and contributing to the research community is hereby acknowledged with appreciation.';
      case 'REVIEW':
        return 'IJARCM formally recognizes the esteemed scholar named herein for their invaluable service as a Peer Reviewer. Their expertise and commitment to maintaining scholarly standards have significantly contributed to the advancement of academic research.';
      case 'AWARD':
        return 'IJARCM is honored to present this recognition of outstanding scholarly achievement. The recipient named herein has demonstrated exceptional excellence in research contribution, earning this distinguished acknowledgment from the academic community.';
      case 'CONFERENCE':
        return '';
      default:
        return 'IJARCM hereby presents this certificate in formal recognition of distinguished scholarly achievement and contribution to academic excellence.';
    }
  };

  // Template-specific styles - REVAMPED PROFESSIONAL THEMES
  const getTemplateStyles = () => {
    switch (template) {
      case 'modern':
        // Royal Navy Blue - Premium Corporate Theme
        return {
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 15%, #cbd5e1 30%, #e2e8f0 50%, #f1f5f9 70%, #f8fafc 100%)',
          border: '4px solid #1e3a8a',
          primaryColor: '#1e3a8a',
          secondaryColor: '#3b82f6',
          accentColor: '#60a5fa',
          goldAccent: '#c9a227',
          textColor: '#1e293b',
          watermarkColor: '#1e3a8a',
          headerGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
          sealGradient: 'radial-gradient(circle at 30% 30%, #3b82f6 0%, #1e3a8a 50%, #172554 100%)',
          innerBorderColor: '#3b82f6',
          ornamentColor: '#1e3a8a',
        };
      case 'elegant':
        // Emerald & Gold - Distinguished Academic Theme
        return {
          background: 'linear-gradient(135deg, #fefdfb 0%, #f5f7f0 15%, #ecf0e5 30%, #f5f7f0 50%, #fafcf7 70%, #fefdfb 100%)',
          border: '4px solid #065f46',
          primaryColor: '#065f46',
          secondaryColor: '#059669',
          accentColor: '#34d399',
          goldAccent: '#b8860b',
          textColor: '#134e4a',
          watermarkColor: '#065f46',
          headerGradient: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)',
          sealGradient: 'radial-gradient(circle at 30% 30%, #10b981 0%, #065f46 50%, #022c22 100%)',
          innerBorderColor: '#059669',
          ornamentColor: '#065f46',
        };
      default: // classic
        // Royal Gold & Burgundy - Prestigious Classic Theme
        return {
          background: 'linear-gradient(135deg, #fffef8 0%, #fef9e7 15%, #fdf3d0 30%, #fef9e7 50%, #fffcf2 70%, #fffef8 100%)',
          border: '4px solid #92400e',
          primaryColor: '#92400e',
          secondaryColor: '#d97706',
          accentColor: '#fbbf24',
          goldAccent: '#b8860b',
          textColor: '#78350f',
          watermarkColor: '#92400e',
          headerGradient: 'linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)',
          sealGradient: 'radial-gradient(circle at 30% 30%, #fbbf24 0%, #92400e 50%, #451a03 100%)',
          innerBorderColor: '#d97706',
          ornamentColor: '#92400e',
        };
    }
  };

  const templateStyles = getTemplateStyles();

  // Get icon based on template
  const getTemplateIcon = () => {
    switch (template) {
      case 'modern':
        return <BookOpen className="w-8 h-8 text-blue-300" />;
      case 'elegant':
        return <GraduationCap className="w-8 h-8 text-emerald-300" />;
      default:
        return <Award className="w-8 h-8 text-amber-300" />;
    }
  };

  return (
    <>
      <style>{`
        @media print {
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @page { size: A4 landscape; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .cert-print-wrapper { overflow: visible !important; width: 100% !important; }
          .cert-main {
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    <div className="cert-print-wrapper w-full" style={{ overflowX: 'auto' }}>
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="cert-main relative overflow-hidden shadow-2xl mx-auto"
        style={{
          width: '1123px',
          height: '794px',
          display: 'flex',
          flexDirection: 'column',
          background: templateStyles.background,
          borderRadius: '12px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 10px 30px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* BCA-style 3-border system */}
        <div style={{ position:'absolute', inset:'28px', border:`2px solid ${templateStyles.goldAccent}`, borderRadius:'2px', pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', inset:'40px', border:`1px solid ${templateStyles.goldAccent}`, pointerEvents:'none', zIndex:1 }} />
        <div style={{ position:'absolute', inset:'46px', border:`1px solid ${templateStyles.goldAccent}70`, pointerEvents:'none', zIndex:1 }} />

        {/* Greek-key ornament band — top */}
        <div style={{ position:'absolute', top:'64px', left:'150px', right:'150px', height:'18px', pointerEvents:'none', zIndex:2, overflow:'hidden' }}>
          <svg width="100%" height="18" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id={`gk-t-${template}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M0 17 V1 H17 V9 H9 V17" fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.3" strokeLinecap="square"/>
              </pattern>
            </defs>
            <rect width="100%" height="18" fill={`url(#gk-t-${template})`} opacity="0.75"/>
          </svg>
        </div>

        {/* Greek-key ornament band — bottom */}
        <div style={{ position:'absolute', bottom:'64px', left:'150px', right:'150px', height:'18px', pointerEvents:'none', zIndex:2, overflow:'hidden' }}>
          <svg width="100%" height="18" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id={`gk-b-${template}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
                <path d="M0 1 V17 H17 V9 H9 V1" fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.3" strokeLinecap="square"/>
              </pattern>
            </defs>
            <rect width="100%" height="18" fill={`url(#gk-b-${template})`} opacity="0.75"/>
          </svg>
        </div>

        {/* BCA Corner flourishes */}
        {/* Top-left */}
        <div style={{ position:'absolute', top:'38px', left:'38px', width:'90px', height:'90px', pointerEvents:'none', zIndex:2 }}>
          <svg viewBox="0 0 110 110" style={{width:'100%',height:'100%'}}>
            <g fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.2" strokeLinecap="round">
              <path d="M10 60 C 10 30, 30 10, 60 10" />
              <path d="M18 60 C 18 34, 34 18, 60 18" opacity="0.6"/>
              <path d="M28 28 Q 40 22, 52 28 Q 46 40, 52 52 Q 40 46, 28 52 Q 34 40, 28 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.18" stroke="none"/>
              <circle cx="40" cy="40" r="3" fill={templateStyles.goldAccent} stroke="none"/>
              <path d="M60 10 Q 70 18, 70 28" />
              <path d="M10 60 Q 18 70, 28 70" />
              <path d="M52 28 Q 64 24, 76 32 Q 70 36, 60 34 Q 56 32, 52 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
              <path d="M28 52 Q 24 64, 32 76 Q 36 70, 34 60 Q 32 56, 28 52 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
            </g>
          </svg>
        </div>
        {/* Top-right */}
        <div style={{ position:'absolute', top:'38px', right:'38px', width:'90px', height:'90px', pointerEvents:'none', zIndex:2, transform:'scaleX(-1)' }}>
          <svg viewBox="0 0 110 110" style={{width:'100%',height:'100%'}}>
            <g fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.2" strokeLinecap="round">
              <path d="M10 60 C 10 30, 30 10, 60 10" />
              <path d="M18 60 C 18 34, 34 18, 60 18" opacity="0.6"/>
              <path d="M28 28 Q 40 22, 52 28 Q 46 40, 52 52 Q 40 46, 28 52 Q 34 40, 28 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.18" stroke="none"/>
              <circle cx="40" cy="40" r="3" fill={templateStyles.goldAccent} stroke="none"/>
              <path d="M60 10 Q 70 18, 70 28" />
              <path d="M10 60 Q 18 70, 28 70" />
              <path d="M52 28 Q 64 24, 76 32 Q 70 36, 60 34 Q 56 32, 52 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
              <path d="M28 52 Q 24 64, 32 76 Q 36 70, 34 60 Q 32 56, 28 52 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
            </g>
          </svg>
        </div>
        {/* Bottom-left */}
        <div style={{ position:'absolute', bottom:'38px', left:'38px', width:'90px', height:'90px', pointerEvents:'none', zIndex:2, transform:'scaleY(-1)' }}>
          <svg viewBox="0 0 110 110" style={{width:'100%',height:'100%'}}>
            <g fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.2" strokeLinecap="round">
              <path d="M10 60 C 10 30, 30 10, 60 10" />
              <path d="M18 60 C 18 34, 34 18, 60 18" opacity="0.6"/>
              <path d="M28 28 Q 40 22, 52 28 Q 46 40, 52 52 Q 40 46, 28 52 Q 34 40, 28 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.18" stroke="none"/>
              <circle cx="40" cy="40" r="3" fill={templateStyles.goldAccent} stroke="none"/>
              <path d="M60 10 Q 70 18, 70 28" />
              <path d="M10 60 Q 18 70, 28 70" />
              <path d="M52 28 Q 64 24, 76 32 Q 70 36, 60 34 Q 56 32, 52 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
              <path d="M28 52 Q 24 64, 32 76 Q 36 70, 34 60 Q 32 56, 28 52 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
            </g>
          </svg>
        </div>
        {/* Bottom-right */}
        <div style={{ position:'absolute', bottom:'38px', right:'38px', width:'90px', height:'90px', pointerEvents:'none', zIndex:2, transform:'scale(-1,-1)' }}>
          <svg viewBox="0 0 110 110" style={{width:'100%',height:'100%'}}>
            <g fill="none" stroke={templateStyles.goldAccent} strokeWidth="1.2" strokeLinecap="round">
              <path d="M10 60 C 10 30, 30 10, 60 10" />
              <path d="M18 60 C 18 34, 34 18, 60 18" opacity="0.6"/>
              <path d="M28 28 Q 40 22, 52 28 Q 46 40, 52 52 Q 40 46, 28 52 Q 34 40, 28 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.18" stroke="none"/>
              <circle cx="40" cy="40" r="3" fill={templateStyles.goldAccent} stroke="none"/>
              <path d="M60 10 Q 70 18, 70 28" />
              <path d="M10 60 Q 18 70, 28 70" />
              <path d="M52 28 Q 64 24, 76 32 Q 70 36, 60 34 Q 56 32, 52 28 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
              <path d="M28 52 Q 24 64, 32 76 Q 36 70, 34 60 Q 32 56, 28 52 Z" fill={templateStyles.goldAccent} fillOpacity="0.25" stroke="none"/>
            </g>
          </svg>
        </div>

        {/* Watermark Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center overflow-hidden">
          <div 
            className="font-serif tracking-[0.5em] transform -rotate-12"
            style={{ 
              fontSize: '140px',
              color: templateStyles.watermarkColor,
              fontWeight: 'bold',
              letterSpacing: '0.3em'
            }}
          >
            IJARCM
          </div>
        </div>

        {/* Main Content Wrapper */}
        <div className="flex-1 flex flex-col px-16 relative" style={{ paddingTop: '86px', paddingBottom: '150px', zIndex: 50 }}>
          {/* Header Section */}
          <div className="text-center" style={{ marginBottom: '6px' }}>
            <h1
              style={{
                fontSize: '1.45rem',
                letterSpacing: '0.18em',
                marginBottom: '6px',
                color: templateStyles.textColor,
                fontWeight: 700,
                fontFamily: 'Georgia, "Times New Roman", serif',
                lineHeight: 1.25,
              }}
            >
              {getCertificateTypeText(type, conferenceParticipationType)}
            </h1>

            {/* Divider */}
            <div className="flex items-center justify-center gap-3" style={{ marginBottom: '4px' }}>
              <div className="w-28 h-[2px]" style={{ background: `linear-gradient(to right, transparent, ${templateStyles.goldAccent})` }} />
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
                <Star className="w-4 h-4" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
                <Star className="w-3 h-3" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
              </div>
              <div className="w-28 h-[2px]" style={{ background: `linear-gradient(to left, transparent, ${templateStyles.goldAccent})` }} />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: templateStyles.primaryColor, marginBottom: '2px' }}>BY</p>
            <h2 className="text-sm font-semibold tracking-wide" style={{ color: templateStyles.textColor, marginBottom: '4px' }}>
              International Journal of Academic Research in Commerce &amp; Management (IJARCM)
            </h2>

            <div
              className="inline-flex items-center gap-4 px-4 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${templateStyles.primaryColor}10, ${templateStyles.secondaryColor}10)`,
                border: `1px solid ${templateStyles.secondaryColor}40`,
                fontSize: '0.7rem',
                padding: '2px 14px',
              }}
            >
              <span className="font-mono font-medium" style={{ color: templateStyles.textColor }}>ISSN (Print): {ISSN_PRINT}</span>
              <span style={{ color: templateStyles.secondaryColor }}>•</span>
              <span className="font-mono font-medium" style={{ color: templateStyles.textColor }}>ISSN (Online): {ISSN_ONLINE}</span>
            </div>
          </div>

          {/* Main Content - Certification Body */}
          <div className="text-center flex-1 flex flex-col justify-center" style={{ gap: '6px' }}>
            {/* Description */}
            {getCertificateDescription(type) && (
              <p
                style={{
                  fontSize: '0.78rem',
                  lineHeight: 1.55,
                  color: '#4b5563',
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  textIndent: '2em',
                  textAlign: 'justify',
                  margin: '0 auto',
                  maxWidth: '820px',
                }}
              >
                {getCertificateDescription(type)}
              </p>
            )}

            {/* Recipient */}
            <div>
              <p className="text-xs uppercase tracking-[0.15em]" style={{ color: templateStyles.primaryColor, fontWeight: 600, marginBottom: '4px' }}>
                This is to certify that
              </p>
              <div className="relative inline-block">
                <h2
                  style={{
                    fontSize: '2.2rem',
                    color: templateStyles.textColor,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    margin: '0 3rem 4px',
                  }}
                >
                  {authorName}
                </h2>
                <div className="h-[2px] mx-auto" style={{ width: '80%', background: `linear-gradient(to right, transparent, ${templateStyles.goldAccent}, transparent)` }} />
              </div>
              {institution && (
                <p className="text-sm italic" style={{ color: '#6b7280', marginTop: '2px' }}>{institution}</p>
              )}
            </div>

            {/* Paper / Conference Details */}
            <div>
              {type === 'CONFERENCE' ? (
                <>
                  {conferenceName && (
                    <>
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: templateStyles.primaryColor, fontWeight: 600, marginBottom: '3px' }}>
                        For Participation &amp; Presentation In
                      </p>
                      <h3 className="text-sm font-semibold mx-auto leading-snug" style={{ color: templateStyles.textColor, maxWidth: '700px' }}>
                        &ldquo;{conferenceName}&rdquo;
                      </h3>
                    </>
                  )}
                  {conferenceDates && (
                    <p className="text-xs text-gray-600 italic" style={{ marginTop: '2px' }}>ORGANISED ON {conferenceDates}</p>
                  )}
                </>
              ) : title && (
                <>
                  <p className="text-xs uppercase tracking-[0.2em]" style={{ color: templateStyles.primaryColor, fontWeight: 600, marginBottom: '3px' }}>
                    For the Research Paper Entitled
                  </p>
                  <h3 className="text-sm font-medium mx-auto leading-snug px-8" style={{ color: templateStyles.textColor, fontFamily: 'Georgia, "Times New Roman", serif', maxWidth: '820px' }}>
                    &ldquo;{title}&rdquo;
                  </h3>
                </>
              )}
            </div>

            {/* Topic and Prize */}
            {(topic || prize) && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem' }}>
                {topic && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: templateStyles.primaryColor, marginBottom: '2px' }}>
                      Research Topic
                    </p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 500, fontStyle: 'italic', color: templateStyles.textColor }}>
                      {topic}
                    </p>
                  </div>
                )}
                {topic && prize && (
                  <div style={{ width: '1px', background: `${templateStyles.goldAccent}60`, alignSelf: 'stretch' }} />
                )}
                {prize && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: templateStyles.primaryColor, marginBottom: '2px' }}>
                      Honor Received
                    </p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: templateStyles.goldAccent }}>
                      {prize}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer row - normal flow, always after flex-1 body */}
          <div
            className="flex justify-between items-end"
            style={{ borderTop: `2px solid ${templateStyles.goldAccent}30`, paddingTop: '12px', paddingLeft: '32px', paddingRight: '32px', paddingBottom: '8px', marginTop: 'auto' }}
          >
            {/* Date Section */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: templateStyles.primaryColor }} />
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: templateStyles.primaryColor }}>
                  Date of Issue
                </span>
              </div>
              <p className="text-lg font-semibold" style={{ color: templateStyles.textColor }}>
                {formatDate(displayDate)}
              </p>
            </div>

            {/* Certificate Number Section */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4" style={{ color: templateStyles.primaryColor }} />
                <span className="text-xs uppercase tracking-wider font-semibold" style={{ color: templateStyles.primaryColor }}>
                  Certificate Reference
                </span>
              </div>
              <p className="text-lg font-bold font-mono tracking-wider" style={{ color: templateStyles.textColor }}>
                {certificateNumber}
              </p>
            </div>

            {/* Signature Section */}
            <div className="text-right">
              <div className="w-36 flex flex-col items-end">
                <div style={{ height: '64px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', width: '100%' }}>
                  <img
                    src={MANAGING_DIRECTOR_SIGNATURE}
                    alt="Authorized Signature"
                    style={{ maxHeight: '56px', maxWidth: '100%', objectFit: 'contain', filter: 'contrast(1.1)' }}
                  />
                </div>
                <div className="w-full pt-2" style={{ borderTop: `2px solid ${templateStyles.primaryColor}` }}>
                  <p className="text-sm font-semibold" style={{ color: templateStyles.textColor }}>Managing Director</p>
                  <p className="text-xs text-gray-500">IJARCM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="text-center mt-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: templateStyles.primaryColor }}>
              Official Verification & DOI Portal
            </p>
            <p className="text-base font-mono font-bold tracking-wide" style={{ color: templateStyles.textColor }}>
              ijarcm.com/verify/{certificateNumber}
            </p>
          </div>

        </div>
      </div>

    </div>

      {showDownload && (
        <div className="flex justify-center mt-4">
          <button
            onClick={handleDownloadImage}
            disabled={downloading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 28px',
              background: downloading ? '#9ca3af' : 'linear-gradient(135deg, #92400e, #d97706)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: downloading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              letterSpacing: '0.03em',
            }}
          >
            {downloading ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Certificate as Image
              </>
            )}
          </button>
        </div>
      )}
    </>
  );
}

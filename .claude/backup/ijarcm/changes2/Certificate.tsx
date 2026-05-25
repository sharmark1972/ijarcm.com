'use client';

import { useState, useRef } from 'react';
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
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const displayDate = customDate || issuedAt;

  const getCertificateTypeText = (type: string) => {
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
        return 'CERTIFICATE OF CONFERENCE PARTICIPATION AND PRESENTATION';
      default:
        return 'CERTIFICATE OF ACHIEVEMENT';
    }
  };

  const getCertificateDescription = (type: string) => {
    switch (type) {
      case 'PUBLICATION':
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) hereby certifies that the distinguished scholar named herein has successfully completed the publication of an original research contribution. This scholarly work has undergone comprehensive double-blind peer review, demonstrating adherence to the highest standards of academic excellence and research integrity.';
      case 'PARTICIPATION':
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) takes pride in recognizing the valuable participation and scholarly engagement of the individual named herein. Their dedication to advancing academic discourse and contributing to the research community is hereby acknowledged with appreciation.';
      case 'REVIEW':
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) formally recognizes and expresses gratitude to the esteemed scholar named herein for their invaluable service as a Peer Reviewer. Their expertise, critical analysis, and commitment to maintaining scholarly standards have significantly contributed to the advancement of academic research.';
      case 'AWARD':
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) is honored to present this recognition of outstanding scholarly achievement. The recipient named herein has demonstrated exceptional excellence in research contribution, earning this distinguished acknowledgment from the academic community.';
      case 'CONFERENCE':
        return ``;
      default:
        return 'The International Journal of Academic Research in Commerce & Management (IJARCM) hereby presents this certificate in formal recognition of distinguished scholarly achievement and contribution to academic excellence.';
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
    <div className="w-full max-w-7xl mx-auto overflow-x-auto">
      {/* Certificate */}
      <div
        ref={certificateRef}
        className="relative overflow-hidden shadow-2xl mx-auto"
        style={{
          width: '1200px',
          minHeight: '850px',
          display: 'flex',
          flexDirection: 'column',
          background: templateStyles.background,
          border: templateStyles.border,
          borderRadius: '12px',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25), 0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        {/* Decorative Corner Flourishes */}
        <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ opacity: 0.6 }}>
            <defs>
              <linearGradient id={`corner-gradient-${template}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: templateStyles.secondaryColor, stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill={`url(#corner-gradient-${template})`}/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill={templateStyles.primaryColor}/>
            <circle cx="25" cy="25" r="6" fill={templateStyles.goldAccent}/>
            <circle cx="50" cy="12" r="3" fill={templateStyles.secondaryColor}/>
            <circle cx="12" cy="50" r="3" fill={templateStyles.secondaryColor}/>
            <path d="M35 8 Q45 18 35 28 Q25 18 35 8" fill={templateStyles.goldAccent} opacity="0.7"/>
            <path d="M8 35 Q18 45 28 35 Q18 25 8 35" fill={templateStyles.goldAccent} opacity="0.7"/>
          </svg>
        </div>
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none" style={{transform: 'scaleX(-1)'}}>
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ opacity: 0.6 }}>
            <defs>
              <linearGradient id={`corner-gradient2-${template}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: templateStyles.secondaryColor, stopOpacity: 0.3 }} />
              </linearGradient>
            </defs>
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill={`url(#corner-gradient2-${template})`}/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill={templateStyles.primaryColor}/>
            <circle cx="25" cy="25" r="6" fill={templateStyles.goldAccent}/>
            <circle cx="50" cy="12" r="3" fill={templateStyles.secondaryColor}/>
            <circle cx="12" cy="50" r="3" fill={templateStyles.secondaryColor}/>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none" style={{transform: 'scaleY(-1)'}}>
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ opacity: 0.6 }}>
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill={templateStyles.primaryColor} opacity="0.3"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill={templateStyles.primaryColor}/>
            <circle cx="25" cy="25" r="6" fill={templateStyles.goldAccent}/>
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-40 h-40 pointer-events-none" style={{transform: 'scale(-1, -1)'}}>
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ opacity: 0.6 }}>
            <path d="M0 0 L200 0 L200 15 L15 15 L15 200 L0 200 Z" fill={templateStyles.primaryColor} opacity="0.3"/>
            <path d="M0 0 L80 0 L80 8 L8 8 L8 80 L0 80 Z" fill={templateStyles.primaryColor}/>
            <circle cx="25" cy="25" r="6" fill={templateStyles.goldAccent}/>
          </svg>
        </div>

        {/* Inner Decorative Frame */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '20px',
            left: '20px',
            right: '20px',
            bottom: '20px',
            border: `2px solid ${templateStyles.innerBorderColor}`,
            borderRadius: '8px',
            opacity: 0.5,
          }}
        />
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '28px',
            left: '28px',
            right: '28px',
            bottom: '28px',
            border: `1px solid ${templateStyles.secondaryColor}`,
            borderRadius: '6px',
            opacity: 0.3,
          }}
        />

        {/* Elegant Top Border Design */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3/4 pointer-events-none">
          <svg viewBox="0 0 600 30" className="w-full h-8">
            <defs>
              <linearGradient id={`top-border-${template}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 0 }} />
                <stop offset="20%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: templateStyles.goldAccent, stopOpacity: 1 }} />
                <stop offset="80%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: templateStyles.primaryColor, stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            <line x1="0" y1="15" x2="250" y2="15" stroke={`url(#top-border-${template})`} strokeWidth="2"/>
            <line x1="350" y1="15" x2="600" y2="15" stroke={`url(#top-border-${template})`} strokeWidth="2"/>
            <circle cx="300" cy="15" r="8" fill={templateStyles.goldAccent}/>
            <circle cx="300" cy="15" r="4" fill={templateStyles.primaryColor}/>
            <circle cx="265" cy="15" r="3" fill={templateStyles.secondaryColor}/>
            <circle cx="335" cy="15" r="3" fill={templateStyles.secondaryColor}/>
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
        <div className="flex-1 flex flex-col px-20 py-14 relative z-10 overflow-visible">
          {/* Header Section */}
          <div className="text-center mb-6">
            {/* Prestigious Seal */}
            <div className="flex justify-center mb-5">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-xl relative"
                style={{
                  background: templateStyles.sealGradient,
                  border: `4px solid ${templateStyles.goldAccent}`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.2)`,
                }}
              >
                {/* Inner ring */}
                <div 
                  className="absolute inset-2 rounded-full"
                  style={{ border: `1px solid ${templateStyles.goldAccent}`, opacity: 0.5 }}
                />
                {getTemplateIcon()}
              </div>
            </div>
            
            {/* Certificate Type - Premium Typography */}
            <h1 
              className="text-4xl font-serif tracking-[0.2em] mb-3"
              style={{
                color: templateStyles.textColor,
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                fontWeight: 700,
                fontFamily: 'Georgia, "Times New Roman", serif',
              }}
            >
              {getCertificateTypeText(type)}
            </h1>
            
            {/* Elegant Decorative Divider */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div 
                className="w-32 h-[2px]" 
                style={{ background: `linear-gradient(to right, transparent, ${templateStyles.goldAccent})` }}
              />
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
                <Star className="w-4 h-4" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
                <Star className="w-3 h-3" style={{ color: templateStyles.goldAccent }} fill="currentColor" />
              </div>
              <div 
                className="w-32 h-[2px]" 
                style={{ background: `linear-gradient(to left, transparent, ${templateStyles.goldAccent})` }}
              />
            </div>
            
            {/* Journal Name - Distinguished Typography */}
            <p
              className="text-lg font-bold mb-2 uppercase tracking-wider"
              style={{ color: templateStyles.primaryColor }}
            >
              BY
            </p>
            <h2
              className="text-xl font-semibold tracking-wide mb-1"
              style={{ color: templateStyles.textColor }}
            >
              International Journal of Academic Research
            </h2>
            <h3
              className="text-xl font-semibold tracking-wide"
              style={{ color: templateStyles.textColor }}
            >
              in Commerce & Management (IJARCM)
            </h3>
            
            {/* ISSN Numbers - Professional Display */}
            <div 
              className="mt-3 inline-flex items-center gap-4 px-5 py-2 rounded-full text-sm"
              style={{
                background: `linear-gradient(135deg, ${templateStyles.primaryColor}10, ${templateStyles.secondaryColor}10)`,
                border: `1px solid ${templateStyles.secondaryColor}40`,
              }}
            >
              <span className="font-mono font-medium" style={{ color: templateStyles.textColor }}>
                ISSN (Print): {ISSN_PRINT}
              </span>
              <span style={{ color: templateStyles.secondaryColor }}>•</span>
              <span className="font-mono font-medium" style={{ color: templateStyles.textColor }}>
                ISSN (Online): {ISSN_ONLINE}
              </span>
            </div>
          </div>

          {/* Main Content - Certification Body */}
          <div className="text-center flex-1 flex flex-col justify-center">
            {/* Professional Description */}
            <p 
              className="text-base leading-relaxed max-w-4xl mx-auto mb-6 text-justify"
              style={{ 
                color: '#4b5563',
                fontFamily: 'Georgia, "Times New Roman", serif',
                textIndent: '2em',
              }}
            >
              {getCertificateDescription(type)}
            </p>

            {/* Recipient Presentation */}
            <div className="mb-5">
              <p
                className="text-sm uppercase tracking-[0.15em] mb-4"
                style={{ color: templateStyles.primaryColor, fontWeight: 600 }}
              >
                This is to certify that
              </p>
              <div className="relative inline-block">
                <h2 
                  className="text-5xl mb-2 px-12 pb-2"
                  style={{
                    color: templateStyles.textColor,
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  {authorName}
                </h2>
                <div 
                  className="h-[2px] mx-auto"
                  style={{ 
                    width: '80%',
                    background: `linear-gradient(to right, transparent, ${templateStyles.goldAccent}, transparent)`,
                  }}
                />
              </div>
              {institution && (
                <p 
                  className="text-base mt-3 italic"
                  style={{ color: '#6b7280' }}
                >
                  {institution}
                </p>
              )}
            </div>

            {/* Paper Title or Conference Details */}
            <div className="mb-5">
              {type === 'CONFERENCE' ? (
                <>
                  {conferenceName && (
                    <>
                      <p 
                        className="text-sm uppercase tracking-[0.2em] mb-2"
                        style={{ color: templateStyles.primaryColor, fontWeight: 600 }}
                      >
                        For Participations & Presentation In
                      </p>
                      <h3 
                        className="text-xl font-semibold max-w-3xl mx-auto leading-relaxed"
                        style={{ color: templateStyles.textColor }}
                      >
                        &ldquo;{conferenceName}&rdquo;
                      </h3>
                    </>
                  )}
                  {conferenceDates && (
                    <p className="text-base text-gray-600 italic mt-2">
                      ORGANISED ON {conferenceDates}
                    </p>
                  )}
                </>
              ) : title && (
                <>
                  <p 
                    className="text-sm uppercase tracking-[0.2em] mb-2"
                    style={{ color: templateStyles.primaryColor, fontWeight: 600 }}
                  >
                    For the Research Paper Entitled
                  </p>
                  <h3 
                    className="text-lg font-medium max-w-4xl mx-auto leading-relaxed px-8"
                    style={{ 
                      color: templateStyles.textColor,
                      fontFamily: 'Georgia, "Times New Roman", serif',
                    }}
                  >
                    &ldquo;{title}&rdquo;
                  </h3>
                </>
              )}
            </div>

            {/* Topic and Prize Section - Enhanced Design */}
            {(topic || prize) && (
              <div style={{ 
                display: 'block',
                width: '100%',
                marginBottom: '1.25rem'
              }}>
                {topic && (
                  <div
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      marginBottom: '1rem',
                      background: `linear-gradient(135deg, ${templateStyles.primaryColor}08 0%, ${templateStyles.secondaryColor}05 100%)`,
                      border: `2px solid ${templateStyles.goldAccent}40`,
                      boxShadow: `0 4px 20px ${templateStyles.primaryColor}10`,
                    }}
                  >
                    <p
                      style={{ 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: templateStyles.primaryColor 
                      }}
                    >
                      <span>📌</span> Research Topic
                    </p>
                    <p
                      style={{ 
                        fontSize: '1rem',
                        fontWeight: '500',
                        fontStyle: 'italic',
                        color: templateStyles.textColor 
                      }}
                    >
                      {topic}
                    </p>
                  </div>
                )}
                {prize && (
                  <div
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '1.25rem',
                      borderRadius: '0.75rem',
                      textAlign: 'center',
                      background: `linear-gradient(135deg, ${templateStyles.primaryColor}08 0%, ${templateStyles.secondaryColor}05 100%)`,
                      border: `2px solid ${templateStyles.goldAccent}40`,
                      boxShadow: `0 4px 20px ${templateStyles.primaryColor}10`,
                    }}
                  >
                    <p
                      style={{ 
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        color: templateStyles.primaryColor 
                      }}
                    >
                      <span>🏆</span> Honor Received
                    </p>
                    <p
                      style={{ 
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: templateStyles.goldAccent 
                      }}
                    >
                      {prize}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Section - Professional Layout */}
          <div 
            className="flex justify-between items-end mt-auto pt-5"
            style={{ borderTop: `2px solid ${templateStyles.goldAccent}30` }}
          >
            {/* Date Section */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" style={{ color: templateStyles.primaryColor }} />
                <span 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: templateStyles.primaryColor }}
                >
                  Date of Issue
                </span>
              </div>
              <p 
                className="text-lg font-semibold"
                style={{ color: templateStyles.textColor }}
              >
                {formatDate(displayDate)}
              </p>
            </div>

            {/* Certificate Number Section */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-4 h-4" style={{ color: templateStyles.primaryColor }} />
                <span 
                  className="text-xs uppercase tracking-wider font-semibold"
                  style={{ color: templateStyles.primaryColor }}
                >
                  Certificate Reference
                </span>
              </div>
              <p 
                className="text-lg font-bold font-mono tracking-wider"
                style={{ color: templateStyles.textColor }}
              >
                {certificateNumber}
              </p>
            </div>

            {/* Signature Section */}
            <div className="text-right">
              <div className="w-36 flex flex-col items-end">
                <img
                  src={MANAGING_DIRECTOR_SIGNATURE}
                  alt="Authorized Signature"
                  className="max-h-14 max-w-full object-contain mb-1"
                  style={{ filter: 'contrast(1.1)' }}
                />
                <div 
                  className="w-full pt-2"
                  style={{ borderTop: `2px solid ${templateStyles.primaryColor}` }}
                >
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: templateStyles.textColor }}
                  >
                    Managing Director
                  </p>
                  <p className="text-xs text-gray-500">IJARCM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer and Verification - Professional Footer */}
          <div className="mt-5">
            {/* Verification Portal */}
            <div 
              className="p-4 rounded-lg text-center"
              style={{
                background: templateStyles.headerGradient,
                border: `2px solid ${templateStyles.goldAccent}`,
                boxShadow: `0 4px 20px ${templateStyles.primaryColor}30`,
              }}
            >
              <p
                className="text-xs font-bold mb-2 uppercase tracking-[0.2em]"
                style={{ color: templateStyles.goldAccent }}
              >
                Official Verification & DOI Portal
              </p>
              <p className="text-lg font-mono text-white font-bold tracking-wide">
                ijarcm.com/verify/{certificateNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Certificate from '@/components/Certificate';
import type { CertificateProps } from '@/types/certificate';

interface CertificateRecord {
  id: string;
  certificateNumber: string;
  type: CertificateProps['type'];
  title: string;
  authorName: string;
  institution?: string | null;
  topic?: string | null;
  prize?: string | null;
  issuedAt: string;
  customDate?: string | null;
  journal?: {
    id: string;
    name: string;
    abbreviation: string;
    website?: string | null;
    issnPrint?: string | null;
    issnOnline?: string | null;
    origin?: string | null;
    doiAllotted: boolean;
    isDefault: boolean;
    isActive: boolean;
  } | null;
}

export default function CertificateViewPage() {
  const params = useParams();
  const id = params.id as string;
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await fetch(`/api/certificates/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCertificate(data.certificate);
        } else {
          setError('Certificate not found');
        }
      } catch {
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCertificate();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Certificate not found'}</p>
          <Link href="/admin/certificates" className="text-blue-600 hover:underline">
            Back to Certificates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link
          href="/admin/certificates"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Certificates
        </Link>

        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">{certificate.certificateNumber}</h1>
          <p className="text-sm text-gray-500">{certificate.authorName} — {certificate.type}</p>
        </div>

        <Certificate
          certificateNumber={certificate.certificateNumber}
          authorName={certificate.authorName}
          title={certificate.title}
          institution={certificate.institution || ''}
          issuedAt={certificate.issuedAt}
          type={certificate.type}
          topic={certificate.topic || undefined}
          prize={certificate.prize || undefined}
          customDate={certificate.customDate || undefined}
          journal={certificate.journal || null}
          showDownload={true}
          isPreview={false}
        />
      </div>
    </div>
  );
}

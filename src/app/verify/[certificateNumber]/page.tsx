'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Award, CheckCircle, AlertCircle, Calendar, FileText, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function CertificateVerification() {
  const params = useParams();
  // const router = useRouter(); // Not used in current implementation
  const certificateNumber = params.certificateNumber as string;
  
  const [certificate, setCertificate] = useState<{
    certificateNumber: string;
    type: string;
    authorName: string;
    institution?: string;
    title: string;
    issuedAt: string;
    topic?: string;
    prize?: string;
    customDate?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/verify/${certificateNumber}`);
        
        if (response.ok) {
          const data = await response.json();
          setCertificate(data.certificate);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Certificate not found');
        }
      } catch {
        setError('Failed to verify certificate');
      } finally {
        setLoading(false);
      }
    };

    if (certificateNumber) {
      verifyCertificate();
    }
  }, [certificateNumber]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h1>
          <p className="text-gray-600">The certificate you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Certificate Verification</h1>
          <p className="mt-2 text-gray-600">Verify the authenticity of this certificate</p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Certificate #{certificate.certificateNumber}
              </h2>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4 text-white" />
                <span className="text-sm text-white">Verified</span>
              </div>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Certificate Type</h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {certificate.type === 'PUBLICATION' ? 'Certificate of Publication' : certificate.type}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Issued To</h3>
                  <p className="text-lg font-semibold text-gray-900">{certificate.authorName}</p>
                  {certificate.institution && (
                    <p className="text-gray-600">{certificate.institution}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Paper Title</h3>
                  <p className="text-gray-900 italic">&quot;{certificate.title}&quot;</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Issue Date
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(certificate.customDate || certificate.issuedAt)}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Award className="h-4 w-4 mr-1" />
                    Issuing Organization
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    IJARCM - International Journal of Academic Research in Commerce & Management
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    Certificate Status
                  </h3>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <p className="text-lg font-semibold text-green-600">Valid</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Information */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Verification Information</h3>
                    <p className="text-sm text-blue-700">
                      This certificate has been verified and is authentic. It was issued by the 
                      International Journal of Academic Research in Commerce & Management (IJARCM) 
                      for the publication of the research paper mentioned above.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <FileText className="h-4 w-4" />
                Print Verification
              </button>
              
              <Link
                href="/"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                Visit IJARCM
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>This verification page confirms the authenticity of the certificate.</p>
          <p className="mt-1">For any inquiries, please contact the IJARCM editorial team.</p>
        </div>
      </div>
    </div>
  );
}
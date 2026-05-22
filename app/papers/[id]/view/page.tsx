'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  filePath: string;
  status: string;
}

export default function PDFViewPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  const paperId = params.id as string;

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}`);
        if (response.ok) {
          const data = await response.json();
          const paperData = data.paper;
          
          if (!paperData) {
            setError('Paper not found');
            setLoading(false);
            return;
          }

          setPaper({
            id: paperData.id,
            title: paperData.title,
            filePath: paperData.filePath,
            status: paperData.status
          });

          if (paperData.filePath) {
            setPdfUrl(`/api/papers/${paperId}/pdf`);
          } else {
            setError('PDF file not available');
          }
        } else {
          setError('Failed to load paper');
        }
      } catch (err) {
        console.error('Error fetching paper:', err);
        setError('Failed to load paper');
      } finally {
        setLoading(false);
      }
    };

    fetchPaper();
  }, [paperId]);

  const handleDownload = async () => {
    if (!session) {
      alert('Please login to download papers');
      return;
    }

    try {
      const response = await fetch(`/api/papers/${paperId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.user?.id}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${paper?.title || 'paper'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Download failed. Please try again.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600 font-medium">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-slate-200">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            {error || 'Paper Not Found'}
          </h2>
          <p className="text-slate-600 mb-6">
            The paper you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href={`/papers/${paperId}`}
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Paper Details
          </Link>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-sm border border-slate-200">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">
            PDF Not Available
          </h2>
          <p className="text-slate-600 mb-6">
            The PDF file for this paper is not available.
          </p>
          <Link
            href={`/papers/${paperId}`}
            className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Paper Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href={`/papers/${paperId}`}
                className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="hidden md:flex items-center space-x-3 border-l border-slate-200 pl-4">
                <FileText className="w-5 h-5 text-slate-400" />
                <h1 className="text-lg font-serif font-bold text-slate-900 truncate max-w-xl">
                  {paper.title}
                </h1>
              </div>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl h-[85vh] bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full"
            title={`${paper.title} PDF Viewer`}
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

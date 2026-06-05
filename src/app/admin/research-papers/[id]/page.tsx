'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Users,
  Tag,
  Download,
  Edit,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface DraftAuthor {
  id: string;
  name: string;
  email: string | null;
  affiliation: string | null;
  isCorresponding: boolean;
  authorOrder: number;
}

interface DraftSection {
  id: string;
  heading: string;
  content: string;
  sectionOrder: number;
}

interface DraftIssue {
  id: string;
  title: string;
  volume: string;
  issueNumber: string;
  year: number;
  isPublished: boolean;
}

interface ResearchPaperDraft {
  id: string;
  title: string | null;
  abstract: string | null;
  keywords: string[] | null;
  doi: string | null;
  status: string;
  bodyColumnMode: string;
  sourceFileName: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  authors: DraftAuthor[];
  sections: DraftSection[];
  issue: DraftIssue | null;
}

export default function ResearchPaperViewPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const paperId = params.id as string;

  const [draft, setDraft] = useState<ResearchPaperDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }

    fetch(`/api/admin/research-papers/${paperId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.draft) setDraft(data.draft);
        else {
          alert('Paper not found');
          router.push('/admin/papers');
        }
      })
      .catch(() => {
        alert('Failed to fetch paper data');
        router.push('/admin/papers');
      })
      .finally(() => setLoading(false));
  }, [paperId]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
      DRAFT:         { color: 'bg-gray-100 text-gray-800',   icon: Clock },
      UPLOADED:      { color: 'bg-blue-100 text-blue-800',   icon: AlertCircle },
      EXTRACTED:     { color: 'bg-indigo-100 text-indigo-800', icon: AlertCircle },
      EDITING:       { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      READY:         { color: 'bg-teal-100 text-teal-800',   icon: CheckCircle },
      PDF_GENERATED: { color: 'bg-cyan-100 text-cyan-800',   icon: CheckCircle },
      PUBLISHED:     { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REJECTED:      { color: 'bg-red-100 text-red-800',     icon: XCircle },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  const handleDownload = async () => {
    if (!draft) return;
    setDownloading(true);
    try {
      const response = await fetch(`/api/admin/research-papers/${paperId}/download`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.title || 'research-paper'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const getKeywords = (): string[] => {
    if (!draft?.keywords) return [];
    if (Array.isArray(draft.keywords)) return draft.keywords as string[];
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paper Not Found</h1>
          <Link href="/admin/papers" className="text-blue-600 hover:text-blue-800">
            Return to Papers List
          </Link>
        </div>
      </div>
    );
  }

  const keywords = getKeywords();
  const abstractText = draft.abstract
    ? draft.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Link
                  href="/admin/papers"
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Paper Details</h1>
                  <p className="mt-2 text-gray-600">View and manage paper information</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {isAdmin() && (
                  <Link
                    href={`/admin/research-papers/new?id=${paperId}`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Paper Info Card */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Paper Information
                  </h2>
                  {getStatusBadge(draft.status)}
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {draft.title || <span className="text-gray-400 font-normal italic">No title yet</span>}
                  </h3>
                  {draft.sourceFileName && (
                    <p className="text-sm text-gray-500 mt-1">Source: {draft.sourceFileName}</p>
                  )}
                </div>

                {/* Abstract */}
                {abstractText && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Abstract</h4>
                    <p className="text-gray-600 leading-relaxed">{abstractText}</p>
                  </div>
                )}

                {/* Keywords */}
                {keywords.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* DOI */}
                {draft.doi && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">DOI</h4>
                    <p className="text-blue-700">{draft.doi}</p>
                  </div>
                )}

                {/* Issue Info */}
                {draft.issue && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-1">Published In</h4>
                    <p className="text-green-700">
                      {draft.issue.title}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Volume {draft.issue.volume}, Issue {draft.issue.issueNumber} ({draft.issue.year})
                    </p>
                  </div>
                )}

                {/* Download PDF */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Paper File</h4>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? 'Generating PDF...' : 'Download PDF'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">PDF is generated on-demand from paper content.</p>
                </div>
              </div>
            </div>

            {/* Sections Card */}
            {draft.sections && draft.sections.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Sections
                    <span className="ml-2 text-sm font-normal text-gray-500">({draft.sections.length})</span>
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {[...draft.sections]
                    .sort((a, b) => a.sectionOrder - b.sectionOrder)
                    .map((section, index) => (
                      <div key={section.id} className="px-6 py-3 flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-5">{index + 1}</span>
                        <span className="text-sm text-gray-800">{section.heading || 'Untitled Section'}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Authors Card */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Authors
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {draft.authors.length === 0 ? (
                  <p className="text-sm text-gray-400">No authors added yet</p>
                ) : (
                  [...draft.authors]
                    .sort((a, b) => a.authorOrder - b.authorOrder)
                    .map((author) => (
                      <div key={author.id} className="flex items-start space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-blue-600">
                            {author.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {author.name}
                            {author.isCorresponding && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                Corresponding
                              </span>
                            )}
                          </p>
                          {author.email && (
                            <p className="text-sm text-gray-500 truncate">{author.email}</p>
                          )}
                          {author.affiliation && (
                            <p className="text-xs text-gray-400">{author.affiliation}</p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Timeline
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-500">{formatDate(draft.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-500">{formatDate(draft.updatedAt)}</p>
                  </div>
                </div>
                {draft.publishedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Published</p>
                      <p className="text-sm text-gray-500">{formatDate(draft.publishedAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                {isAdmin() && (
                  <Link
                    href={`/admin/research-papers/new?id=${paperId}`}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Edit Paper</span>
                  </Link>
                )}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    {downloading ? 'Generating PDF...' : 'Download PDF'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

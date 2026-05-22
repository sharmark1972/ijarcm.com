'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  FileText,
  Users,
  Tag,
  Download,
  Edit,
  Eye,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthorData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    institution?: string;
  };
  isCorresponding: boolean;
}

interface ReviewData {
  id: string;
  reviewer: {
    firstName: string;
    lastName: string;
  };
  comments: string;
  score: number;
  recommendation: string;
  submittedAt: string;
}

interface PaperData {
  id: string;
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'PUBLISHED' | 'REVISION_REQUIRED';
  filePath: string;
  coverImage?: string;
  issueId?: string;
  volumeNumber?: string;
  issueNumber?: string;
  publicationDate?: string;
  uniqueNumber?: string;
  doi?: string;
  doiStatus?: string;
  submittedAt: string;
  publishedAt?: string;
  paperAuthors: AuthorData[];
  reviews: ReviewData[];
  downloads: number;
}

export default function AdminPaperViewPage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin } = useAuth();
  const paperId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  useEffect(() => {
    const fetchPaper = async () => {
      try {
        const response = await fetch(`/api/papers/${paperId}`);
        const result = await response.json();

        if (response.ok) {
          setPaper(result.paper);
        } else {
          alert(result.error || 'Failed to fetch paper data');
          router.push('/admin/papers');
        }
      } catch (error) {
        console.error('Error fetching paper:', error);
        alert('Failed to fetch paper data');
        router.push('/admin/papers');
      } finally {
        setLoading(false);
      }
    };

    if (paperId) {
      fetchPaper();
    }
  }, [paperId, router]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      SUBMITTED: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      UNDER_REVIEW: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      PUBLISHED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      REVISION_REQUIRED: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.SUBMITTED;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleDownloadCertificate = async () => {
    if (!paper || paper.status !== 'PUBLISHED') {
      alert('Certificate can only be generated for published papers');
      return;
    }

    setGeneratingCertificate(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/certificate`);
      const result = await response.json();

      if (response.ok) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.certificateHTML);
          printWindow.document.close();
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      } else {
        alert(result.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Paper Not Found</h1>
          <Link
            href="/admin/papers"
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Papers List
          </Link>
        </div>
      </div>
    );
  }

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
                    href={`/admin/papers/${paperId}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                )}
                {paper.status === 'PUBLISHED' && (
                  <button
                    onClick={handleDownloadCertificate}
                    disabled={generatingCertificate}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    {generatingCertificate ? 'Generating...' : 'Certificate'}
                  </button>
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
                  {getStatusBadge(paper.status)}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Cover Image */}
                {paper.coverImage && (
                  <div className="flex justify-center">
                    <Image
                      src={paper.coverImage}
                      alt="Paper cover"
                      width={400}
                      height={300}
                      className="object-cover rounded-lg border"
                    />
                  </div>
                )}

                {/* Title */}
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{paper.title}</h3>
                  {paper.uniqueNumber && (
                    <p className="text-sm text-gray-500 mt-1">Paper ID: {paper.uniqueNumber}</p>
                  )}
                </div>

                {/* Abstract */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Abstract</h4>
                  <p className="text-gray-600 leading-relaxed">{paper.abstract}</p>
                </div>

                {/* Keywords */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.split(',').map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Category</h4>
                    <p className="text-gray-900">{paper.category}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Downloads</h4>
                    <p className="text-gray-900 flex items-center">
                      <Download className="h-4 w-4 mr-1 text-gray-400" />
                      {paper.downloads}
                    </p>
                  </div>
                </div>

                {/* DOI */}
                {paper.doi && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">DOI</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-700">{paper.doi}</p>
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Resolve DOI
                      </a>
                    </div>
                    {paper.doiStatus && (
                      <p className="text-xs text-blue-600 mt-1">Status: {paper.doiStatus}</p>
                    )}
                  </div>
                )}

                {/* Issue Info */}
                {paper.issueId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-900 mb-1">Published In</h4>
                    <p className="text-green-700">
                      Volume {paper.volumeNumber}, Issue {paper.issueNumber}
                    </p>
                    {paper.publicationDate && (
                      <p className="text-sm text-green-600 mt-1">
                        Published: {formatDate(paper.publicationDate)}
                      </p>
                    )}
                  </div>
                )}

                {/* File Download */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Paper File</h4>
                  <Link
                    href={paper.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Link>
                </div>
              </div>
            </div>

            {/* Reviews Card */}
            {paper.reviews && paper.reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
                </div>

                <div className="p-6 space-y-4">
                  {paper.reviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {review.reviewer.firstName} {review.reviewer.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            Reviewed on {formatDate(review.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">Score: {review.score}/10</p>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            review.recommendation === 'ACCEPT' ? 'bg-green-100 text-green-800' :
                            review.recommendation === 'REJECT' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {review.recommendation}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600">{review.comments}</p>
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
                {paper.paperAuthors.map((author, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">
                        {author.user.firstName[0]}{author.user.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {author.user.firstName} {author.user.lastName}
                        {author.isCorresponding && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Corresponding
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{author.user.email}</p>
                      {author.user.institution && (
                        <p className="text-xs text-gray-400">{author.user.institution}</p>
                      )}
                    </div>
                  </div>
                ))}
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
                    <p className="text-sm font-medium text-gray-900">Submitted</p>
                    <p className="text-sm text-gray-500">{formatDate(paper.submittedAt)}</p>
                  </div>
                </div>

                {paper.publishedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="h-2 w-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Published</p>
                      <p className="text-sm text-gray-500">{formatDate(paper.publishedAt)}</p>
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
                <Link
                  href={`/papers/${paperId}`}
                  target="_blank"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View Public Page</span>
                </Link>

                {isAdmin() && (
                  <Link
                    href={`/admin/papers/${paperId}/edit`}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="h-5 w-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-900">Edit Paper</span>
                  </Link>
                )}

                <Link
                  href={paper.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Download PDF</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

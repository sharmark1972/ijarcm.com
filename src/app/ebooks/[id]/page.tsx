'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Book,
  Calendar,
  Tag,
  Download,
  ArrowLeft,
  Lock,
  DollarSign,
  Globe,
  FileText,
  Eye,
  Share2
} from 'lucide-react';

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  tags: string[];
  accessType: 'PUBLIC' | 'LOGGED_IN_ONLY' | 'PAID';
  price: number | null;
  isPublished: boolean;
  publishedAt: string | null;
  trialPages: number;
  totalPages: number | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EbookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewingPages, setViewingPages] = useState<number[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchEbook = async () => {
      try {
        const response = await fetch(`/api/ebooks/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setEbook(data.ebook);
        } else {
          throw new Error('Failed to fetch ebook');
        }
      } catch (error) {
        console.error('Failed to fetch ebook:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEbook();
  }, [params.id]);

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'PUBLIC':
        return <Globe className="h-5 w-5" />;
      case 'LOGGED_IN_ONLY':
        return <Lock className="h-5 w-5" />;
      case 'PAID':
        return <DollarSign className="h-5 w-5" />;
      default:
        return <Book className="h-5 w-5" />;
    }
  };

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'PUBLIC':
        return 'bg-green-100 text-green-800';
      case 'LOGGED_IN_ONLY':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewPage = (pageNumber: number) => {
    setViewingPages(prev => 
      prev.includes(pageNumber) 
        ? prev.filter(p => p !== pageNumber)
        : [...prev, pageNumber]
    );
    setShowPreview(true);
  };

  const handleDownload = async () => {
    if (!ebook) return;
    
    try {
      const response = await fetch(`/api/ebooks/${ebook.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${ebook.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download ebook');
      }
    } catch (error) {
      console.error('Error downloading ebook:', error);
      alert('Failed to download ebook');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ebook) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Book className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ebook Not Found</h2>
          <p className="text-gray-600 mb-4">The ebook you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => router.push('/ebooks')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Ebooks
          </button>
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
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/ebooks')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Ebooks
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{ebook.title}</h1>
                  <p className="mt-2 text-gray-600">by {ebook.author}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover and Basic Info */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-64 bg-gray-200">
                {ebook.coverImage ? (
                  <Image
                    src={ebook.coverImage}
                    alt={ebook.title}
                    width={400}
                    height={256}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Access Type Badge */}
                <div className="absolute top-4 right-4">
                  <div className={`flex items-center px-3 py-2 rounded-full text-sm font-semibold ${getAccessTypeColor(ebook.accessType)}`}>
                    {getAccessTypeIcon(ebook.accessType)}
                    <span className="ml-2">{ebook.accessType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Price */}
                  {ebook.price && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">${ebook.price}</div>
                      <div className="text-sm text-gray-500">One-time purchase</div>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{ebook.description}</p>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900">{ebook.category}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Published</h4>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900">{formatDate(ebook.publishedAt || ebook.createdAt)}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Pages</h4>
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-gray-900">{ebook.totalPages || 'Unknown'}</span>
                      </div>
                    </div>

                    {ebook.accessType !== 'PUBLIC' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Trial Pages</h4>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-900">{ebook.trialPages} pages free</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {ebook.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {ebook.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex flex-col space-y-3">
                {ebook.accessType === 'PUBLIC' ? (
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Free Ebook
                  </button>
                ) : ebook.accessType === 'PAID' ? (
                  <div className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">${ebook.price}</div>
                      <div className="text-sm text-gray-500">One-time purchase</div>
                    </div>
                    <button className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <DollarSign className="h-5 w-5 mr-2" />
                      Purchase Ebook
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Login Required</h3>
                    <p className="text-gray-600 mb-4">Please log in to access this ebook.</p>
                    <button
                      onClick={() => router.push('/auth/login')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Share2 className="h-5 w-5 mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Table of Contents */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
              <div className="space-y-2">
                {Array.from({ length: ebook.totalPages || 10 }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handleViewPage(pageNum)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      viewingPages.includes(pageNum)
                        ? 'bg-blue-100 text-blue-800'
                        : pageNum <= ebook.trialPages
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Chapter {pageNum}</span>
                      {pageNum <= ebook.trialPages && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">FREE</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">File Format</h4>
                  <p className="text-gray-900">PDF</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Language</h4>
                  <p className="text-gray-900">English</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Last Updated</h4>
                  <p className="text-gray-900">{formatDate(ebook.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Page Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <span className="h-6 w-6">×</span>
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-600">Preview of page {viewingPages[0] || 1}</p>
                  <p className="text-sm text-gray-500">Full content available after purchase or login</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

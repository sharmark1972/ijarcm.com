'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Calendar, 
  User, 
  Star, 
  FileText, 
  Share2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Copy,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import DynamicSEO, { generateSEOProps } from '@/components/DynamicSEO';
import { ScholarlyArticleSchema } from '@/components/SchemaMarkup';
import SEOMetaTags from '@/components/SEOMetaTags';
import dynamic from 'next/dynamic';

const PDFThumbnail = dynamic(() => import('@/components/PDFThumbnail'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg"></div>
});

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: Array<{
    name: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    institution?: string;
    isCorresponding?: boolean;
  }>;
  publishedAt: string;
  downloads: number;
  category: string;
  keywords: string[];
  status: 'published' | 'under_review' | 'rejected';
  fileUrl?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  doi?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  volumeNumber?: string;
  issueNumber?: string;
  publicationDate?: string;
  uniqueNumber?: string;
  citationCount?: number;
  issueId?: string;
  issueDetails?: {
    id: string;
    title: string;
    volume: string;
    issueNumber: string;
    year: number;
    publishDate: string;
  };
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
  isHelpful?: boolean;
}

export default function PaperDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [userReview, setUserReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  const paperId = params.id as string;

  const fetchPaper = useCallback(async () => {
    try {
      const response = await fetch(`/api/papers/${paperId}`);
      if (response.ok) {
        const data = await response.json();
        const paperData = data.paper;
        
        if (!paperData) {
          console.error('No paper data in response:', data);
          return;
        }
        
        interface PaperAuthor {
          user: {
            firstName: string;
            lastName: string;
            email?: string;
            institution?: string;
          };
        }

        const mappedPaper = {
          ...paperData,
          authors: (paperData.paperAuthors as PaperAuthor[])?.map((pa) => ({
            name: pa.user ? `${pa.user.firstName} ${pa.user.lastName}` : 'Unknown Author',
            firstName: pa.user?.firstName || '',
            lastName: pa.user?.lastName || '',
            email: pa.user?.email || '',
            institution: pa.user?.institution || ''
          })) || [],
          downloads: paperData._count?.downloads || 0,
          publishedAt: paperData.publishedAt || null,
          fileUrl: paperData.filePath || null,
          coverImage: paperData.coverImage || null,
          volumeNumber: paperData.volumeNumber || null,
          issueNumber: paperData.issueNumber || null,
          publicationDate: paperData.publicationDate || null,
          uniqueNumber: paperData.uniqueNumber || null,
          keywords: paperData.keywords ?
            (typeof paperData.keywords === 'string' ?
              paperData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k.length > 0) :
              Array.isArray(paperData.keywords) ? paperData.keywords : []
            ) : []
        };
        
        setPaper(mappedPaper);
      } else {
        console.error('Failed to fetch paper - Status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching paper:', error);
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  const fetchReviews = useCallback(async () => {
    try {
      const response = await fetch(`/api/papers/${paperId}/reviews`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [paperId]);

  const checkBookmarkStatus = useCallback(async () => {
    if (!session) return;
    try {
      const response = await fetch(`/api/papers/${paperId}/bookmark`);
      if (response.ok) {
        const data = await response.json();
        setBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  }, [session, paperId]);

  useEffect(() => {
    if (paperId) {
      fetchPaper();
      fetchReviews();
      checkBookmarkStatus();
    }
  }, [paperId, fetchPaper, fetchReviews, checkBookmarkStatus]);

  const handleDownload = async () => {
    if (!session) {
      alert('Please login to download papers');
      return;
    }

    setDownloading(true);
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

        if (paper) {
          setPaper({ ...paper, downloads: paper.downloads + 1 });
        }
      } else {
        alert('Download failed. Please try again.');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleBookmark = async () => {
    if (!session) {
      alert('Please login to bookmark papers');
      return;
    }

    try {
      const response = await fetch(`/api/papers/${paperId}/bookmark`, {
        method: bookmarked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user?.id}`
        }
      });

      if (response.ok) {
        setBookmarked(!bookmarked);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: paper?.title,
          text: paper?.abstract,
          url: window.location.href
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const submitReview = async () => {
    if (!session) {
      alert('Please login to submit a review');
      return;
    }

    if (userReview.rating === 0) {
      alert('Please provide a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      const response = await fetch(`/api/papers/${paperId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user?.id}`
        },
        body: JSON.stringify({
          rating: userReview.rating,
          comment: userReview.comment
        })
      });

      if (response.ok) {
        setUserReview({ rating: 0, comment: '' });
        fetchReviews();
        alert('Review submitted successfully!');
      } else {
        alert('Failed to submit review');
      }
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatCitation = (paper: Paper) => {
    const authors = paper.authors && paper.authors.length > 0 
      ? paper.authors.map(author => author.name).join(', ')
      : 'Unknown Authors';
    const year = new Date(paper.publishedAt).getFullYear();
    return `${authors} (${year}). ${paper.title}. International Journal of Academic Research in Commerce and Management.`;
  };

  const copyCitation = () => {
    if (paper) {
      navigator.clipboard.writeText(formatCitation(paper));
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading paper details...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paper Not Found</h2>
          <p className="text-gray-600 mb-8">The paper you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const displayDate = paper.issueDetails 
    ? new Date(paper.issueDetails.publishDate).toLocaleDateString()
    : new Date(paper.publishedAt).toLocaleDateString();

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  return (
    <>
      {paper && (
        <>
          <DynamicSEO {...generateSEOProps.paper({
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors || [],
            publishedAt: paper.publishedAt,
            keywords: paper.keywords,
            category: paper.category,
            id: paper.id
          })} />
          <SEOMetaTags
            title={paper.title}
            description={paper.abstract}
            keywords={paper.keywords?.join(', ')}
            author={paper.authors?.map(author => author.name).join(', ')}
            publishedTime={paper.publishedAt}
            type="article"
            canonicalUrl={`https://ijrcam.com/papers/${paper.id}`}
            pdfUrl={paper.fileUrl ? `https://ijrcam.com/api/papers/${paper.id}/pdf/public` : undefined}
            doi={paper.doi}
            volume={paper.volumeNumber || paper.volume}
            issue={paper.issueNumber || paper.issue}
            firstPage={paper.pages?.split('-')[0]}
            lastPage={paper.pages?.split('-')[1]}
          />
          <ScholarlyArticleSchema
            title={paper.title}
            abstract={paper.abstract}
            authors={paper.authors?.map(author => ({
              name: author.name,
              email: author.email
            })) || []}
            publishedAt={paper.publishedAt}
            doi={paper.doi}
            keywords={paper.keywords}
            category={paper.category}
            url={`https://ijrcam.com/papers/${paper.id}`}
            downloadUrl={paper.fileUrl ? `https://ijrcam.com/api/papers/${paper.id}/pdf/public` : undefined}
            citationCount={paper.citationCount}
            volume={paper.volumeNumber || paper.volume}
            issue={paper.issueNumber || paper.issue}
            pages={paper.pages}
            partOfPeriodical={{
              name: "International Journal of Academic Research in Commerce and Management",
              issn: "2455-0116",
              issnElectronic: "2395-6410",
              publisher: "IJARCM"
            }}
          />
        </>
      )}
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/library"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Library</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleBookmark}
                  className={`p-2.5 rounded-lg transition-colors ${
                    bookmarked
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                  title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading || !paper.fileUrl}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <Download className={`w-4 h-4 ${downloading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{downloading ? 'Downloading...' : 'Download'}</span>
                  <span className="sm:hidden">{downloading ? '...' : 'PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Library', href: '/library' },
              { label: paper.title, href: `/papers/${paperId}` }
            ]}
          />

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Sidebar - Cover & Stats */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-4 space-y-6">
                {/* Cover Image */}
                <div>
                  {paper.coverImage ? (
                    <div className="rounded-lg overflow-hidden shadow-md mb-4">
                      <Image
                        src={paper.coverImage}
                        alt={`${paper.title} - Cover`}
                        width={300}
                        height={400}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : paper.fileUrl ? (
                    <div className="rounded-lg overflow-hidden shadow-md mb-4">
                      <PDFThumbnail
                        fileUrl={paper.fileUrl}
                        width="100%"
                        height="auto"
                        aspectRatio={0.7}
                        alt={`${paper.title} - PDF Preview`}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-80 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mb-4">
                      <FileText className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 text-center">No preview available</span>
                    </div>
                  )}
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading || !paper.fileUrl}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  <Download className={`w-4 h-4 ${downloading ? 'animate-spin' : ''}`} />
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </button>

                {/* Stats */}
                <div className="border-t pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Downloads</span>
                    <span className="font-semibold text-gray-900">{paper.downloads}</span>
                  </div>
                  {paper.rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-semibold text-gray-900">{paper.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Views</span>
                    <span className="font-semibold text-gray-900">
                      <Eye className="w-4 h-4 inline mr-1" />
                      {paper.downloads}
                    </span>
                  </div>
                </div>

                {/* Category & Date */}
                <div className="border-t pt-6 space-y-3">
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {paper.category}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {displayDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Author Section */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {paper.title}
                </h1>

                {/* Authors */}
                {paper.authors && paper.authors.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Authors</p>
                    <div className="flex flex-wrap gap-2">
                      {paper.authors.map((author, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{author.name}</p>
                            {author.institution && (
                              <p className="text-xs text-gray-500">{author.institution}</p>
                            )}
                          </div>
                          {author.isCorresponding && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                              Corresponding
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publication Info */}
                {(paper.issueDetails || paper.volumeNumber || paper.issueNumber) && (
                  <div className="pt-6 border-t space-y-2 text-sm text-gray-600">
                    {paper.issueDetails && (
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-900 min-w-24">Published in:</span>
                        <Link
                          href={`/issues/${paper.issueDetails.id}`}
                          className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                        >
                          {paper.issueDetails.title} (Vol. {paper.issueDetails.volume}, Issue {paper.issueDetails.issueNumber})
                        </Link>
                      </div>
                    )}
                    {paper.doi && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 min-w-24">DOI:</span>
                        <a
                          href={`https://doi.org/${paper.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                        >
                          {paper.doi}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Abstract */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Abstract</h2>
                <p className="text-gray-700 leading-relaxed text-lg">
                  {paper.abstract}
                </p>
              </div>

              {/* Keywords */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {paper.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Citation */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Citation</h2>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed font-mono">
                    {formatCitation(paper)}
                  </p>
                </div>
                <button
                  onClick={copyCitation}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    copiedCitation
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  {copiedCitation ? 'Copied!' : 'Copy Citation'}
                </button>
              </div>

              {/* Reviews Section */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h2>
                  {paper.rating && (
                    <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <span className="font-bold text-gray-900">{paper.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600">({paper.reviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Add Review Form */}
                {session ? (
                  <div className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Write a Review</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Your Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(rating => (
                          <button
                            key={rating}
                            onClick={() => setUserReview(prev => ({ ...prev, rating }))}
                            className={`p-1 transition-colors ${
                              userReview.rating >= rating
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-300'
                            }`}
                          >
                            <Star className="w-6 h-6 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                      <textarea
                        value={userReview.comment}
                        onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Share your thoughts about this paper..."
                      />
                    </div>
                    <button
                      onClick={submitReview}
                      disabled={submittingReview || userReview.rating === 0}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                ) : (
                  <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <Link href="/auth/signin" className="font-semibold hover:underline">
                        Sign in
                      </Link>
                      {' '}to write a review
                    </p>
                  </div>
                )}

                {/* Reviews List */}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {displayedReviews.map(review => (
                      <div key={review.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm mb-2">{review.reviewerName}</p>
                        <p className="text-gray-700 text-sm mb-3">{review.comment}</p>
                        <div className="flex gap-4 text-xs">
                          <button className="flex items-center gap-1 text-gray-600 hover:text-green-600 transition-colors">
                            <ThumbsUp className="w-3 h-3" />
                            Helpful
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors">
                            <ThumbsDown className="w-3 h-3" />
                            Not helpful
                          </button>
                          <button className="flex items-center gap-1 text-gray-600 hover:text-orange-600 transition-colors">
                            <Flag className="w-3 h-3" />
                            Report
                          </button>
                        </div>
                      </div>
                    ))}
                    {reviews.length > 3 && !showAllReviews && (
                      <button
                        onClick={() => setShowAllReviews(true)}
                        className="w-full py-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View All {reviews.length} Reviews
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No reviews yet. Be the first to review this paper!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

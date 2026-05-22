'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Download,
  Calendar,
  User,
  Star,
  FileText,
  Share2,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Eye
} from 'lucide-react';
import Breadcrumbs from '@/components/Breadcrumbs';
import DynamicSEO, { generateSEOProps } from '@/components/DynamicSEO';
import { ScholarlyArticleSchema } from '@/components/SchemaMarkup';
import SEOMetaTags from '@/components/SEOMetaTags';
import ArticleReview from '@/components/ArticleReview';
import ReviewList from '@/components/ReviewList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: Array<{
    name: string;
    email?: string;
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
  const [userReview, setUserReview] = useState<{ id: string; rating: number; comment: string; createdAt: string } | null>(null);

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
        
        if (session?.user?.id) {
          const existingUserReview = reviewsData.find((r: Review) => 
            r.reviewerName === `${session.user.name}` || 
            (session.user.firstName && session.user.lastName && 
             r.reviewerName === `${session.user.firstName} ${session.user.lastName}`)
          );
          if (existingUserReview) {
            setUserReview({
              id: existingUserReview.id,
              rating: existingUserReview.rating,
              comment: existingUserReview.comment,
              createdAt: existingUserReview.createdAt
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  }, [paperId, session]);

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
  }, [paperId, fetchPaper, fetchReviews, checkBookmarkStatus, session]);

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

  const handleReviewSubmitted = () => {
    fetchReviews();
  };

  const formatCitation = (paper: Paper) => {
    const authors = paper.authors && paper.authors.length > 0 
      ? paper.authors.map(author => author.name).join(', ')
      : 'Unknown Authors';
    const year = new Date(paper.publishedAt).getFullYear();
    return `${authors} (${year}). ${paper.title}. International Journal of Academic Research in Commerce and Management.`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Paper Not Found</h2>
          <p className="text-slate-600 mb-6">The paper you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/library">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Library
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Components */}
      {paper && (
        <>
          <DynamicSEO {...generateSEOProps.paper({
            title: paper.title,
            abstract: paper.abstract,
            authors: paper.authors || [],
            publishedAt: paper.issueDetails?.publishDate || paper.publishedAt,
            keywords: paper.keywords,
            category: paper.category,
            id: paper.id
          })} />
          <SEOMetaTags
            title={paper.title}
            description={paper.abstract}
            keywords={paper.keywords?.join(', ')}
            author={paper.authors?.map(author => author.name).join(', ')}
            publishedTime={paper.issueDetails?.publishDate || paper.publishedAt}
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
            issuePublishDate={paper.issueDetails?.publishDate}
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
      
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <Link
                href="/library"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Library
              </Link>
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="text-slate-600 hover:text-slate-900"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBookmark}
                  className={bookmarked ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'}
                  title={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  {bookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </Button>
                <Link href={`/papers/${paperId}/view`}>
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View PDF
                  </Button>
                </Link>
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Download className={`w-4 h-4 mr-2 ${downloading ? 'animate-spin' : ''}`} />
                  {downloading ? 'Downloading...' : 'Download PDF'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Research Papers', href: '/papers' },
              { label: paper?.title || 'Paper Details', href: `/papers/${paperId}` }
            ]}
          />
          
          <Card className="mt-8 border-slate-200">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                  {paper.category}
                </Badge>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {paper.issueDetails ? new Date(paper.issueDetails.publishDate).toLocaleDateString() : new Date(paper.publishedAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Download className="w-4 h-4 mr-1" />
                    {paper.downloads} downloads
                  </div>
                  {paper.rating && (
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-400 fill-current" />
                      {paper.rating.toFixed(1)} ({paper.reviewCount} reviews)
                    </div>
                  )}
                </div>
              </div>

              {(paper.issueDetails || paper.volumeNumber || paper.issueNumber || paper.publicationDate || paper.uniqueNumber) && (
                <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wide">Publication Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {paper.issueDetails && (
                      <div className="col-span-full mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-slate-700 mr-2">Published in Issue:</span>
                            <Link 
                              href={`/issues/${paper.issueDetails.id}`}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                            >
                              {paper.issueDetails.title}
                            </Link>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-slate-600">
                          <span>Volume {paper.issueDetails.volume}, Issue {paper.issueDetails.issueNumber}</span>
                          <span>•</span>
                          <span>{paper.issueDetails.year}</span>
                          <span>•</span>
                          <span>{new Date(paper.issueDetails.publishDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                    {paper.volumeNumber && !paper.issueDetails && (
                      <div className="flex items-center">
                        <span className="font-medium text-slate-700 mr-2">Volume:</span>
                        <span className="text-slate-900">{paper.volumeNumber}</span>
                      </div>
                    )}
                    {paper.issueNumber && !paper.issueDetails && (
                      <div className="flex items-center">
                        <span className="font-medium text-slate-700 mr-2">Issue:</span>
                        <span className="text-slate-900">{paper.issueNumber}</span>
                      </div>
                    )}
                    {paper.publicationDate && (
                      <div className="flex items-center">
                        <span className="font-medium text-slate-700 mr-2">Publication Date:</span>
                        <span className="text-slate-900">{new Date(paper.publicationDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {paper.uniqueNumber && (
                      <div className="flex items-center">
                        <span className="font-medium text-slate-700 mr-2">Unique Number:</span>
                        <span className="text-slate-900">{paper.uniqueNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-8 leading-tight">
                {paper.title}
              </h1>

              <div className="flex flex-col lg:flex-row gap-8 mb-8">
                <div className="w-full lg:w-1/3 lg:max-w-xs lg:flex-shrink-0">
                  <div className="relative sticky top-8">
                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-3">Paper Cover</h3>
                    <div className="flex flex-col space-y-4">
                      {paper.coverImage ? (
                        <div className="overflow-hidden rounded-lg shadow-md border border-slate-200">
                          <Image
                            src={paper.coverImage}
                            alt={`${paper.title} - Cover Image`}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={handleDownload}
                          />
                        </div>
                      ) : paper.fileUrl ? (
                        <div className="overflow-hidden rounded-lg shadow-md border border-slate-200">
                          <div className="relative w-full h-80 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4">
                              <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <h4 className="font-serif font-bold text-slate-900 text-sm mb-2 line-clamp-3">
                              {paper.title}
                            </h4>
                            <div className="text-xs text-slate-500 mb-4">
                              International Journal of Academic Research
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
                              <Download className="w-3 h-3 text-blue-600" />
                              <span className="text-[10px] font-medium text-slate-700">Preview Available</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-80 bg-slate-50 rounded-lg border border-slate-200 flex flex-col items-center justify-center p-6">
                          <FileText className="w-12 h-12 text-slate-300 mb-3" />
                          <p className="text-sm text-slate-500">Cover Unavailable</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-2">
                        {paper.fileUrl && (
                          <Link href={`/papers/${paperId}/view`} className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                              <Eye className="w-4 h-4 mr-2" />
                              View PDF Online
                            </Button>
                          </Link>
                        )}
                        <Button
                          onClick={handleDownload}
                          disabled={downloading || !paper.fileUrl}
                          variant="outline"
                          className="w-full"
                        >
                          <Download className={`w-4 h-4 mr-2 ${downloading ? 'animate-spin' : ''}`} />
                          {downloading ? 'Downloading...' : 'Download Full PDF'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-2/3 lg:flex-grow lg:min-w-0">
                  <div className="mb-8">
                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Authors</h3>
                    <div className="flex flex-wrap gap-3">
                      {paper.authors && paper.authors.length > 0 ? (
                        paper.authors.map((author, index) => (
                          <div key={index} className="flex items-center bg-slate-50 border border-slate-100 rounded-full px-4 py-2 transition-colors hover:bg-slate-100">
                            <User className="w-4 h-4 mr-2 text-slate-400" />
                            <span className="text-slate-900 font-medium text-sm">{author.name}</span>
                            {author.isCorresponding && (
                              <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                                Corresponding
                              </Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-500 italic">No authors information available</div>
                      )}
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Abstract</h3>
                    <p className="text-slate-700 leading-relaxed text-lg">{paper.abstract}</p>
                  </div>

                  {paper.keywords && Array.isArray(paper.keywords) && paper.keywords.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-serif font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {paper.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100 cursor-default transition-colors"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-serif font-bold text-slate-900 mb-3">Citation</h3>
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 relative group">
                      <p className="text-sm text-slate-700 font-mono leading-relaxed pr-20">
                        {formatCitation(paper)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(formatCitation(paper))}
                        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-12">
            <ArticleReview
              paperId={paperId}
              existingReview={userReview ? {
                id: userReview.id,
                rating: userReview.rating,
                comment: userReview.comment,
                createdAt: userReview.createdAt
              } : undefined}
              onReviewSubmitted={handleReviewSubmitted}
            />
            <div className="mt-8">
              <ReviewList reviews={reviews} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

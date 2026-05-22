'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Calendar,
  FileText,
  Download,
  ArrowLeft,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  List
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema } from '@/components/SchemaMarkup';
import Breadcrumbs, { BreadcrumbsStructuredData } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Issue {
  id: string;
  title: string;
  description?: string;
  volume: string;
  issueNumber: string;
  year: number;
  publishDate: string;
  coverImage?: string;
  doi?: string;
  issn?: string;
  papers: Array<{
    id: string;
    title: string;
    abstract: string;
    keywords?: string;
    category: string;
    publishedAt: string;
    doi?: string;
    pageRange?: string;
    paperAuthors: Array<{
      user: {
        firstName: string;
        lastName: string;
        email: string;
        institution?: string;
      };
    }>;
    _count: {
      downloads: number;
    };
  }>;
  _count: {
    papers: number;
  };
}

export default function IssueDetailPage() {
  const params = useParams();
  const issueId = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current issue
        const issueResponse = await fetch(`/api/issues/${issueId}`);
        const issueData = await issueResponse.json();

        if (issueResponse.ok) {
          setIssue(issueData);
        } else {
          setError(issueData.error || 'Failed to load issue');
        }

        // Fetch all issues for navigation
        const allIssuesResponse = await fetch('/api/issues?limit=100');
        const allIssuesData = await allIssuesResponse.json();
        
        if (allIssuesResponse.ok) {
          setAllIssues(allIssuesData.issues || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load issue');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [issueId]);

  // Get previous and next issues
  const getCurrentIssueIndex = () => {
    return allIssues.findIndex(i => i.id === issueId);
  };

  const getPreviousIssue = () => {
    const currentIndex = getCurrentIssueIndex();
    if (currentIndex === -1 || currentIndex === allIssues.length - 1) return null;
    return allIssues[currentIndex + 1];
  };

  const getNextIssue = () => {
    const currentIndex = getCurrentIssueIndex();
    if (currentIndex <= 0) return null;
    return allIssues[currentIndex - 1];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-slate-900 mb-4"></div>
          <p className="text-slate-600">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Issue Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The requested issue could not be found.'}</p>
          <Link href="/issues">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Issues
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO Metadata */}
      <DynamicSEO
        title={`${issue.title} - IJARCM | Journal Issue`}
        description={`View ${issue.title} - Volume ${issue.volume}, Issue ${issue.issueNumber}. Published on ${new Date(issue.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}. Contains ${issue._count.papers} peer-reviewed research papers.`}
        keywords={[
          'journal issue',
          'research papers',
          'academic publication',
          'peer reviewed',
          issue.title,
          `Volume ${issue.volume}`,
          `Issue ${issue.issueNumber}`,
          issue.year?.toString() || '',
          'IJARCM',
          'computer science',
          'management research'
        ].filter(Boolean)}
        canonicalUrl={`https://ijarcm.com/issues/${issueId}`}
        ogType="article"
      />
      <WebsiteSchema
        name={`${issue.title} - IJARCM`}
        description={`${issue.description || `Volume ${issue.volume}, Issue ${issue.issueNumber} of IJARCM journal`}`}
        url={`https://ijarcm.com/issues/${issueId}`}
        publisher="IJARCM"
      />
      <BreadcrumbsStructuredData
        items={[
          { label: 'Home', href: '/' },
          { label: 'Issues', href: '/issues' },
          { label: issue.title, href: `/issues/${issueId}`, current: true }
        ]}
      />

      <div className="min-h-screen bg-slate-50 pb-12">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Issues', href: '/issues' },
                { label: issue.title, href: `/issues/${issueId}`, current: true }
              ]}
              className="mb-6"
            />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
               {/* Cover Image */}
               <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:block">
                 {issue.coverImage ? (
                   <div className="relative w-48 h-64 shadow-lg rounded-lg overflow-hidden">
                     <Image
                       src={issue.coverImage}
                       alt={`Cover of ${issue.title}`}
                       fill
                       className="object-cover"
                     />
                   </div>
                 ) : (
                   <div className="w-48 h-64 bg-slate-100 rounded-lg shadow-inner flex items-center justify-center flex-col p-4 text-center border border-slate-200">
                      <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                      <span className="text-sm font-medium text-slate-500">No Cover Image</span>
                   </div>
                 )}
               </div>

               {/* Issue Details */}
               <div className="flex-1">
                 <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                    <span className="font-semibold text-blue-700">Volume {issue.volume}</span>
                    <span>•</span>
                    <span className="font-semibold text-blue-700">Issue {issue.issueNumber}</span>
                    <span>•</span>
                    <span>{issue.year}</span>
                 </div>
                 
                 <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">
                   {issue.title}
                 </h1>
                 
                 {issue.description && (
                   <p className="text-lg text-slate-600 mb-6 leading-relaxed max-w-3xl">
                     {issue.description}
                   </p>
                 )}

                 <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Published: {new Date(issue.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{issue._count.papers} Papers</span>
                    </div>
                 </div>

                 <div className="flex gap-3">
                   <Link href="/issues">
                     <Button variant="outline" size="sm">
                       <ArrowLeft className="w-4 h-4 mr-2" />
                       Back to All Issues
                     </Button>
                   </Link>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {getPreviousIssue() ? (
                  <Link href={`/issues/${getPreviousIssue()!.id}`}>
                     <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                       <ChevronLeft className="w-4 h-4 mr-1" />
                       <span className="hidden sm:inline">Vol {getPreviousIssue()!.volume}, Issue {getPreviousIssue()!.issueNumber}</span>
                       <span className="sm:hidden">Prev</span>
                     </Button>
                  </Link>
                ) : (
                  <Button variant="ghost" size="sm" disabled className="invisible">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                )}
              </div>
              
              <span className="text-sm font-medium text-slate-500">
                {getCurrentIssueIndex() >= 0 ? `${getCurrentIssueIndex() + 1} of ${allIssues.length}` : ''}
              </span>

              <div className="flex items-center gap-4">
                {getNextIssue() ? (
                  <Link href={`/issues/${getNextIssue()!.id}`}>
                     <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                       <span className="hidden sm:inline">Vol {getNextIssue()!.volume}, Issue {getNextIssue()!.issueNumber}</span>
                       <span className="sm:hidden">Next</span>
                       <ChevronRight className="w-4 h-4 ml-1" />
                     </Button>
                  </Link>
                ) : (
                   <Button variant="ghost" size="sm" disabled className="invisible">
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Papers List */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Published Papers</h2>

            {issue.papers.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-lg text-slate-600 font-medium">No papers published in this issue yet.</p>
                <p className="text-slate-500">Check back later for updates.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {issue.papers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-md transition-shadow border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4 mb-2">
                             <Link href={`/papers/${paper.id}`} className="group">
                               <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors mb-2">
                                 {paper.title}
                               </h3>
                             </Link>
                             <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 whitespace-nowrap">
                               {paper.category}
                             </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 mb-4">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1.5 text-slate-400" />
                              <span className="font-medium">
                                {paper.paperAuthors.map(a => `${a.user.firstName} ${a.user.lastName}`).join(', ')}
                              </span>
                            </div>
                            {paper.pageRange && (
                               <div className="flex items-center">
                                 <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                                 <span>Pages {paper.pageRange}</span>
                               </div>
                            )}
                          </div>

                          <p className="text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                            {paper.abstract}
                          </p>

                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                             <div className="flex gap-2">
                               {paper.keywords && paper.keywords.split(',').slice(0, 3).map((keyword, idx) => (
                                 <span
                                   key={idx}
                                   className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100"
                                 >
                                   {keyword.trim()}
                                 </span>
                               ))}
                             </div>
                             
                             <div className="flex items-center gap-3">
                               <span className="text-xs text-slate-500 flex items-center">
                                 <Download className="w-3 h-3 mr-1" />
                                 {paper._count.downloads}
                               </span>
                               <Link href={`/papers/${paper.id}`}>
                                 <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                   View Paper
                                   <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                                 </Button>
                               </Link>
                             </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

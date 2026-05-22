'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BookOpen, ChevronLeft, ChevronRight, FileText, Search, Filter } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema } from '@/components/SchemaMarkup';
import Breadcrumbs from '@/components/Breadcrumbs';
import IssueCard, { IssueCardProps } from '@/components/IssueCard';
import { Skeleton } from '@/components/ui/skeleton';

interface IssueResponse {
  id: string;
  title: string;
  description?: string;
  volume?: string;
  issue?: string;
  year?: number;
  publicationDate: string;
  coverImage?: string;
  paperCount: number;
  createdAt: string;
  updatedAt: string;
}

interface IssuesData {
  issues: IssueResponse[];
  pagination: {
    totalIssues: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function IssueSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
      <div className="w-full h-48 bg-slate-100 rounded-lg mb-4" />
      <div className="h-6 bg-slate-100 rounded w-3/4 mb-3" />
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-slate-100 rounded w-16" />
        <div className="h-6 bg-slate-100 rounded w-16" />
      </div>
      <div className="h-4 bg-slate-100 rounded w-full mb-2" />
      <div className="h-4 bg-slate-100 rounded w-2/3" />
    </div>
  );
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [volumeFilter, setVolumeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalIssues, setTotalIssues] = useState(0);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [availableVolumes, setAvailableVolumes] = useState<string[]>([]);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const issuesPerPage = 12;

  const fetchIssues = useCallback(async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', issuesPerPage.toString());

      if (yearFilter && yearFilter !== 'all') {
        params.append('year', yearFilter);
      }

      if (volumeFilter && volumeFilter !== 'all') {
        params.append('volume', volumeFilter);
      }

      const response = await fetch(`/api/issues?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch issues');
      }

      const data: IssuesData = await response.json();

      const transformedIssues: IssueCardProps[] = data.issues.map((issue) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        volume: issue.volume,
        issue: issue.issue,
        year: issue.year,
        publicationDate: issue.publicationDate,
        coverImage: issue.coverImage,
        paperCount: issue.paperCount,
      }));

      setIssues(transformedIssues);
      setTotalPages(data.pagination.totalPages);
      setTotalIssues(data.pagination.totalIssues);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
      setIsPageTransitioning(false);
    }
  }, [yearFilter, volumeFilter, currentPage, issuesPerPage]);

  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch('/api/issues?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch filters');
      }

      const data: IssuesData = await response.json();

      const years = Array.from(
        new Set(data.issues.map((issue) => issue.year).filter(Boolean))
      ).sort((a, b) => (b || 0) - (a || 0)) as number[];

      const volumes = Array.from(
        new Set(data.issues.map((issue) => issue.volume).filter((v): v is string => Boolean(v)))
      ).sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numB - numA;
      });

      setAvailableYears(years);
      setAvailableVolumes(volumes);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleYearChange = (value: string) => {
    setYearFilter(value);
    setCurrentPage(1);
  };

  const handleVolumeChange = (value: string) => {
    setVolumeFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setIsPageTransitioning(true);
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-slate-900 mb-8">Issues</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
              <FileText className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Issues</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={() => fetchIssues()} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Journal Issues - IJARCM | Published Research Issues"
        description="Browse all published journal issues of the International Journal of Research in Computer Applications and Management (IJARCM). Access research papers, articles, and scholarly publications."
        keywords={[
          'journal issues',
          'published issues',
          'research papers',
          'academic publications',
          'scholarly articles',
          'computer science research',
          'management research',
          'peer reviewed papers',
          'IJARCM issues',
          'research collection',
          'volume',
          'issue number'
        ]}
        canonicalUrl="https://ijarcm.com/issues"
        ogType="website"
      />
      <WebsiteSchema
        name="IJARCM Issues"
        description="Complete collection of published journal issues and research papers"
        url="https://ijarcm.com/issues"
        publisher="IJARCM"
      />

      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">
                Journal Issues
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Browse our complete collection of published journal issues. Each volume represents our commitment to advancing knowledge in computer applications and management through rigorous peer review.
              </p>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Issues', href: '/issues' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters & Statistics Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
                <div className="flex items-center gap-2 mb-6">
                  <Filter className="w-5 h-5 text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Publication Year
                    </label>
                    <Select value={yearFilter} onValueChange={handleYearChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume Filter */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Volume
                    </label>
                    <Select value={volumeFilter} onValueChange={handleVolumeChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All volumes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Volumes</SelectItem>
                        {availableVolumes.map((volume) => (
                          <SelectItem key={volume} value={volume}>
                            Volume {volume}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {(yearFilter !== 'all' || volumeFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setYearFilter('all');
                        setVolumeFilter('all');
                        setCurrentPage(1);
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Stats Mini-Widget */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Total Issues</span>
                    <span className="font-semibold text-slate-900">{totalIssues}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Total Papers</span>
                    <span className="font-semibold text-slate-900">
                      {issues.reduce((sum, issue) => sum + issue.paperCount, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <IssueSkeleton key={i} />
                  ))}
                </div>
              ) : issues.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Issues Found</h3>
                  <p className="text-slate-600 max-w-md mx-auto mb-6">
                    {yearFilter !== 'all' || volumeFilter !== 'all'
                      ? 'No issues match your current filters. Try adjusting your criteria.'
                      : 'No published issues are available at this time.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${isPageTransitioning ? 'opacity-50' : 'opacity-100'}`}>
                    {issues.map((issue) => (
                      <IssueCard key={issue.id} {...issue} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </Button>

                        <div className="flex items-center px-4 text-sm font-medium text-slate-600">
                          Page {currentPage} of {totalPages}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Search, Archive, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema } from '@/components/SchemaMarkup';
import Breadcrumbs from '@/components/Breadcrumbs';
import PDFThumbnail from '@/components/PDFThumbnail';
import { PaperGrid } from '@/components/PaperListing';

interface Archive {
  id: string;
  title: string;
  description?: string;
  volume?: string;
  issue?: string;
  year?: number;
  publishedAt?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    archivePapers: number;
  };
}

interface ArchivePaper {
  id: string;
  title: string;
  authors: string;
  authorDetails?: Array<{
    firstName: string;
    lastName: string;
    institution?: string;
    email?: string;
  }>;
  abstract?: string;
  keywords?: string;
  pageRange?: string;
  doi?: string;
  pdfUrl?: string;
  createdAt: string;
  downloads?: number;
  paperId?: string;
  paper: {
    id: string;
    title: string;
    authors: string;
    abstract?: string;
    keywords?: string;
    publishedAt?: string;
    filePath?: string;
  };
}

function ArchiveCard({ archive }: { archive: Archive }) {
  const [papers, setPapers] = useState<ArchivePaper[]>([]);
  const [showPapers, setShowPapers] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);

  const fetchPapers = async () => {
    if (papers.length > 0) {
      setShowPapers(!showPapers);
      return;
    }

    try {
      setLoadingPapers(true);
      const response = await fetch(`/api/archives/papers?archiveId=${archive.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }
      const data = await response.json();
      setPapers(data);
      setShowPapers(true);
    } catch (err) {
      console.error('Error fetching papers:', err);
    } finally {
      setLoadingPapers(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
              {archive.title}
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {archive.volume && (
                <Badge variant="outline">
                  Vol. {archive.volume}
                </Badge>
              )}
              {archive.issue && (
                <Badge variant="outline">
                  Issue {archive.issue}
                </Badge>
              )}
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(archive.publishedAt || archive.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {archive._count.archivePapers} papers
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {archive.description && (
          <p className="text-gray-700 mb-4 leading-relaxed">
            {archive.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={fetchPapers}
            disabled={loadingPapers}
            className="flex items-center space-x-2"
          >
            <BookOpen className="w-4 h-4" />
            <span>
              {loadingPapers ? 'Loading...' : showPapers ? 'Hide Papers' : 'View Papers'}
            </span>
          </Button>
        </div>

        {/* Papers List */}
        {showPapers && (
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold text-gray-900 border-b pb-2">
              Papers in this Issue
            </h4>
            {papers.length === 0 ? (
              <p className="text-gray-600 text-sm italic">
                No papers available in this archive.
              </p>
            ) : (
              <div className="space-y-3">
                {papers.map((archivePaper) => (
                  <div key={archivePaper.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    {/* PDF Thumbnail */}
                    {archivePaper.pdfUrl && archivePaper.pdfUrl.trim() !== '' && (
                      <div className="mb-3">
                        <PDFThumbnail
                          fileUrl={archivePaper.pdfUrl}
                          className="w-32 h-40 object-cover rounded border shadow-sm float-left mr-4"
                        />
                      </div>
                    )}
                    
                    <h5 className="font-medium text-gray-900 mb-1">
                      {archivePaper.paper.title}
                    </h5>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Authors:</strong> {archivePaper.paper.authors}
                    </p>
                    {archivePaper.pageRange && (
                      <p className="text-xs text-gray-500 mb-2">
                        <strong>Pages:</strong> {archivePaper.pageRange}
                      </p>
                    )}
                    {archivePaper.paper.abstract && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {archivePaper.paper.abstract}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 clear-both">
                      {archivePaper.doi && (
                        <Badge variant="outline" className="text-xs">
                          DOI: {archivePaper.doi}
                        </Badge>
                      )}
                      {archivePaper.pdfUrl && (
                        <Button size="sm" variant="ghost" asChild>
                          <a href={archivePaper.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="w-3 h-3 mr-1" />
                            PDF
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function ArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [allPapers, setAllPapers] = useState<ArchivePaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [volumeFilter, setVolumeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const papersPerPage = 12;

  const fetchArchives = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('isPublished', 'true');
      if (searchTerm) params.append('search', searchTerm);
      if (yearFilter && yearFilter !== 'all') params.append('year', yearFilter);
      if (volumeFilter && volumeFilter !== 'all') params.append('volume', volumeFilter);

      const response = await fetch(`/api/archives?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch archives');
      }
      const data = await response.json();
      // Filter for published archives on client side
      const filteredData = data.filter((archive: Archive) => archive.isPublished);
      setArchives(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, yearFilter, volumeFilter]);

  // Fetch all published papers to display alongside archives
  const fetchAllPapers = useCallback(async (page = 1, sort = sortBy) => {
    try {
      const params = new URLSearchParams();
      params.append('includeAllPapers', 'true');
      params.append('page', page.toString());
      params.append('limit', papersPerPage.toString());
      params.append('sort', sort);
      
      const response = await fetch(`/api/archives/papers?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch all papers');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching all papers:', err);
      return { papers: [], totalPages: 1 };
    }
  }, [papersPerPage, sortBy]);

  useEffect(() => {
    fetchArchives();
    fetchAllPapers(currentPage).then(data => {
      // Handle both array and object responses
      if (data && data.papers) {
        setAllPapers(data.papers);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        setAllPapers(data || []);
        setTotalPages(1);
      }
    });
  }, [fetchArchives, fetchAllPapers, currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchArchives();
      fetchAllPapers(currentPage).then(data => {
        // Handle both array and object responses
        if (data && data.papers) {
          setAllPapers(data.papers);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setAllPapers(data || []);
          setTotalPages(1);
        }
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchArchives, fetchAllPapers, currentPage]);

  const availableYears = Array.from(
    new Set(
      archives.map(archive => new Date(archive.publishedAt || archive.createdAt).getFullYear())
    )
  ).sort((a, b) => b - a);

  const availableVolumes = Array.from(
    new Set(
      archives.map(archive => archive.volume).filter(Boolean)
    )
  ).sort((a, b) => {
    const numA = a ? parseInt(a) : 0;
    const numB = b ? parseInt(b) : 0;
    return numB - numA;
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Archives</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">Error loading archives: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Journal Archives - IJARCM | Complete Collection of Published Issues"
        description="Browse our comprehensive archive of published journal issues. Access decades of research papers, scholarly articles, and academic contributions in computer science and management."
        keywords={[
          'journal archives',
          'published issues',
          'research papers archive',
          'academic publications',
          'scholarly articles',
          'computer science research',
          'management research',
          'peer reviewed papers',
          'IJARCM archives',
          'research collection'
        ]}
        canonicalUrl="https://ijarcm.com/archives"
        ogType="website"
      />
      <WebsiteSchema
        name="IJARCM Archives"
        description="Complete collection of published journal issues and research papers"
        url="https://ijarcm.com/archives"
        publisher="IJARCM"
      />
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <Breadcrumbs 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Archives', href: '/archives' }
            ]}
          />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Journal Archives</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Browse our complete collection of published issues and access all archived papers. 
            Explore decades of research and scholarly contributions.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search archives by title or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={volumeFilter} onValueChange={setVolumeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by volume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All volumes</SelectItem>
                  {availableVolumes.map((volume) => (
                    <SelectItem key={volume} value={volume?.toString() || 'unknown'}>
                      Volume {volume}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={sortBy} onValueChange={(value) => {
                setSortBy(value);
                setCurrentPage(1); // Reset to first page when sorting changes
                fetchAllPapers(1, value).then(data => {
                  if (data && data.papers) {
                    setAllPapers(data.papers);
                    setTotalPages(data.pagination?.totalPages || 1);
                  }
                });
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* All Published Papers Section */}
        <div className="mb-12">
          <PaperGrid
            papers={allPapers.filter(paper => paper && paper.paper).map(paper => ({
              id: paper.id,
              title: paper.paper.title,
              authors: paper.authors,
              authorDetails: paper.authorDetails,
              abstract: paper.paper.abstract,
              keywords: paper.paper.keywords,
              doi: paper.doi,
              pdfUrl: paper.paper.filePath,
              publishedAt: paper.paper.publishedAt || paper.createdAt,
              downloads: paper.downloads,
              journal: 'International Journal of Research in Computer Applications and Management (IJARCM)'
            }))}
            loading={loading}
            title="All Published Papers"
          />
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * papersPerPage) + 1} to {Math.min(currentPage * papersPerPage, allPapers.length)} of {allPapers.length} papers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, currentPage - 1);
                    setCurrentPage(newPage);
                    fetchAllPapers(newPage).then(data => {
                      if (data && data.papers) {
                        setAllPapers(data.papers);
                        setTotalPages(data.pagination?.totalPages || 1);
                      }
                    });
                  }}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setCurrentPage(pageNum);
                          fetchAllPapers(pageNum).then(data => {
                            if (data && data.papers) {
                              setAllPapers(data.papers);
                              setTotalPages(data.pagination?.totalPages || 1);
                            }
                          });
                        }}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(totalPages, currentPage + 1);
                    setCurrentPage(newPage);
                    fetchAllPapers(newPage).then(data => {
                      if (data && data.papers) {
                        setAllPapers(data.papers);
                        setTotalPages(data.pagination?.totalPages || 1);
                      }
                    });
                  }}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Archives Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-48 mb-2 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {archives.length === 0 ? (
              <div className="text-center py-12">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Archives Found
                </h3>
                <p className="text-gray-600">
                  {searchTerm || (yearFilter && yearFilter !== 'all') || (volumeFilter && volumeFilter !== 'all')
                    ? 'No archives match your current filters. Try adjusting your search criteria.'
                    : 'Archives will be displayed here once they are added by the administrators.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {archives.map((archive) => (
                  <ArchiveCard key={archive.id} archive={archive} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        {!loading && (archives.length > 0 || allPapers.length > 0) && (
          <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Archive Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {archives.length}
                </div>
                <div className="text-sm text-gray-600">Total Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {archives.reduce((sum, archive) => sum + archive._count.archivePapers, 0) + allPapers.length}
                </div>
                <div className="text-sm text-gray-600">Total Papers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {availableYears.length > 0 ? `${Math.min(...availableYears)}-${Math.max(...availableYears)}` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Publication Span</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
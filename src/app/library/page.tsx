'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Search,
  Filter,
  Download,
  Eye,
  BookOpen,
  ChevronDown,
  Star,
  SortAsc,
  SortDesc,
  Grid,
  List,
  AlertCircle,
  X,
  Calendar
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema } from '@/components/SchemaMarkup';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  downloads: number;
  category: string;
  keywords: string[];
  status: 'published' | 'under_review' | 'rejected';
  fileUrl?: string;
  rating?: number;
  reviewCount?: number;
}

interface SearchFilters {
  query: string;
  category: string;
  author: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'downloads' | 'title' | 'rating' | 'issue';
  sortOrder: 'asc' | 'desc';
}

const categories = [
  'All Categories',
  'Computer Science',
  'Management',
  'Technology',
  'Environmental Science',
  'Business Administration',
  'Information Systems',
  'Data Science',
  'Artificial Intelligence',
  'Software Engineering'
];

export default function LibraryPage() {
  const { data: session } = useSession();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 12;

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'All Categories',
    author: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [debouncedFilters, setDebouncedFilters] = useState<SearchFilters>(filters);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [filters]);

  useEffect(() => {
    const fetchPapers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        params.append('page', currentPage.toString());
        params.append('limit', itemsPerPage.toString());
        
        if (debouncedFilters.query) params.append('query', debouncedFilters.query);
        if (debouncedFilters.category && debouncedFilters.category !== 'All Categories') {
          params.append('category', debouncedFilters.category);
        }
        if (debouncedFilters.author) params.append('author', debouncedFilters.author);
        if (debouncedFilters.dateFrom) params.append('dateFrom', debouncedFilters.dateFrom);
        if (debouncedFilters.dateTo) params.append('dateTo', debouncedFilters.dateTo);
        if (debouncedFilters.sortBy) params.append('sortBy', debouncedFilters.sortBy);
        if (debouncedFilters.sortOrder) params.append('sortOrder', debouncedFilters.sortOrder);

        const response = await fetch(`/api/library/papers?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch papers');
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setPapers(data.papers || []);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalPapers || 0);
      } catch (err) {
        console.error('Error fetching papers:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching papers');
        setPapers([]);
        setTotalPages(1);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      fetchPapers();
    }
  }, [debouncedFilters, currentPage, isClient]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      category: 'All Categories',
      author: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
    setCurrentPage(1);
  };

  const handleDownload = async (paperId: string) => {
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
        a.download = `paper-${paperId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setPapers(prev => prev.map(paper => 
          paper.id === paperId 
            ? { ...paper, downloads: paper.downloads + 1 }
            : paper
        ));
      } else {
        alert('Download failed. Please try again.');
      }
    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!isClient) return dateString;
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const hasActiveFilters = filters.query !== '' || 
    filters.category !== 'All Categories' || 
    filters.author !== '' || 
    filters.dateFrom !== '' || 
    filters.dateTo !== '';

  if (!isClient) {
    return (
      <div className="min-h-screen bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-slate-200 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="h-96 bg-slate-200 rounded-lg lg:col-span-1"></div>
              <div className="space-y-4 lg:col-span-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-slate-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Research Library - IJARCM | Browse Published Papers"
        description="Explore our comprehensive collection of published research papers in computer science, management, technology, and more. Access peer-reviewed academic content from global researchers."
        keywords={['library', 'academic papers', 'research guides', 'IJARCM', 'educational resources']}
        canonicalUrl="/library"
        ogType="website"
      />
      <WebsiteSchema
        name="IJARCM Research Library"
        description="Comprehensive collection of published research papers and academic content"
        url="/library"
        publisher="IJARCM"
      />

      <div className="min-h-screen bg-slate-50 pb-20">
        {/* Hero Section */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-serif font-bold text-slate-900 mb-4">
                Research Library
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Discover and access {totalResults > 0 ? totalResults : 'thousands of'} published research papers. Our library provides open access to peer-reviewed scholarly articles across various disciplines.
              </p>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Research Library', href: '/library' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-slate-500" />
                    Filters
                  </h2>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs text-blue-600 hover:text-blue-800 px-2"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input
                        type="text"
                        value={filters.query}
                        onChange={(e) => handleFilterChange('query', e.target.value)}
                        placeholder="Title, keywords..."
                        className="pl-9 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Category
                    </label>
                    <Select 
                      value={filters.category} 
                      onValueChange={(val) => handleFilterChange('category', val)}
                    >
                      <SelectTrigger className="bg-slate-50">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Author */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Author
                    </label>
                    <Input
                      type="text"
                      value={filters.author}
                      onChange={(e) => handleFilterChange('author', e.target.value)}
                      placeholder="Author name"
                      className="bg-slate-50"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="border-t border-slate-100 pt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Publication Date
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                          type="date"
                          value={filters.dateFrom}
                          onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                          className="pl-9 bg-slate-50"
                          placeholder="From"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <Input
                          type="date"
                          value={filters.dateTo}
                          onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                          className="pl-9 bg-slate-50"
                          placeholder="To"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="border-t border-slate-100 pt-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Sort By
                    </label>
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(val) => handleFilterChange('sortBy', val as any)}
                    >
                      <SelectTrigger className="bg-slate-50 mb-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Publication Date</SelectItem>
                        <SelectItem value="downloads">Most Downloaded</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="rating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex bg-slate-100 p-1 rounded-md">
                      <button
                        onClick={() => handleFilterChange('sortOrder', 'asc')}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded text-sm font-medium transition-all ${
                          filters.sortOrder === 'asc' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <SortAsc className="w-4 h-4 mr-1" /> Asc
                      </button>
                      <button
                        onClick={() => handleFilterChange('sortOrder', 'desc')}
                        className={`flex-1 flex items-center justify-center py-1.5 rounded text-sm font-medium transition-all ${
                          filters.sortOrder === 'desc' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <SortDesc className="w-4 h-4 mr-1" /> Desc
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Papers Section */}
            <div className="lg:col-span-3">
              {/* Controls Bar */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="text-sm text-slate-600 font-medium">
                  {loading ? 'Searching...' : `Found ${totalResults} papers`}
                </div>

                <div className="flex items-center gap-4">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => setShowFilters(!showFilters)}
                     className="lg:hidden"
                   >
                     <Filter className="w-4 h-4 mr-2" />
                     Filters
                   </Button>

                   <div className="flex items-center bg-slate-100 p-1 rounded-md">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error loading papers</h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-6" />
                      <Skeleton className="h-20 w-full mb-6" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {!loading && papers.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No papers found</h3>
                  <p className="text-slate-600 mb-6">Try adjusting your search filters or query.</p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              )}

              {/* Papers Grid/List */}
              {!loading && papers.length > 0 && (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {papers.map((paper) => (
                    <Card key={paper.id} className="hover:shadow-md transition-all duration-200 border-slate-200 group">
                      <CardContent className="p-6">
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                              {paper.category}
                            </Badge>
                            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                              {formatDate(paper.publishedAt)}
                            </span>
                          </div>

                          <Link href={`/papers/${paper.id}`} className="group-hover:text-blue-700 transition-colors">
                            <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
                              {paper.title}
                            </h3>
                          </Link>

                          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                            {paper.abstract}
                          </p>

                          {/* Authors */}
                          <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
                             <span className="font-semibold text-slate-900">Authors:</span>
                             <div className="flex flex-wrap gap-1">
                               {paper.authors.slice(0, 3).map((author, idx) => (
                                 <span key={idx} className="bg-slate-50 px-2 py-0.5 rounded text-xs border border-slate-100">
                                   {author}
                                 </span>
                               ))}
                               {paper.authors.length > 3 && (
                                 <span className="text-xs text-slate-400">+{paper.authors.length - 3} more</span>
                               )}
                             </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Download className="w-3.5 h-3.5" />
                                {paper.downloads}
                              </span>
                              {paper.rating && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                                  {paper.rating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 text-xs"
                                onClick={() => handleDownload(paper.id)}
                              >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                PDF
                              </Button>
                              <Link href={`/papers/${paper.id}`}>
                                <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                  View Paper
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && papers.length > 0 && totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                   <div className="bg-white rounded-lg border border-slate-200 p-2 flex items-center gap-2 shadow-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center px-2">
                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageNum = currentPage - 2 + i;
                            }
                            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-slate-900 text-white'
                                  : 'text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';
import {
  Book,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Tag,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Lock,
  Globe,
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

interface EbooksData {
  ebooks: Ebook[];
  totalEbooks: number;
  totalPages: number;
  currentPage: number;
}

export default function EbooksPage() {
  const [ebooksData, setEbooksData] = useState<EbooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [accessTypeFilter, setAccessTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchEbooks = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        search: searchTerm,
        category: categoryFilter,
        accessType: accessTypeFilter,
        page: currentPage.toString(),
        limit: '12'
      });

      const response = await fetch(`/api/ebooks?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEbooksData(data);
      } else {
        throw new Error('Failed to fetch ebooks');
      }
    } catch (error) {
      console.error('Failed to fetch ebooks:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, accessTypeFilter, currentPage]);

  useEffect(() => {
    fetchEbooks();
  }, [fetchEbooks]);

  const getAccessTypeIcon = (accessType: string) => {
    switch (accessType) {
      case 'PUBLIC':
        return <Globe className="h-4 w-4" />;
      case 'LOGGED_IN_ONLY':
        return <Lock className="h-4 w-4" />;
      case 'PAID':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Book className="h-4 w-4" />;
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Ebook Library - IJARCM | Academic Resources & Publications"
        description="Browse our comprehensive collection of ebooks covering commerce, management, and related fields. Access free and premium academic resources."
        keywords={[
          'ebooks IJARCM',
          'academic ebooks',
          'commerce ebooks',
          'management resources',
          'research ebooks',
          'academic library',
          'scholarly publications'
        ]}
        canonicalUrl="/ebooks"
      />
      <WebsiteSchema
        name="IJARCM Ebook Library"
        url="https://ijrcam.com/ebooks"
        description="Browse our comprehensive collection of academic ebooks in commerce and management"
      />
      
      <div className="bg-white py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Ebooks', href: '/ebooks' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ebook Library</h1>
                <p className="mt-2 text-gray-600">Browse our collection of ebooks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ebooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="ALL">All Categories</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering">Engineering</option>
                <option value="Business">Business</option>
                <option value="Medicine">Medicine</option>
                <option value="Education">Education</option>
              </select>
            </div>

            {/* Access Type Filter */}
            <div>
              <select
                value={accessTypeFilter}
                onChange={(e) => setAccessTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Access Types</option>
                <option value="PUBLIC">Public</option>
                <option value="LOGGED_IN_ONLY">Logged In Users</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-end">
              <span className="text-sm text-gray-600">
                {ebooksData?.totalEbooks} results
              </span>
            </div>
          </div>
        </div>

        {/* Ebooks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ebooksData?.ebooks.map((ebook) => (
            <div key={ebook.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Cover Image */}
              <div className="relative h-48 bg-gray-200">
                {ebook.coverImage ? (
                  <Image
                    src={ebook.coverImage}
                    alt={ebook.title}
                    width={300}
                    height={192}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Book className="h-16 w-16 text-gray-400" />
                  </div>
                )}
                
                {/* Access Type Badge */}
                <div className="absolute top-2 right-2">
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getAccessTypeColor(ebook.accessType)}`}>
                    {getAccessTypeIcon(ebook.accessType)}
                    <span className="ml-1">{ebook.accessType.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="space-y-3">
                  {/* Title and Author */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">{ebook.title}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-1" />
                      {ebook.author}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ebook.description}</p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(ebook.createdAt)}
                      </div>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {ebook.category}
                      </div>
                    </div>
                    {ebook.price && (
                      <div className="text-lg font-bold text-green-600">
                        ${ebook.price}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {ebook.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ebook.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      {ebook.totalPages && (
                        <span className="mr-4">{ebook.totalPages} pages</span>
                      )}
                      {ebook.trialPages && (
                        <span>{ebook.trialPages} trial pages</span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        href={`/ebooks/${ebook.id}`}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                      
                      {ebook.accessType === 'PUBLIC' && (
                        <button
                          onClick={() => window.open(`/api/ebooks/${ebook.id}/download`, '_blank')}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {ebooksData?.ebooks.length === 0 && (
          <div className="text-center py-12">
            <Book className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ebooks found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find what you&apos;re looking for.</p>
          </div>
        )}

        {/* Pagination */}
        {ebooksData && ebooksData.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm font-medium text-gray-700">
                Page {currentPage} of {ebooksData.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, ebooksData.totalPages))}
                disabled={currentPage === ebooksData.totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

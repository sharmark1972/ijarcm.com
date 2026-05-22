'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Book,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Calendar,
  User,
  Tag,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  DollarSign,
  Lock,
  Globe
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
  filePath: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  purchaseCount: number;
  viewCount: number;
}

interface EbooksData {
  ebooks: Ebook[];
  totalEbooks: number;
  totalPages: number;
  currentPage: number;
}

export default function AdminEbooksPage() {
  const { isAdmin } = useAuth();
  const [ebooksData, setEbooksData] = useState<EbooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [accessTypeFilter, setAccessTypeFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEbooks, setSelectedEbooks] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  const fetchEbooks = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        search: searchTerm,
        category: categoryFilter,
        accessType: accessTypeFilter,
        page: currentPage.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/admin/ebooks?${params}`);
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

  const getStatusColor = (isPublished: boolean) => {
    return isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusIcon = (isPublished: boolean) => {
    return isPublished ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectEbook = (ebookId: string) => {
    setSelectedEbooks(prev => 
      prev.includes(ebookId) 
        ? prev.filter(id => id !== ebookId)
        : [...prev, ebookId]
    );
  };

  const handleDeleteEbook = async (ebookId: string, ebookTitle: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${ebookTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/ebooks/${ebookId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Ebook deleted successfully');
        fetchEbooks();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete ebook');
      }
    } catch (error) {
      console.error('Error deleting ebook:', error);
      alert('Failed to delete ebook');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Ebook Management</h1>
                <p className="mt-2 text-gray-600">Manage all ebooks in the system</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/ebooks/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Ebook
                </Link>
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

            {/* Bulk Actions */}
            {selectedEbooks.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const confirmed = confirm(`Are you sure you want to delete ${selectedEbooks.length} selected ebook(s)? This action cannot be undone.`);
                    if (confirmed) {
                      // Handle bulk delete
                      selectedEbooks.forEach(id => handleDeleteEbook(id, 'selected ebook'));
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ebooks Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Ebooks ({ebooksData?.totalEbooks})
              </h3>
              {selectedEbooks.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedEbooks.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {ebooksData?.ebooks.map((ebook) => (
              <div key={ebook.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedEbooks.includes(ebook.id)}
                      onChange={() => handleSelectEbook(ebook.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{ebook.title}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ebook.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {ebook.author}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(ebook.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              {ebook.category}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>Views: {ebook.viewCount}</span>
                            <span>Purchases: {ebook.purchaseCount}</span>
                            <span>Pages: {ebook.totalPages || 'Unknown'}</span>
                            <span>Trial Pages: {ebook.trialPages}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {ebook.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="ml-4 flex flex-col items-end space-y-3">
                          <div className="flex items-center space-x-2 mb-2">
                            {getAccessTypeIcon(ebook.accessType)}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getAccessTypeColor(ebook.accessType)}`}>
                              {ebook.accessType.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(ebook.isPublished)}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(ebook.isPublished)}`}>
                              {ebook.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>

                          {ebook.price && (
                            <div className="text-lg font-bold text-green-600">
                              ${ebook.price}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <Link
                      href={`/admin/ebooks/${ebook.id}`}
                      className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/ebooks/${ebook.id}/edit`}
                      className="p-2 text-green-600 hover:text-green-800 transition-colors"
                      title="Edit Ebook"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    {ebook.filePath && (
                      <button
                        onClick={() => window.open(ebook.filePath, '_blank')}
                        className="p-2 text-purple-600 hover:text-purple-800 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEbook(ebook.id, ebook.title)}
                      className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete Ebook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {ebooksData && ebooksData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, ebooksData.totalEbooks)} of {ebooksData.totalEbooks} results
                </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
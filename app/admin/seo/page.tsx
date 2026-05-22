'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Globe, 
  FileText, 
  Settings, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  Filter, 
  Download, 
  Upload,
  ArrowLeft,
  CheckSquare,
  MoreHorizontal,
  Image,
  Loader2,
  Bot
} from 'lucide-react';
import Link from 'next/link';

interface SEOConfig {
  id: string;
  page: string;
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonicalUrl?: string;
  robots?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  page: string;
  title: string;
  description: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonicalUrl: string;
  robots: string;
}

const initialFormData: FormData = {
  page: '',
  title: '',
  description: '',
  keywords: '',
  ogTitle: '',
  ogDescription: '',
  ogImage: '',
  twitterTitle: '',
  twitterDescription: '',
  twitterImage: '',
  canonicalUrl: '',
  robots: 'index, follow'
};

export default function SEOManagement() {
  const { user, loading: authLoading } = useAuth();
  const [configs, setConfigs] = useState<SEOConfig[]>([]);
  const [seoConfigs, setSeoConfigs] = useState<SEOConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConfigs, setSelectedConfigs] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SEOConfig | null>(null);
  const [formData, setFormData] = useState<FormData>({
    page: '',
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
    robots: 'index,follow'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<FormData | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const showMessage = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Fetch SEO configurations
  const fetchSEOConfigs = useCallback(async (search = '', page = 1) => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        ...(search && { search })
      });
      
      const response = await fetch(`/api/seo?${params}`);
      if (!response.ok) throw new Error('Failed to fetch SEO configs');
      
      const data = await response.json();
      setSeoConfigs(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching SEO configs:', error);
      showMessage('Failed to fetch SEO configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [limit, showMessage]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchSEOConfigs(searchTerm, currentPage);
    }
  }, [searchTerm, currentPage, fetchSEOConfigs, user]);

  // Redirect if not admin
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    redirect('/admin');
  }

  // Meta tag preview component
  const MetaPreview = () => (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Google Search Preview
        </h4>
        <div className="space-y-1">
          <div className="text-blue-600 text-lg hover:underline cursor-pointer">
            {formData.title || 'Page Title'}
          </div>
          <div className="text-green-700 text-sm">
            {formData.canonicalUrl || 'https://example.com/page'}
          </div>
          <div className="text-gray-600 text-sm">
            {formData.description || 'Page description will appear here...'}
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image className="w-4 h-4" />
          Open Graph Preview
        </h4>
        <div className="border rounded bg-white p-3">
          {formData.ogImage && (
            <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="font-semibold">
            {formData.ogTitle || formData.title || 'Page Title'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formData.ogDescription || formData.description || 'Page description...'}
          </div>
        </div>
      </div>
    </div>
  );



  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingConfig 
        ? `/api/seo?id=${editingConfig.id}`
        : '/api/seo';
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save SEO configuration');
      }

      showMessage(
        editingConfig 
          ? 'SEO configuration updated successfully'
          : 'SEO configuration created successfully'
      );
      
      setIsDialogOpen(false);
      setEditingConfig(null);
      setFormData(initialFormData);
      fetchSEOConfigs(searchTerm, currentPage);
    } catch (error: any) {
      console.error('Error saving SEO config:', error);
      showMessage(error.message || 'Failed to save SEO configuration', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SEO configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/seo?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete SEO configuration');

      showMessage('SEO configuration deleted successfully');
      fetchSEOConfigs(searchTerm, currentPage);
    } catch (error) {
      console.error('Error deleting SEO config:', error);
      showMessage('Failed to delete SEO configuration', 'error');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedConfigs.length === 0) {
      showMessage('Please select configurations to delete', 'error');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedConfigs.length} SEO configurations?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/seo?ids=${selectedConfigs.join(',')}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete SEO configurations');

      showMessage(`${selectedConfigs.length} SEO configurations deleted successfully`);
      setSelectedConfigs([]);
      fetchSEOConfigs(searchTerm, currentPage);
    } catch (error) {
      console.error('Error bulk deleting SEO configs:', error);
      showMessage('Failed to delete SEO configurations', 'error');
    }
  };

  // Handle edit
  const handleEdit = (config: SEOConfig) => {
    setEditingConfig(config);
    setFormData({
      page: config.page,
      title: config.title,
      description: config.description,
      keywords: config.keywords || '',
      ogTitle: config.ogTitle || '',
      ogDescription: config.ogDescription || '',
      ogImage: config.ogImage || '',
      twitterTitle: config.twitterTitle || '',
      twitterDescription: config.twitterDescription || '',
      twitterImage: config.twitterImage || '',
      canonicalUrl: config.canonicalUrl || '',
      robots: config.robots || 'index, follow'
    });
    setIsDialogOpen(true);
  };

  // Handle checkbox selection
  const handleSelectConfig = (configId: string, checked: boolean) => {
    if (checked) {
      setSelectedConfigs([...selectedConfigs, configId]);
    } else {
      setSelectedConfigs(selectedConfigs.filter(id => id !== configId));
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedConfigs(seoConfigs.map(config => config.id));
    } else {
      setSelectedConfigs([]);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setEditingConfig(null);
    setPreviewMode(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SEO Management</h1>
          <p className="text-gray-600 mt-1">
            Manage SEO settings for all pages across your website
          </p>
        </div>
        
        <button 
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add SEO Config
        </button>
      </div>

      {/* Add/Edit Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    {editingConfig ? 'Edit SEO Configuration' : 'Add SEO Configuration'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Configure SEO settings for a specific page. All fields help improve search engine visibility.
                  </p>
                </div>
                <button 
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    !showPreview 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                    showPreview 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
              </div>

              {showPreview ? (
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Meta Tag Preview</h3>
                  <MetaPreview />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic SEO */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic SEO
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="page" className="block text-sm font-medium text-gray-700 mb-1">Page Path *</label>
                            <input
                              id="page"
                              type="text"
                              value={formData.page}
                              onChange={(e) => setFormData({...formData, page: e.target.value})}
                              placeholder="/about, /contact, /blog/post-slug"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="robots" className="block text-sm font-medium text-gray-700 mb-1">Robots</label>
                            <input
                              id="robots"
                              type="text"
                              value={formData.robots}
                              onChange={(e) => setFormData({...formData, robots: e.target.value})}
                              placeholder="index, follow"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                    
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title * (Max 60 chars)</label>
                          <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Page title for search engines"
                            maxLength={60}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            {formData.title.length}/60 characters
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description * (Max 160 chars)</label>
                          <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Brief description of the page content"
                            maxLength={160}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                            required
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            {formData.description.length}/160 characters
                          </div>
                        </div>
                    
                        <div>
                          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
                          <input
                            id="keywords"
                            type="text"
                            value={formData.keywords}
                            onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                            placeholder="keyword1, keyword2, keyword3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="canonicalUrl" className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                          <input
                            id="canonicalUrl"
                            type="url"
                            value={formData.canonicalUrl}
                            onChange={(e) => setFormData({...formData, canonicalUrl: e.target.value})}
                            placeholder="https://example.com/canonical-page"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                  {/* Open Graph */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Open Graph (Facebook)
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="ogTitle" className="block text-sm font-medium text-gray-700 mb-1">OG Title</label>
                        <input
                          id="ogTitle"
                          type="text"
                          value={formData.ogTitle}
                          onChange={(e) => setFormData({...formData, ogTitle: e.target.value})}
                          placeholder="Title for social media sharing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="ogDescription" className="block text-sm font-medium text-gray-700 mb-1">OG Description</label>
                        <textarea
                          id="ogDescription"
                          value={formData.ogDescription}
                          onChange={(e) => setFormData({...formData, ogDescription: e.target.value})}
                          placeholder="Description for social media sharing"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="ogImage" className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
                        <input
                          id="ogImage"
                          type="url"
                          value={formData.ogImage}
                          onChange={(e) => setFormData({...formData, ogImage: e.target.value})}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Twitter Fields */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ExternalLink className="w-5 h-5" />
                      Twitter Cards
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="twitterTitle" className="block text-sm font-medium text-gray-700 mb-1">Twitter Title</label>
                        <input
                          id="twitterTitle"
                          type="text"
                          value={formData.twitterTitle}
                          onChange={(e) => setFormData({...formData, twitterTitle: e.target.value})}
                          placeholder="Title for Twitter sharing"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="twitterDescription" className="block text-sm font-medium text-gray-700 mb-1">Twitter Description</label>
                        <textarea
                          id="twitterDescription"
                          value={formData.twitterDescription}
                          onChange={(e) => setFormData({...formData, twitterDescription: e.target.value})}
                          placeholder="Description for Twitter sharing"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="twitterImage" className="block text-sm font-medium text-gray-700 mb-1">Twitter Image URL</label>
                        <input
                          id="twitterImage"
                          type="url"
                          value={formData.twitterImage}
                          onChange={(e) => setFormData({...formData, twitterImage: e.target.value})}
                          placeholder="https://example.com/twitter-image.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsDialogOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : editingConfig ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Configs</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected</p>
              <p className="text-2xl font-bold">{selectedConfigs.length}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pages</p>
              <p className="text-2xl font-bold">{currentPage}</p>
            </div>
            <Globe className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Per Page</p>
              <p className="text-2xl font-bold">{limit}</p>
            </div>
            <Bot className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search pages, titles, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedConfigs.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Selected ({selectedConfigs.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEO Configs Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedConfigs.length === seoConfigs.length && seoConfigs.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                  <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seoConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 px-6">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-12 h-12 text-gray-400" />
                        <p className="text-lg font-medium text-gray-600">No SEO configurations found</p>
                        <p className="text-gray-500">Create your first SEO configuration to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  seoConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedConfigs.includes(config.id)}
                          onChange={(e) => handleSelectConfig(config.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border">
                            {config.page}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate" title={config.title}>
                          {config.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate" title={config.description}>
                          {config.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(config.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button 
                            onClick={() => setShowDropdown(showDropdown === config.id ? null : config.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {showDropdown === config.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button 
                                onClick={() => {
                                  handleEdit(config);
                                  setShowDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button 
                                onClick={() => {
                                  handleDelete(config.id);
                                  setShowDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === page 
                        ? 'bg-blue-600 text-white' 
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
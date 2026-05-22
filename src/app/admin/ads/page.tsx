'use client';
// try
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Image,
  Video,
  Code,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface Advertisement {
  id: string;
  title: string;
  description: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  linkUrl: string;
  position: 'HOMEPAGE' | 'SIDEBAR' | 'HEADER' | 'FOOTER';
  isEnabled: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface AdFormData {
  title: string;
  description: string;
  mediaType: 'IMAGE' | 'VIDEO';
  mediaUrl: string;
  linkUrl: string;
  position: 'HOMEPAGE' | 'SIDEBAR' | 'HEADER' | 'FOOTER';
  isEnabled: boolean;
  startDate: string;
  endDate: string;
  priority: number;
}

export default function AdsManagement() {
  const { user, loading } = useAuth();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdFormData>({
    title: '',
    description: '',
    mediaType: 'IMAGE',
    mediaUrl: '',
    linkUrl: '',
    position: 'HOMEPAGE',
    isEnabled: false,
    startDate: '',
    endDate: '',
    priority: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      redirect('/login');
    }
  }, [user, loading]);

  const fetchAds = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/ads?admin=true&page=${currentPage}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setAds(data.ads);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchAds();
    }
  }, [user, currentPage, fetchAds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAd ? '/api/admin/ads' : '/api/admin/ads';
      const method = editingAd ? 'PUT' : 'POST';
      const payload = editingAd ? { id: editingAd.id, ...formData } : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingAd(null);
        resetForm();
        fetchAds();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save advertisement');
      }
    } catch (error) {
      console.error('Error saving ad:', error);
      alert('Failed to save advertisement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/ads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        fetchAds();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete advertisement');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete advertisement');
    }
  };

  const handleEdit = (ad: Advertisement) => {
    setEditingAd(ad);
    setFormData({
        title: ad.title,
        description: ad.description,
        mediaType: ad.mediaType,
        mediaUrl: ad.mediaUrl || '',
        linkUrl: ad.linkUrl || '',
        position: ad.position,
        isEnabled: ad.isEnabled,
        startDate: ad.startDate ? new Date(ad.startDate).toISOString().slice(0, 16) : '',
        endDate: ad.endDate ? new Date(ad.endDate).toISOString().slice(0, 16) : '',
        priority: ad.priority
      });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mediaType: 'IMAGE',
      mediaUrl: '',
      linkUrl: '',
      position: 'HOMEPAGE',
      isEnabled: false,
      startDate: '',
      endDate: '',
      priority: 0
    });
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'IMAGE':
        // eslint-disable-next-line jsx-a11y/alt-text
        return <Image className="h-4 w-4" />;
      case 'VIDEO':
        return <Video className="h-4 w-4" />;
      case 'HTML':
        return <Code className="h-4 w-4" />;
      default:
        // eslint-disable-next-line jsx-a11y/alt-text
        return <Image className="h-4 w-4" />;
    }
  };

  const getPositionLabel = (position: string) => {
    switch (position) {
      case 'HOMEPAGE':
        return 'Homepage';
      case 'SIDEBAR':
        return 'Sidebar';
      case 'HEADER':
        return 'Header';
      case 'FOOTER':
        return 'Footer';
      default:
        return position;
    }
  };

  const getPositionBadgeColor = (position: string) => {
    switch (position) {
      case 'HOMEPAGE':
        return 'bg-blue-100 text-blue-800';
      case 'SIDEBAR':
        return 'bg-green-100 text-green-800';
      case 'HEADER':
        return 'bg-yellow-100 text-yellow-800';
      case 'FOOTER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (ad: Advertisement) => {
    if (!ad.isEnabled) {
      return <EyeOff className="h-4 w-4 text-gray-400" />;
    }
    
    const now = new Date();
    const startDate = ad.startDate ? new Date(ad.startDate) : null;
    const endDate = ad.endDate ? new Date(ad.endDate) : null;
    
    if (startDate && startDate > now) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    if (endDate && endDate < now) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading || isLoading) {
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
                <h1 className="text-3xl font-bold text-gray-900">Advertisement Management</h1>
                <p className="mt-2 text-gray-600">Manage advertisements displayed across the platform</p>
              </div>
              <button
                onClick={() => {
                  setEditingAd(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Advertisement
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Position</label>
                      <select
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="HOMEPAGE">Homepage</option>
                        <option value="SIDEBAR">Sidebar</option>
                        <option value="HEADER">Header</option>
                        <option value="FOOTER">Footer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Media Type</label>
                      <select
                        value={formData.mediaType}
                        onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as any })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="IMAGE">Image</option>
                        <option value="VIDEO">Video</option>

                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isEnabled"
                        checked={formData.isEnabled}
                        onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-900">
                        Enabled
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Media URL</label>
                    <input
                      type="url"
                      value={formData.mediaUrl}
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Link URL</label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Date (optional)</label>
                      <input
                        type="datetime-local"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingAd(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {editingAd ? 'Update' : 'Create'} Advertisement
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Ads List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Advertisements ({ads.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advertisement</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad) => (
                  <tr key={ad.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{ad.description}</div>
                        {ad.linkUrl && (
                          <div className="flex items-center mt-1">
                            <ExternalLink className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500 truncate max-w-xs">{ad.linkUrl}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{getPositionLabel(ad.position)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMediaTypeIcon(ad.mediaType)}
                        <span className="ml-2 text-sm text-gray-900">{ad.mediaType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(ad)}
                        <span className="ml-2 text-sm text-gray-900">
                          {ad.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{ad.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(ad.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        by {ad.creator.firstName} {ad.creator.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(ad)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
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
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Building,
  User
} from 'lucide-react';

interface ChiefPatron {
  id: string;
  name: string;
  title: string;
  institution: string;
  imageUrl?: string;
  bio?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChiefPatronFormData {
  name: string;
  title: string;
  institution: string;
  imageUrl: string;
  bio: string;
  displayOrder: number;
  isActive: boolean;
}

export default function ChiefPatronsManagement() {
  const { user, loading } = useAuth();
  const [patrons, setPatrons] = useState<ChiefPatron[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatron, setEditingPatron] = useState<ChiefPatron | null>(null);
  const [formData, setFormData] = useState<ChiefPatronFormData>({
    name: '',
    title: '',
    institution: '',
    imageUrl: '',
    bio: '',
    displayOrder: 1,
    isActive: true
  });
  const [filters, setFilters] = useState({
    isActive: '',
    search: ''
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      redirect('/login');
    }
  }, [user, loading]);

  const fetchPatrons = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      
      const response = await fetch(`/api/admin/chief-patrons?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPatrons(data.chiefPatrons || []);
      }
    } catch (error) {
      console.error('Error fetching chief patrons:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPatrons();
    }
  }, [user, filters, fetchPatrons]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPatron ? `/api/admin/chief-patrons/${editingPatron.id}` : '/api/admin/chief-patrons';
      const method = editingPatron ? 'PUT' : 'POST';
      const payload = formData; // Remove ID from payload since it's in the URL for updates

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingPatron(null);
        resetForm();
        fetchPatrons();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save chief patron');
      }
    } catch (error) {
      console.error('Error saving chief patron:', error);
      alert('Failed to save chief patron');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this chief patron?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/chief-patrons/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPatrons();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete chief patron');
      }
    } catch (error) {
      console.error('Error deleting chief patron:', error);
      alert('Failed to delete chief patron');
    }
  };

  const handleEdit = (patron: ChiefPatron) => {
    setEditingPatron(patron);
    setFormData({
      name: patron.name,
      title: patron.title,
      institution: patron.institution,
      imageUrl: patron.imageUrl || '',
      bio: patron.bio || '',
      displayOrder: patron.displayOrder,
      isActive: patron.isActive
    });
    setShowForm(true);
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentPatron = patrons.find(p => p.id === id);
    if (!currentPatron) return;

    const newOrder = direction === 'up' ? currentPatron.displayOrder - 1 : currentPatron.displayOrder + 1;
    
    try {
      const response = await fetch(`/api/admin/chief-patrons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayOrder: newOrder
        }),
      });

      if (response.ok) {
        fetchPatrons();
      }
    } catch (error) {
      console.error('Error reordering chief patron:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      institution: '',
      imageUrl: '',
      bio: '',
      displayOrder: Math.max(...patrons.map(p => p.displayOrder), 0) + 1,
      isActive: true
    });
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
                <h1 className="text-3xl font-bold text-gray-900">Chief Patrons Management</h1>
                <p className="mt-2 text-gray-600">Manage chief patrons displayed on the landing page</p>
              </div>
              <button
                onClick={() => {
                  setEditingPatron(null);
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Chief Patron
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search by name, title, or institution..."
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingPatron ? 'Edit Chief Patron' : 'Add New Chief Patron'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Institution *</label>
                    <input
                      type="text"
                      required
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Display Order</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPatron(null);
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
                      {editingPatron ? 'Update' : 'Create'} Chief Patron
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Chief Patrons List */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Chief Patrons ({patrons.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chief Patron</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {patrons.map((patron) => (
                  <tr key={patron.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {patron.imageUrl ? (
                            <Image
                              className="h-10 w-10 rounded-full object-cover"
                              src={patron.imageUrl}
                              alt={patron.name}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patron.name}</div>
                          <div className="text-sm text-gray-500">{patron.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{patron.institution}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">{patron.displayOrder}</span>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => handleReorder(patron.id, 'up')}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={patron.displayOrder === 1}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleReorder(patron.id, 'down')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {patron.isActive ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="ml-2 text-sm text-gray-900">
                          {patron.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(patron.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(patron)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patron.id)}
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

          {patrons.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No chief patrons</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new chief patron.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setEditingPatron(null);
                    resetForm();
                    setShowForm(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Chief Patron
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
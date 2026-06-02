'use client';

import { useState, useEffect, useCallback } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Eye,
  EyeOff,
  Search,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  description?: string;
  volume: string;
  issueNumber: string;
  year: number;
  publishDate: string;
  coverImage?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    papers: number;
  };
}

interface IssueFormData {
  title: string;
  description: string;
  volume: string;
  issueNumber: string;
  year: string;
  publishDate: string;
  coverImage: string;
  isPublished: boolean;
}

export default function AdminIssuesPage() {
  const { isAdmin } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    volume: '',
    issueNumber: '',
    year: new Date().getFullYear().toString(),
    publishDate: new Date().toISOString().split('T')[0],
    coverImage: '',
    isPublished: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatingCovers, setGeneratingCovers] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
      });

      const response = await fetch(`/api/admin/issues?${params}`);
      const data = await response.json();

      if (response.ok) {
        setIssues(data.issues || []);
      } else {
        console.error('Failed to fetch issues:', data.error);
        alert(`Failed to load issues: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      alert('Failed to load issues. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        year: parseInt(formData.year),
        coverImage: formData.coverImage || undefined,
      };

      const url = editingIssue
        ? `/api/admin/issues/${editingIssue.id}`
        : '/api/admin/issues';

      const method = editingIssue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert(editingIssue ? 'Issue updated successfully!' : 'Issue created successfully!');
        setShowForm(false);
        setEditingIssue(null);
        resetForm();
        fetchIssues();
      } else {
        alert(data.error || 'Failed to save issue');
      }
    } catch (error) {
      console.error('Error saving issue:', error);
      alert('Failed to save issue');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (issue: Issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description || '',
      volume: issue.volume,
      issueNumber: issue.issueNumber,
      year: issue.year.toString(),
      publishDate: new Date(issue.publishDate).toISOString().split('T')[0],
      coverImage: issue.coverImage || '',
      isPublished: issue.isPublished,
    });
    setShowForm(true);
  };

  const handleDelete = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Issue deleted successfully!');
        fetchIssues();
      } else {
        alert(data.error || 'Failed to delete issue');
      }
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue');
    }
  };

  const handleTogglePublished = async (issue: Issue) => {
    try {
      const response = await fetch(`/api/admin/issues/${issue.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !issue.isPublished }),
      });

      if (response.ok) {
        fetchIssues();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update issue');
      }
    } catch (error) {
      console.error('Error updating issue:', error);
      alert('Failed to update issue');
    }
  };

  const handleGenerateSingleCover = async () => {
    if (!formData.title || !formData.volume || !formData.issueNumber || !formData.year) {
      alert('Please fill in Title, Volume, Issue Number and Year first');
      return;
    }
    setGeneratingCover(true);
    try {
      const response = await fetch('/api/admin/issues/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volume: formData.volume,
          issueNumber: formData.issueNumber,
          year: formData.year,
          title: formData.title,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setFormData(prev => ({ ...prev, coverImage: data.coverUrl }));
      } else {
        alert(data.error || 'Failed to generate cover');
      }
    } catch {
      alert('Failed to generate cover');
    } finally {
      setGeneratingCover(false);
    }
  };

  const handleGenerateAllCovers = async () => {
    if (!confirm('This will generate cover images for all issues without covers. Continue?')) {
      return;
    }

    setGeneratingCovers(true);
    try {
      const response = await fetch('/api/admin/issues/generate-all-covers', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Cover images generated successfully!');
        fetchIssues();
      } else {
        alert(data.error || 'Failed to generate cover images');
      }
    } catch (error) {
      console.error('Error generating covers:', error);
      alert('Failed to generate cover images');
    } finally {
      setGeneratingCovers(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      volume: '',
      issueNumber: '',
      year: new Date().getFullYear().toString(),
      publishDate: new Date().toISOString().split('T')[0],
      coverImage: '',
      isPublished: false,
    });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIssue(null);
    resetForm();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Issue Management</h1>
              <p className="mt-2 text-gray-600">Create and manage journal issues</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateAllCovers}
                disabled={generatingCovers}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                {generatingCovers ? 'Generating...' : 'Generate All Covers'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setEditingIssue(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Issue
              </button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingIssue ? 'Edit Issue' : 'Create New Issue'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., January - March 2025"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description of this issue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volume *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.issueNumber}
                        onChange={(e) => setFormData({ ...formData, issueNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Year *
                      </label>
                      <input
                        type="number"
                        required
                        min="1900"
                        max="2100"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Publish Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.publishDate}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.coverImage}
                        onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter URL or click Generate Cover"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSingleCover}
                        disabled={generatingCover}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
                      >
                        {generatingCover ? 'Generating...' : 'Generate Cover'}
                      </button>
                    </div>
                    {formData.coverImage && (
                      <div className="mt-3">
                        <img
                          src={formData.coverImage}
                          alt="Cover Preview"
                          className="h-40 object-contain rounded border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="ml-2 block text-sm text-gray-700">
                      Publish this issue (make it available for paper assignment)
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {submitting ? 'Saving...' : editingIssue ? 'Update Issue' : 'Create Issue'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search' : 'Get started by creating your first issue'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Issue
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <div key={issue.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{issue.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          issue.isPublished
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {issue.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      {issue.description && (
                        <p className="text-gray-600 mb-3">{issue.description}</p>
                      )}

                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-1" />
                          Volume {issue.volume}, Issue {issue.issueNumber}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {issue.year}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {issue._count.papers} paper{issue._count.papers !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleTogglePublished(issue)}
                        className={`p-2 rounded-lg transition-colors ${
                          issue.isPublished
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={issue.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {issue.isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => handleEdit(issue)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(issue.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                        disabled={issue._count.papers > 0}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

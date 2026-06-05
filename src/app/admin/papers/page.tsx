'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
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
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
  BookOpen,
  X
} from 'lucide-react';

interface Issue {
  id: string;
  title: string;
  volume: string;
  issueNumber: string;
  year: number;
  isPublished: boolean;
}

interface Paper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  keywords: string[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUIRED' | 'ACCEPTED' | 'PUBLISHED' | 'REJECTED';
  submittedAt: string;
  publishedAt?: string;
  reviewCount: number;
  downloadCount: number;
  category: string;
  submittedBy: {
    name: string;
    email: string;
    institution: string;
  };
  fileUrl?: string;
  volumeNumber?: string;
  issueNumber?: string;
  publicationDate?: string;
  uniqueNumber?: string;
  issue?: {
    id: string;
    title: string;
    volume: string;
    issueNumber: string;
    year: number;
    isPublished: boolean;
  } | null;
  plagiarismChecks?: {
    id: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    similarityScore?: number;
    createdAt: string;
  }[];
}

interface PapersData {
  papers: Paper[];
  totalPapers: number;
  totalPages: number;
  currentPage: number;
}

interface NewDraft {
  id: string;
  title: string | null;
  abstract: string | null;
  authors: Array<{ name: string }>;
  keywords: unknown;
  status: string;
  sourceFileName: string | null;
  doi: string | null;
  updatedAt: string;
  issue: {
    title: string;
    volume: string;
    issueNumber: string;
    year: number;
  } | null;
}

export default function AdminPapersPage() {
  const { isAdmin } = useAuth();
  const [papersData, setPapersData] = useState<PapersData | null>(null);
  const [newDrafts, setNewDrafts] = useState<NewDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [issueFilter, setIssueFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const [plagiarismCheckLoading, setPlagiarismCheckLoading] = useState<Set<string>>(new Set());
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPaperId, setAssigningPaperId] = useState<string | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [downloadingDraftId, setDownloadingDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin()) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  const fetchIssues = useCallback(async () => {
    try {
      setIssuesLoading(true);
      const response = await fetch('/api/admin/issues?published=true');
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  const fetchPapers = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        category: categoryFilter,
        issueId: issueFilter,
        page: currentPage.toString(),
        limit: '10'
      });

      // Old papers fetch
      const oldRes = await fetch(`/api/admin/papers?${params}`);
      if (oldRes.ok) {
        const data = await oldRes.json();
        setPapersData(data);
      } else {
        throw new Error('Failed to fetch papers');
      }

      // New drafts fetch — only on page 1, no filters
      if (currentPage === 1) {
        const newRes = await fetch('/api/admin/research-papers?limit=50');
        if (newRes.ok) {
          const data = await newRes.json();
          setNewDrafts(data.drafts || []);
        }
      } else {
        setNewDrafts([]);
      }
    } catch (error) {
      console.error('Failed to fetch papers:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, categoryFilter, issueFilter, currentPage]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    fetchPapers();
  }, [fetchPapers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return 'bg-green-100 text-green-800';
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'REVISION_REQUIRED':
        return 'bg-orange-100 text-orange-800';
      // New system statuses
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'UPLOADED':
        return 'bg-blue-100 text-blue-800';
      case 'EXTRACTED':
        return 'bg-indigo-100 text-indigo-800';
      case 'EDITING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READY':
        return 'bg-teal-100 text-teal-800';
      case 'PDF_GENERATED':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <CheckCircle className="h-4 w-4" />;
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />;
      case 'UNDER_REVIEW':
        return <Clock className="h-4 w-4" />;
      case 'SUBMITTED':
        return <AlertCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'REVISION_REQUIRED':
        return <Edit className="h-4 w-4" />;
      case 'READY':
        return <CheckCircle className="h-4 w-4" />;
      case 'EDITING':
        return <Edit className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSelectPaper = (paperId: string) => {
    setSelectedPapers(prev =>
      prev.includes(paperId)
        ? prev.filter(id => id !== paperId)
        : [...prev, paperId]
    );
  };

  const handlePlagiarismCheck = async (paperId: string) => {
    try {
      setPlagiarismCheckLoading(prev => new Set(prev).add(paperId));

      const response = await fetch(`/api/papers/${paperId}/plagiarism`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        fetchPapers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to start plagiarism check');
      }
    } catch (error) {
      console.error('Error starting plagiarism check:', error);
      alert('Failed to start plagiarism check');
    } finally {
      setPlagiarismCheckLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperId);
        return newSet;
      });
    }
  };

  const getPlagiarismStatus = (paper: Paper) => {
    if (!paper.plagiarismChecks || paper.plagiarismChecks.length === 0) return null;
    return paper.plagiarismChecks[paper.plagiarismChecks.length - 1];
  };

  const getPlagiarismIcon = (status: string, similarityScore?: number) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'COMPLETED':
        if (similarityScore && similarityScore > 20) {
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        }
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const handleBulkAction = async (action: 'publish' | 'reject' | 'delete') => {
    if (selectedPapers.length === 0) return;

    if (action === 'delete') {
      const confirmed = confirm(`Are you sure you want to delete ${selectedPapers.length} selected paper(s)? This action cannot be undone.`);
      if (!confirmed) return;
    }

    try {
      const response = await fetch('/api/admin/papers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, paperIds: selectedPapers })
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message);
        fetchPapers();
        setSelectedPapers([]);
      } else {
        alert(result.error || 'Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action');
    }
  };

  const handleDeletePaper = async (paperId: string, paperTitle: string) => {
    const confirmed = confirm(`Are you sure you want to delete "${paperTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Paper deleted successfully');
        fetchPapers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete paper');
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
      alert('Failed to delete paper');
    }
  };

  const handleDeleteDraft = async (draftId: string, title: string | null) => {
    const confirmed = confirm(`Are you sure you want to delete "${title || 'this paper'}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/research-papers/${draftId}`, { method: 'DELETE' });
      if (response.ok) {
        setNewDrafts(prev => prev.filter(d => d.id !== draftId));
      } else {
        alert('Failed to delete paper. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete paper. Please try again.');
    }
  };

  const handleDownloadDraft = async (draftId: string, title: string | null) => {
    setDownloadingDraftId(draftId);
    try {
      const response = await fetch(`/api/admin/research-papers/${draftId}/download`);
      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'research-paper'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading draft:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingDraftId(null);
    }
  };

  const openAssignModal = (paperId: string, currentIssueId?: string | null) => {
    setAssigningPaperId(paperId);
    setSelectedIssueId(currentIssueId || '');
    setShowAssignModal(true);
  };

  const handleAssignIssue = async () => {
    if (!assigningPaperId) return;

    try {
      setAssigning(true);
      const response = await fetch(`/api/papers/${assigningPaperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: selectedIssueId || null })
      });

      if (response.ok) {
        alert('Issue assigned successfully!');
        setShowAssignModal(false);
        setAssigningPaperId(null);
        setSelectedIssueId('');
        fetchPapers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to assign issue');
      }
    } catch (error) {
      console.error('Error assigning issue:', error);
      alert('Failed to assign issue');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveIssue = async (paperId: string) => {
    if (!confirm('Are you sure you want to remove this paper from its issue?')) return;

    try {
      const response = await fetch(`/api/papers/${paperId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: null })
      });

      if (response.ok) {
        alert('Paper removed from issue successfully!');
        fetchPapers();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove issue');
      }
    } catch (error) {
      console.error('Error removing issue:', error);
      alert('Failed to remove issue');
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
                <h1 className="text-3xl font-bold text-gray-900">Paper Management</h1>
                <p className="mt-2 text-gray-600">Manage all papers and publications in the system</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  href="/admin/research-papers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add Paper
                </Link>
                <Link
                  href="/admin/issues"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Issues
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
                placeholder="Search papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="REVISION_REQUIRED">Revision Required</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="REJECTED">Rejected</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Environmental Science">Environmental Science</option>
                <option value="Finance">Finance</option>
                <option value="Medicine">Medicine</option>
                <option value="Agriculture">Agriculture</option>
              </select>
            </div>

            {/* Issue Filter */}
            <div>
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={issuesLoading}
              >
                <option value="">All Issues</option>
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    Vol {issue.volume}, Issue {issue.issueNumber} ({issue.year})
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk Actions — only for old papers */}
            {selectedPapers.length > 0 && (
              <div className="flex space-x-2 md:col-span-4">
                <button
                  onClick={() => handleBulkAction('publish')}
                  className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                >
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  <XCircle className="h-4 w-4 inline mr-1" />
                  Reject
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="h-4 w-4 inline mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Papers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Papers ({(papersData?.totalPapers || 0) + newDrafts.length})
              </h3>
              {selectedPapers.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedPapers.length} selected
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200">

            {/* ── NEW PAPERS (ResearchPaperDraft) — page 1 only ── */}
            {currentPage === 1 && newDrafts.map((draft) => (
              <div key={`new-${draft.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* No checkbox for new drafts — bulk actions only for old */}
                    <div className="mt-1 h-4 w-4" />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {/* Title + NEW badge */}
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {draft.title || '(Untitled)'}
                            </h4>
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                              NEW
                            </span>
                          </div>

                          {draft.sourceFileName && (
                            <p className="text-sm text-gray-500 mb-2">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {draft.sourceFileName}
                            </p>
                          )}

                          {/* Abstract */}
                          {draft.abstract && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {draft.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            {draft.authors.length > 0 && (
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {draft.authors.map(a => a.name).join(', ')}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(draft.updatedAt)}
                            </div>
                          </div>

                          {draft.issue && (
                            <div className="flex items-center space-x-2 mb-3">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">
                                Vol {draft.issue.volume}, Issue {draft.issue.issueNumber} ({draft.issue.year})
                              </span>
                            </div>
                          )}

                          {/* Keywords */}
                          {Array.isArray(draft.keywords) && draft.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {(draft.keywords as string[]).map((keyword, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                                >
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex flex-col items-end space-y-3">
                          {/* Status badge */}
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(draft.status)}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(draft.status)}`}>
                              {draft.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/research-papers/${draft.id}`}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/research-papers/new?id=${draft.id}`}
                              className="p-2 text-green-600 hover:text-green-800 transition-colors"
                              title="Edit Paper"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDownloadDraft(draft.id, draft.title)}
                              disabled={downloadingDraftId === draft.id}
                              className="p-2 text-purple-600 hover:text-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Download PDF"
                            >
                              {downloadingDraftId === draft.id ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id, draft.title)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Paper"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* ── OLD PAPERS (513, papers table) ── */}
            {papersData?.papers.map((paper) => (
              <div key={`old-${paper.id}`} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedPapers.includes(paper.id)}
                      onChange={() => handleSelectPaper(paper.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{paper.title}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {paper.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              {paper.authors.join(', ')}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(paper.submittedAt)}
                            </div>
                            <div className="flex items-center">
                              <Tag className="h-4 w-4 mr-1" />
                              {paper.category}
                            </div>
                          </div>

                          {/* Issue Information */}
                          {paper.issue ? (
                            <div className="flex items-center space-x-2 mb-3">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">
                                Vol {paper.issue.volume}, Issue {paper.issue.issueNumber} ({paper.issue.year})
                              </span>
                              <button
                                onClick={() => handleRemoveIssue(paper.id)}
                                className="text-red-500 hover:text-red-700"
                                title="Remove from issue"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(paper.id)}
                              className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors mb-3"
                            >
                              <BookOpen className="h-4 w-4 mr-1" />
                              Assign to Issue
                            </button>
                          )}

                          {/* Publication Information */}
                          {(paper.volumeNumber || paper.issueNumber || paper.publicationDate || paper.uniqueNumber) && (
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                              {paper.volumeNumber && (
                                <div className="flex items-center">
                                  <span className="font-medium mr-1">Vol:</span>
                                  {paper.volumeNumber}
                                </div>
                              )}
                              {paper.issueNumber && (
                                <div className="flex items-center">
                                  <span className="font-medium mr-1">Issue:</span>
                                  {paper.issueNumber}
                                </div>
                              )}
                              {paper.publicationDate && (
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(paper.publicationDate)}
                                </div>
                              )}
                              {paper.uniqueNumber && (
                                <div className="flex items-center">
                                  <span className="font-medium mr-1">ID:</span>
                                  {paper.uniqueNumber}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <span>Reviews: {paper.reviewCount}</span>
                            <span>Downloads: {paper.downloadCount}</span>
                            <span>Submitted by: {paper.submittedBy.name}</span>
                            {(() => {
                              const plagiarismStatus = getPlagiarismStatus(paper);
                              if (plagiarismStatus) {
                                return (
                                  <div className="flex items-center">
                                    {getPlagiarismIcon(plagiarismStatus.status, plagiarismStatus.similarityScore)}
                                    <span className="ml-1">
                                      Plagiarism: {plagiarismStatus.status === 'COMPLETED'
                                        ? `${plagiarismStatus.similarityScore}% similarity`
                                        : plagiarismStatus.status
                                      }
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {paper.keywords.map((keyword, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end space-y-3">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(paper.status)}
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                              {paper.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/papers/${paper.id}`}
                              className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/papers/${paper.id}/edit`}
                              className="p-2 text-green-600 hover:text-green-800 transition-colors"
                              title="Edit Paper"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            {paper.fileUrl && (
                              <button
                                onClick={() => window.open(paper.fileUrl, '_blank')}
                                className="p-2 text-purple-600 hover:text-purple-800 transition-colors"
                                title="Download PDF"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePlagiarismCheck(paper.id)}
                              disabled={plagiarismCheckLoading.has(paper.id)}
                              className="p-2 text-orange-600 hover:text-orange-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Run Plagiarism Check"
                            >
                              {plagiarismCheckLoading.has(paper.id) ? (
                                <Clock className="h-4 w-4 animate-spin" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeletePaper(paper.id, paper.title)}
                              className="p-2 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Paper"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination — old papers only */}
          {papersData && papersData.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, papersData.totalPapers)} of {papersData.totalPapers} results
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
                    Page {currentPage} of {papersData.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, papersData.totalPages))}
                    disabled={currentPage === papersData.totalPages}
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

      {/* Assign Issue Modal — old papers only */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Assign to Issue</h2>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningPaperId(null);
                    setSelectedIssueId('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Issue
                  </label>
                  <select
                    value={selectedIssueId}
                    onChange={(e) => setSelectedIssueId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- No Issue --</option>
                    {issues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.title} (Vol {issue.volume}, Issue {issue.issueNumber}, {issue.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAssignIssue}
                    disabled={assigning}
                    className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setAssigningPaperId(null);
                      setSelectedIssueId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

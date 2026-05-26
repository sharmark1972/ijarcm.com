'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Filter, Eye, Trash2 } from 'lucide-react';

interface Certificate {
  id: string;
  certificateNumber: string;
  type: 'PUBLICATION' | 'PARTICIPATION' | 'REVIEW' | 'AWARD' | 'CONFERENCE';
  title: string;
  authorName: string;
  institution?: string;
  issuedAt: string;
  customDate?: string;
  journal?: { id: string; name: string; abbreviation: string } | null;
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      const response = await fetch(`/api/certificates?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
        setSelectedIds(new Set());
      }
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, [searchTerm, typeFilter]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setCertificates(prev => prev.filter(c => c.id !== id));
        setSelectedIds(prev => { const s = new Set(prev); s.delete(id); return s; });
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          fetch(`/api/certificates/${id}`, { method: 'DELETE' })
        )
      );
      setCertificates(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Bulk delete failed:', error);
    } finally {
      setDeleting(false);
      setBulkConfirm(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === certificates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(certificates.map(c => c.id)));
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const typeColors: Record<string, string> = {
    PUBLICATION: 'bg-blue-100 text-blue-800',
    PARTICIPATION: 'bg-green-100 text-green-800',
    REVIEW: 'bg-purple-100 text-purple-800',
    AWARD: 'bg-yellow-100 text-yellow-800',
    CONFERENCE: 'bg-indigo-100 text-indigo-800',
  };

  const allSelected = certificates.length > 0 && selectedIds.size === certificates.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
              <p className="mt-1 text-gray-600">Generated certificates ka record</p>
            </div>
            <Link
              href="/admin/certificates/generate"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Certificate
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, cert number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none"
            >
              <option value="ALL">All Types</option>
              <option value="PUBLICATION">Publication</option>
              <option value="PARTICIPATION">Participation</option>
              <option value="REVIEW">Review</option>
              <option value="AWARD">Award</option>
              <option value="CONFERENCE">Conference</option>
            </select>
          </div>

          {/* Bulk delete */}
          {someSelected && (
            <div className="flex items-center gap-2 ml-auto">
              {bulkConfirm ? (
                <>
                  <span className="text-sm text-gray-700">{selectedIds.size} delete kiye jayenge?</span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Haan, delete karo'}
                  </button>
                  <button
                    onClick={() => setBulkConfirm(false)}
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    Nahi
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setBulkConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 text-sm rounded hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete ({selectedIds.size})
                </button>
              )}
            </div>
          )}

          {!someSelected && (
            <div className="text-sm text-gray-500 ml-auto">
              Total: <span className="font-semibold text-gray-800">{certificates.length}</span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-20 text-gray-500">Koi certificate nahi mila</div>
          ) : (
            <table className="w-full table-fixed divide-y divide-gray-200">
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '24%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '11%' }} />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cert Number</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title / Conference</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert.id} className={`hover:bg-gray-50 ${selectedIds.has(cert.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(cert.id)}
                        onChange={() => toggleSelect(cert.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-mono text-gray-900 block truncate">{cert.certificateNumber}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${typeColors[cert.type] || 'bg-gray-100 text-gray-800'}`}>
                        {cert.type}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate">{cert.authorName}</div>
                      {cert.institution && (
                        <div className="text-xs text-gray-500 truncate">{cert.institution}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700 block truncate">{cert.journal?.abbreviation || 'IJARCM'}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-900 truncate">{cert.title}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-gray-700">{formatDate(cert.customDate || cert.issuedAt)}</span>
                    </td>
                    <td className="px-3 py-3">
                      {confirmDeleteId === cert.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(cert.id)}
                            disabled={deleting}
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Haan
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                          >
                            Nahi
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/certificates/${cert.id}/view`}
                            className="text-blue-600 hover:text-blue-900"
                            title="View & Download"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(cert.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

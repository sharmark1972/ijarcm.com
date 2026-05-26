'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe, Plus, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  website?: string | null;
  issnPrint?: string | null;
  issnOnline?: string | null;
  origin?: string | null;
  doiAllotted: boolean;
  isDefault: boolean;
  isActive: boolean;
}

export default function JournalsPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJournals = async () => {
    try {
      const res = await fetch('/api/admin/journals');
      if (res.ok) {
        const data = await res.json();
        setJournals(data.journals || []);
      }
    } catch (error) {
      console.error('Failed to fetch journals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJournals(); }, []);

  const handleDelete = async (id: string, abbr: string) => {
    if (!confirm(`Are you sure you want to deactivate "${abbr}"? This will not delete existing certificates.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/journals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchJournals();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to deactivate journal');
      }
    } catch {
      alert('Failed to deactivate journal');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sites / Journals</h1>
              <p className="mt-1 text-gray-600">Manage all journals for certificate generation</p>
            </div>
            <Link
              href="/admin/journals/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Journal
            </Link>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abbreviation</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Journal Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISSN Print</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISSN Online</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOI</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {journals.map((journal, index) => (
                <tr key={journal.id} className={!journal.isActive ? 'opacity-50' : ''}>
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{journal.abbreviation}</span>
                      {journal.isDefault && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900 max-w-xs truncate">{journal.name}</p>
                      {journal.website && (
                        <a href={journal.website} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                          <Globe className="h-3 w-3" />
                          {journal.website.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{journal.issnPrint || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">{journal.issnOnline || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{journal.origin || '—'}</td>
                  <td className="px-4 py-3">
                    {journal.doiAllotted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      journal.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {journal.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/journals/${journal.id}/edit`}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {!journal.isDefault && (
                        <button
                          onClick={() => handleDelete(journal.id, journal.abbreviation)}
                          disabled={deletingId === journal.id}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Deactivate"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {journals.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No journals found. <Link href="/admin/journals/new" className="text-blue-600 hover:underline">Add one</Link>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FileText, Plus, Search, Upload } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ResearchPaperListDraft {
  id: string;
  title: string | null;
  sourceFileName: string | null;
  status: string;
  doi: string | null;
  issue: {
    title: string;
    volume: string;
    issueNumber: string;
    year: number;
  } | null;
  authors: Array<{ name: string }>;
  sections: Array<{ id: string }>;
  updatedAt: string;
}

export default function ResearchPapersPage() {
  const { isAdmin } = useAuth();
  const [drafts, setDrafts] = useState<ResearchPaperListDraft[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  if (!isAdmin()) {
    redirect('/dashboard');
  }

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ limit: '50' });
        if (search.trim()) params.set('search', search.trim());

        const response = await fetch(`/api/admin/research-papers?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load research papers');
        }

        setDrafts(data.drafts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load research papers');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchDrafts, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const rows = useMemo(() => drafts, [drafts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Research Papers</h1>
              <p className="mt-2 text-gray-600">Upload and prepare research papers from DOCX files.</p>
            </div>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/admin/research-papers/new">
                <Plus className="h-4 w-4" />
                Add Paper
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search research papers..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <Button asChild variant="outline">
                <Link href="/admin/research-papers/new">
                  <Upload className="h-4 w-4" />
                  Upload DOCX
                </Link>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Issue</th>
                  <th className="px-6 py-3 font-medium">DOI</th>
                  <th className="px-6 py-3 font-medium">Sections</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Loading research papers...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-red-600">
                      {error}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No research papers found. Upload a DOCX file to create the first draft.
                    </td>
                  </tr>
                ) : rows.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{paper.title || paper.sourceFileName || 'Untitled draft'}</p>
                          <p className="mt-1 text-gray-500">
                            {paper.authors.length > 0 ? paper.authors.map((author) => author.name).join(', ') : 'No authors yet'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {paper.issue ? `Vol. ${paper.issue.volume}, Issue ${paper.issue.issueNumber}` : 'Not assigned'}
                    </td>
                    <td className="px-6 py-4">
                      {paper.doi || <span className="text-gray-400">Empty</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{paper.sections.length}</td>
                    <td className="px-6 py-4">
                      <Badge variant={paper.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {paper.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/research-papers/new?id=${paper.id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

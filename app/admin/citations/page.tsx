'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, Plus, Copy, BookOpen, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Citation {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  location?: string;
  type: 'JOURNAL' | 'BOOK' | 'CONFERENCE' | 'THESIS' | 'WEBSITE';
  createdAt: string;
  updatedAt: string;
}

interface CitationForm {
  title: string;
  authors: string;
  year: string;
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  url: string;
  publisher: string;
  location: string;
  type: 'JOURNAL' | 'BOOK' | 'CONFERENCE' | 'THESIS' | 'WEBSITE';
}

const initialForm: CitationForm = {
  title: '',
  authors: '',
  year: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  url: '',
  publisher: '',
  location: '',
  type: 'JOURNAL'
};

export default function AdminCitationsPage() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [form, setForm] = useState<CitationForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  useEffect(() => {
    fetchCitations();
  }, []);

  const fetchCitations = async () => {
    try {
      const response = await fetch('/api/citations');
      if (response.ok) {
        const data = await response.json();
        setCitations(data);
      }
    } catch (error) {
      toast.error('Failed to fetch citations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const citationData = {
        ...form,
        authors: form.authors.split(',').map(author => author.trim()),
        year: parseInt(form.year),
        volume: form.volume || undefined,
        issue: form.issue || undefined,
        pages: form.pages || undefined,
        doi: form.doi || undefined,
        url: form.url || undefined,
        publisher: form.publisher || undefined,
        location: form.location || undefined
      };

      const url = editingId ? `/api/citations/${editingId}` : '/api/citations';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citationData)
      });

      if (response.ok) {
        toast.success(editingId ? 'Citation updated successfully' : 'Citation created successfully');
        setForm(initialForm);
        setEditingId(null);
        fetchCitations();
      } else {
        toast.error('Failed to save citation');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (citation: Citation) => {
    setForm({
      title: citation.title,
      authors: citation.authors.join(', '),
      year: citation.year.toString(),
      journal: citation.journal || '',
      volume: citation.volume || '',
      issue: citation.issue || '',
      pages: citation.pages || '',
      doi: citation.doi || '',
      url: citation.url || '',
      publisher: citation.publisher || '',
      location: citation.location || '',
      type: citation.type
    });
    setEditingId(citation.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this citation?')) return;

    try {
      const response = await fetch(`/api/citations/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Citation deleted successfully');
        fetchCitations();
      } else {
        toast.error('Failed to delete citation');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const generateCitation = async (citation: Citation, format: string) => {
    try {
      const response = await fetch(`/api/citations/generate?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(citation)
      });

      if (response.ok) {
        const data = await response.json();
        navigator.clipboard.writeText(data.citation);
        toast.success(`${format.toUpperCase()} citation copied to clipboard`);
      }
    } catch (error) {
      toast.error('Failed to generate citation');
    }
  };

  const filteredCitations = citations.filter(citation => {
    const matchesSearch = citation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'ALL' || citation.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'JOURNAL': return <BookOpen className="h-4 w-4" />;
      case 'BOOK': return <BookOpen className="h-4 w-4" />;
      case 'CONFERENCE': return <Users className="h-4 w-4" />;
      case 'THESIS': return <BookOpen className="h-4 w-4" />;
      case 'WEBSITE': return <Calendar className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'JOURNAL': return 'bg-blue-100 text-blue-800';
      case 'BOOK': return 'bg-green-100 text-green-800';
      case 'CONFERENCE': return 'bg-purple-100 text-purple-800';
      case 'THESIS': return 'bg-orange-100 text-orange-800';
      case 'WEBSITE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading citations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Citations Management</h1>
        <p className="text-gray-600">Manage academic citations and references</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Citations</p>
                <p className="text-2xl font-bold text-gray-900">{citations.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Journal Articles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {citations.filter(c => c.type === 'JOURNAL').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Books</p>
                <p className="text-2xl font-bold text-gray-900">
                  {citations.filter(c => c.type === 'BOOK').length}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conference Papers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {citations.filter(c => c.type === 'CONFERENCE').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Citation Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Edit Citation' : 'Add New Citation'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={form.type} onValueChange={(value: any) => setForm({ ...form, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JOURNAL">Journal Article</SelectItem>
                    <SelectItem value="BOOK">Book</SelectItem>
                    <SelectItem value="CONFERENCE">Conference Paper</SelectItem>
                    <SelectItem value="THESIS">Thesis</SelectItem>
                    <SelectItem value="WEBSITE">Website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authors">Authors (comma-separated) *</Label>
                <Input
                  id="authors"
                  value={form.authors}
                  onChange={(e) => setForm({ ...form, authors: e.target.value })}
                  placeholder="Smith, J., Doe, A."
                  required
                />
              </div>
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="journal">Journal/Publisher</Label>
                <Input
                  id="journal"
                  value={form.journal}
                  onChange={(e) => setForm({ ...form, journal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="volume">Volume</Label>
                <Input
                  id="volume"
                  value={form.volume}
                  onChange={(e) => setForm({ ...form, volume: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="issue">Issue</Label>
                <Input
                  id="issue"
                  value={form.issue}
                  onChange={(e) => setForm({ ...form, issue: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  value={form.pages}
                  onChange={(e) => setForm({ ...form, pages: e.target.value })}
                  placeholder="123-145"
                />
              </div>
              <div>
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={form.doi}
                  onChange={(e) => setForm({ ...form, doi: e.target.value })}
                  placeholder="10.1000/xyz123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Citation' : 'Add Citation'}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(initialForm);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search citations by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="JOURNAL">Journal Articles</SelectItem>
            <SelectItem value="BOOK">Books</SelectItem>
            <SelectItem value="CONFERENCE">Conference Papers</SelectItem>
            <SelectItem value="THESIS">Theses</SelectItem>
            <SelectItem value="WEBSITE">Websites</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Citations List */}
      <div className="space-y-4">
        {filteredCitations.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No citations found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCitations.map((citation) => (
            <Card key={citation.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(citation.type)}>
                        <span className="flex items-center gap-1">
                          {getTypeIcon(citation.type)}
                          {citation.type}
                        </span>
                      </Badge>
                      <span className="text-sm text-gray-500">({citation.year})</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{citation.title}</h3>
                    <p className="text-gray-600 mb-2">
                      <strong>Authors:</strong> {citation.authors.join(', ')}
                    </p>
                    {citation.journal && (
                      <p className="text-gray-600 mb-2">
                        <strong>Journal:</strong> {citation.journal}
                        {citation.volume && `, Vol. ${citation.volume}`}
                        {citation.issue && `, Issue ${citation.issue}`}
                        {citation.pages && `, pp. ${citation.pages}`}
                      </p>
                    )}
                    {citation.doi && (
                      <p className="text-gray-600 mb-2">
                        <strong>DOI:</strong> {citation.doi}
                      </p>
                    )}
                    {citation.url && (
                      <p className="text-gray-600 mb-2">
                        <strong>URL:</strong> 
                        <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {citation.url}
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateCitation(citation, 'apa')}
                        title="Copy APA citation"
                      >
                        <Copy className="h-4 w-4" />
                        APA
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateCitation(citation, 'mla')}
                        title="Copy MLA citation"
                      >
                        <Copy className="h-4 w-4" />
                        MLA
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(citation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(citation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
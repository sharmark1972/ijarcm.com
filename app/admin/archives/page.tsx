'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Calendar, Archive, BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface Archive {
  id: string;
  title: string;
  description?: string;
  volume: string;
  issue: string;
  year: number;
  publishedDate: string;
  coverImageUrl?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  archivePapers?: Array<{
    paper: {
      id: string;
      title: string;
      abstract?: string;
      keywords?: string;
      filePath?: string;
      publishedAt?: string;
    };
  }>;
}

interface ArchiveFormData {
  title: string;
  description: string;
  volume: string;
  issue: string;
  year: string;
  publishedDate: string;
  coverImageUrl: string;
  isPublished: boolean;
}

function ArchiveForm({ 
  archive, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  archive?: Archive; 
  onSubmit: (data: ArchiveFormData) => void; 
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ArchiveFormData>({
    title: archive?.title || '',
    description: archive?.description || '',
    volume: archive?.volume || '',
    issue: archive?.issue || '',
    year: archive?.year?.toString() || new Date().getFullYear().toString(),
    publishedDate: archive?.publishedDate ? new Date(archive.publishedDate).toISOString().split('T')[0] : '',
    coverImageUrl: archive?.coverImageUrl || '',
    isPublished: archive?.isPublished ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter archive title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter archive description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="volume">Volume *</Label>
          <Input
            id="volume"
            value={formData.volume}
            onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
            placeholder="Volume number"
            required
          />
        </div>
        <div>
          <Label htmlFor="issue">Issue *</Label>
          <Input
            id="issue"
            value={formData.issue}
            onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
            placeholder="Issue number"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
            placeholder="Year"
            min="1900"
            max={new Date().getFullYear() + 1}
            required
          />
        </div>
        <div>
          <Label htmlFor="publishedDate">Published Date *</Label>
          <Input
            id="publishedDate"
            type="date"
            value={formData.publishedDate}
            onChange={(e) => setFormData({ ...formData, publishedDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="coverImageUrl">Cover Image URL</Label>
        <Input
          id="coverImageUrl"
          type="url"
          value={formData.coverImageUrl}
          onChange={(e) => setFormData({ ...formData, coverImageUrl: e.target.value })}
          placeholder="https://example.com/cover.jpg"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
        />
        <Label htmlFor="isPublished">Published</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : archive ? 'Update Archive' : 'Create Archive'}
        </Button>
      </div>
    </form>
  );
}

function ArchiveCard({ archive, onEdit, onDelete }: { 
  archive: Archive; 
  onEdit: (archive: Archive) => void; 
  onDelete: (id: string) => void; 
}) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {archive.title}
            </CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Badge variant="outline">Vol. {archive.volume}</Badge>
              <Badge variant="outline">Issue {archive.issue}</Badge>
              <Badge variant="outline">{archive.year}</Badge>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(archive.publishedDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={archive.isPublished ? 'default' : 'secondary'}>
              {archive.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <Badge variant="outline">
              {archive.archivePapers?.length || 0} papers
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {archive.description && (
          <p className="text-gray-700 mb-4 line-clamp-2">
            {archive.description}
          </p>
        )}
        
        {archive.coverImageUrl && (
          <div className="mb-4">
            <Image
              src={archive.coverImageUrl}
              alt={archive.title}
              width={400}
              height={128}
              className="w-full h-32 object-cover rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Created: {new Date(archive.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(archive)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Archive</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{archive.title}&quot;? This action cannot be undone and will also remove all associated papers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(archive.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArchiveSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full h-32 mb-4 rounded-lg" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminArchivesPage() {
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingArchive, setEditingArchive] = useState<Archive | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchArchives();
  }, []);

  const fetchArchives = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/archives');
      if (!response.ok) {
        throw new Error('Failed to fetch archives');
      }
      const data = await response.json();
      setArchives(data);
    } catch (err) {
      toast.error('Failed to fetch archives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArchive = async (formData: ArchiveFormData) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          volume: formData.volume,
          issue: formData.issue,
          year: parseInt(formData.year),
          publishedDate: formData.publishedDate,
          coverImageUrl: formData.coverImageUrl || undefined,
          isPublished: formData.isPublished,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create archive');
      }

      toast.success('Archive created successfully');
      setShowCreateDialog(false);
      fetchArchives();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to create archive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateArchive = async (formData: ArchiveFormData) => {
    if (!editingArchive) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/archives?id=${editingArchive.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          volume: formData.volume,
          issue: formData.issue,
          year: parseInt(formData.year),
          publishedDate: formData.publishedDate,
          coverImageUrl: formData.coverImageUrl || undefined,
          isPublished: formData.isPublished,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update archive');
      }

      toast.success('Archive updated successfully');
      setEditingArchive(null);
      fetchArchives();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to update archive');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArchive = async (id: string) => {
    try {
      const response = await fetch(`/api/archives?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete archive');
      }

      toast.success('Archive deleted successfully');
      fetchArchives();
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to delete archive');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Archives</h1>
            <p className="text-gray-600 mt-2">Create and manage journal archives and issues</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Archive
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Archive</DialogTitle>
              </DialogHeader>
              <ArchiveForm
                onSubmit={handleCreateArchive}
                onCancel={() => setShowCreateDialog(false)}
                loading={submitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Archive className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Archives</p>
                    <p className="text-2xl font-bold text-gray-900">{archives.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <BookOpen className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published Archives</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {archives.filter(a => a.isPublished).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Papers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {archives.reduce((sum, archive) => sum + (archive.archivePapers?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Latest Volume</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {archives.length > 0 ? Math.max(...archives.map(a => parseInt(a.volume) || 0)) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Archives Grid */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <ArchiveSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {archives.map((archive) => (
              <ArchiveCard
                key={archive.id}
                archive={archive}
                onEdit={setEditingArchive}
                onDelete={handleDeleteArchive}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && archives.length === 0 && (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Archives Found
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first archive.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Archive
            </Button>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingArchive} onOpenChange={() => setEditingArchive(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Archive</DialogTitle>
            </DialogHeader>
            {editingArchive && (
              <ArchiveForm
                archive={editingArchive}
                onSubmit={handleUpdateArchive}
                onCancel={() => setEditingArchive(null)}
                loading={submitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
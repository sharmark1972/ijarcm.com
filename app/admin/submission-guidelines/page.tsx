'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, FileText, BookOpen, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface SubmissionGuideline {
  id: string;
  title: string;
  category: 'GENERAL' | 'FORMATTING' | 'SUBMISSION_PROCESS' | 'REVIEW_PROCESS' | 'PUBLICATION';
  content: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GuidelineFormData {
  title: string;
  category: string;
  content: string;
  displayOrder: string;
  isActive: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: 'General Guidelines' },
  { value: 'FORMATTING', label: 'Formatting Requirements' },
  { value: 'SUBMISSION_PROCESS', label: 'Submission Process' },
  { value: 'REVIEW_PROCESS', label: 'Review Process' },
  { value: 'PUBLICATION', label: 'Publication Guidelines' },
];

function GuidelineForm({ 
  guideline, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  guideline?: SubmissionGuideline; 
  onSubmit: (data: GuidelineFormData) => void; 
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<GuidelineFormData>({
    title: guideline?.title || '',
    category: guideline?.category || '',
    content: guideline?.content || '',
    displayOrder: guideline?.displayOrder?.toString() || '0',
    isActive: guideline?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter guideline title"
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Enter guideline content (supports Markdown)"
          rows={8}
          required
        />
      </div>

      <div>
        <Label htmlFor="displayOrder">Display Order</Label>
        <Input
          id="displayOrder"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
          placeholder="Enter display order (0 = first)"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : guideline ? 'Update Guideline' : 'Create Guideline'}
        </Button>
      </div>
    </form>
  );
}

function GuidelineCard({ guideline, onEdit, onDelete }: { 
  guideline: SubmissionGuideline; 
  onEdit: (guideline: SubmissionGuideline) => void; 
  onDelete: (id: string) => void; 
}) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'GENERAL': return 'bg-blue-100 text-blue-800';
      case 'FORMATTING': return 'bg-green-100 text-green-800';
      case 'SUBMISSION_PROCESS': return 'bg-purple-100 text-purple-800';
      case 'REVIEW_PROCESS': return 'bg-orange-100 text-orange-800';
      case 'PUBLICATION': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_OPTIONS.find(opt => opt.value === category)?.label || category;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'GENERAL': return <FileText className="w-4 h-4" />;
      case 'FORMATTING': return <BookOpen className="w-4 h-4" />;
      case 'SUBMISSION_PROCESS': return <Users className="w-4 h-4" />;
      case 'REVIEW_PROCESS': return <CheckCircle className="w-4 h-4" />;
      case 'PUBLICATION': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              {getCategoryIcon(guideline.category)}
              <Badge className={getCategoryColor(guideline.category)}>
                {getCategoryLabel(guideline.category)}
              </Badge>
            </div>
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {guideline.title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={guideline.isActive ? 'default' : 'secondary'}>
              {guideline.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">
              Order: {guideline.displayOrder}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-gray-700 line-clamp-3">
            {guideline.content.length > 200 
              ? `${guideline.content.substring(0, 200)}...` 
              : guideline.content
            }
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Updated: {new Date(guideline.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(guideline)}
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
                  <AlertDialogTitle>Delete Guideline</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{guideline.title}&quot;? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(guideline.id)}>
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

function GuidelineSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-6 w-48 mb-2" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminSubmissionGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<SubmissionGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingGuideline, setEditingGuideline] = useState<SubmissionGuideline | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submission-guidelines');
      if (!response.ok) {
        throw new Error('Failed to fetch guidelines');
      }
      const data = await response.json();
      setGuidelines(data);
    } catch (err) {
      toast.error('Failed to fetch submission guidelines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGuideline = async (formData: GuidelineFormData) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/submission-guidelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          content: formData.content,
          displayOrder: parseInt(formData.displayOrder) || 0,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create guideline');
      }

      toast.success('Submission guideline created successfully');
      setShowCreateDialog(false);
      fetchGuidelines();
    } catch (err) {
      toast.error('Failed to create submission guideline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGuideline = async (formData: GuidelineFormData) => {
    if (!editingGuideline) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/submission-guidelines', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingGuideline.id,
          title: formData.title,
          category: formData.category,
          content: formData.content,
          displayOrder: parseInt(formData.displayOrder) || 0,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update guideline');
      }

      toast.success('Submission guideline updated successfully');
      setEditingGuideline(null);
      fetchGuidelines();
    } catch (err) {
      toast.error('Failed to update submission guideline');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGuideline = async (id: string) => {
    try {
      const response = await fetch('/api/submission-guidelines', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete guideline');
      }

      toast.success('Submission guideline deleted successfully');
      fetchGuidelines();
    } catch (err) {
      toast.error('Failed to delete submission guideline');
    }
  };

  const filteredGuidelines = selectedCategory === 'ALL' 
    ? guidelines 
    : guidelines.filter(g => g.category === selectedCategory);

  const guidelinesByCategory = guidelines.reduce((acc, guideline) => {
    if (!acc[guideline.category]) {
      acc[guideline.category] = [];
    }
    acc[guideline.category].push(guideline);
    return acc;
  }, {} as Record<string, SubmissionGuideline[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Submission Guidelines</h1>
          <p className="text-gray-600">Create and manage submission guidelines for authors</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Guideline
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Submission Guideline</DialogTitle>
            </DialogHeader>
            <GuidelineForm
              onSubmit={handleCreateGuideline}
              onCancel={() => setShowCreateDialog(false)}
              loading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Guidelines</p>
                  <p className="text-2xl font-bold text-gray-900">{guidelines.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Guidelines</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {guidelines.filter(g => g.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(guidelinesByCategory).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Most Popular</p>
                  <p className="text-sm font-bold text-gray-900">
                    {Object.entries(guidelinesByCategory)
                      .sort(([,a], [,b]) => b.length - a.length)[0]?.[0] || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex items-center space-x-4">
        <Label>Filter by Category:</Label>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Guidelines Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <GuidelineSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGuidelines
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((guideline) => (
              <GuidelineCard
                key={guideline.id}
                guideline={guideline}
                onEdit={setEditingGuideline}
                onDelete={handleDeleteGuideline}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredGuidelines.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedCategory === 'ALL' ? 'No Submission Guidelines Found' : `No Guidelines in ${CATEGORY_OPTIONS.find(c => c.value === selectedCategory)?.label}`}
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === 'ALL' 
              ? 'Get started by adding your first submission guideline.' 
              : 'Try selecting a different category or add a new guideline.'
            }
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Guideline
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingGuideline} onOpenChange={() => setEditingGuideline(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Submission Guideline</DialogTitle>
          </DialogHeader>
          {editingGuideline && (
            <GuidelineForm
              guideline={editingGuideline}
              onSubmit={handleUpdateGuideline}
              onCancel={() => setEditingGuideline(null)}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, CheckCircle, Clock, Users, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PeerReviewProcess {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedDuration: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProcessFormData {
  stepNumber: string;
  title: string;
  description: string;
  estimatedDuration: string;
  isActive: boolean;
}

function ProcessForm({ 
  process, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  process?: PeerReviewProcess; 
  onSubmit: (data: ProcessFormData) => void; 
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ProcessFormData>({
    stepNumber: process?.stepNumber?.toString() || '1',
    title: process?.title || '',
    description: process?.description || '',
    estimatedDuration: process?.estimatedDuration || '',
    isActive: process?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div>
        <Label htmlFor="stepNumber">Step Number *</Label>
        <Input
          id="stepNumber"
          type="number"
          min="1"
          value={formData.stepNumber}
          onChange={(e) => setFormData({ ...formData, stepNumber: e.target.value })}
          placeholder="Enter step number"
          required
        />
      </div>

      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter step title"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter step description"
          rows={6}
          required
        />
      </div>

      <div>
        <Label htmlFor="estimatedDuration">Estimated Duration</Label>
        <Input
          id="estimatedDuration"
          value={formData.estimatedDuration}
          onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
          placeholder="e.g., 2-3 weeks, 5-7 days"
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
          {loading ? 'Saving...' : process ? 'Update Step' : 'Create Step'}
        </Button>
      </div>
    </form>
  );
}

function ProcessCard({ process, onEdit, onDelete, isLast }: { 
  process: PeerReviewProcess; 
  onEdit: (process: PeerReviewProcess) => void; 
  onDelete: (id: string) => void;
  isLast: boolean;
}) {
  return (
    <div className="relative">
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-semibold">{process.stepNumber}</span>
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                  {process.title}
                </CardTitle>
                {process.estimatedDuration && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    {process.estimatedDuration}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={process.isActive ? 'default' : 'secondary'}>
                {process.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {process.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Updated: {new Date(process.updatedAt).toLocaleDateString()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(process)}
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
                    <AlertDialogTitle>Delete Process Step</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{process.title}&quot;? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(process.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Arrow connector */}
      {!isLast && (
        <div className="flex justify-center my-4">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
}

function ProcessSkeleton({ isLast }: { isLast: boolean }) {
  return (
    <div className="relative">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
              </div>
            </div>
            <Skeleton className="h-6 w-16" />
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
      
      {!isLast && (
        <div className="flex justify-center my-4">
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      )}
    </div>
  );
}

export default function AdminPeerReviewProcessPage() {
  const [processes, setProcesses] = useState<PeerReviewProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingProcess, setEditingProcess] = useState<PeerReviewProcess | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/peer-review-process');
      if (!response.ok) {
        throw new Error('Failed to fetch processes');
      }
      const data = await response.json();
      setProcesses(data);
    } catch (err) {
      toast.error('Failed to fetch peer review processes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProcess = async (formData: ProcessFormData) => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/peer-review-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stepNumber: parseInt(formData.stepNumber),
          title: formData.title,
          description: formData.description,
          estimatedDuration: formData.estimatedDuration || undefined,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create process step');
      }

      toast.success('Peer review process step created successfully');
      setShowCreateDialog(false);
      fetchProcesses();
    } catch (err) {
      toast.error('Failed to create peer review process step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProcess = async (formData: ProcessFormData) => {
    if (!editingProcess) return;

    try {
      setSubmitting(true);
      const response = await fetch('/api/peer-review-process', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingProcess.id,
          stepNumber: parseInt(formData.stepNumber),
          title: formData.title,
          description: formData.description,
          estimatedDuration: formData.estimatedDuration || undefined,
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update process step');
      }

      toast.success('Peer review process step updated successfully');
      setEditingProcess(null);
      fetchProcesses();
    } catch (err) {
      toast.error('Failed to update peer review process step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    try {
      const response = await fetch('/api/peer-review-process', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete process step');
      }

      toast.success('Peer review process step deleted successfully');
      fetchProcesses();
    } catch (err) {
      toast.error('Failed to delete peer review process step');
    }
  };

  const sortedProcesses = processes.sort((a, b) => a.stepNumber - b.stepNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Peer Review Process</h1>
          <p className="text-gray-600">Define and manage the peer review workflow steps</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Process Step</DialogTitle>
            </DialogHeader>
            <ProcessForm
              onSubmit={handleCreateProcess}
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
                <CheckCircle className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Steps</p>
                  <p className="text-2xl font-bold text-gray-900">{processes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Steps</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {processes.filter(p => p.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-sm font-bold text-gray-900">
                    {processes.filter(p => p.estimatedDuration).length > 0 ? 'Varies' : 'Not Set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900">
                    {processes.length > 0 
                      ? new Date(Math.max(...processes.map(p => new Date(p.updatedAt).getTime()))).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Process Flow */}
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <ProcessSkeleton key={i} isLast={i === 3} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedProcesses.map((process, index) => (
              <ProcessCard
                key={process.id}
                process={process}
                onEdit={setEditingProcess}
                onDelete={handleDeleteProcess}
                isLast={index === sortedProcesses.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && processes.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Process Steps Found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first peer review process step.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Step
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProcess} onOpenChange={() => setEditingProcess(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Process Step</DialogTitle>
          </DialogHeader>
          {editingProcess && (
            <ProcessForm
              process={editingProcess}
              onSubmit={handleUpdateProcess}
              onCancel={() => setEditingProcess(null)}
              loading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
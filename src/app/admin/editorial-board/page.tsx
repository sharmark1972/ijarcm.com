'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Users, Award, Mail, FileText, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface EditorialBoardMember {
  id: string;
  name: string;
  position: 'EDITOR_IN_CHIEF' | 'ASSOCIATE_EDITOR' | 'SECTION_EDITOR' | 'MEMBER' | 'ADVISORY_BOARD' | 'INTERNATIONAL_BOARD_MEMBER';
  affiliation?: string;
  institution?: string;
  email?: string;
  bio?: string;
  expertise: string;
  imageUrl?: string;
  websiteUrl?: string;
  resumeUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MemberFormData {
  name: string;
  position: 'EDITOR_IN_CHIEF' | 'ASSOCIATE_EDITOR' | 'SECTION_EDITOR' | 'MEMBER' | 'ADVISORY_BOARD' | 'INTERNATIONAL_BOARD_MEMBER';
  expertise: string;
  resumeUrl: string;
  imageUrl: string;
  email: string;
  institution: string;
  isActive: boolean;
  displayOrder: string;
}

const POSITION_OPTIONS = [
  { value: 'EDITOR_IN_CHIEF', label: 'Editor-in-Chief' },
  { value: 'ASSOCIATE_EDITOR', label: 'Associate Editor' },
  { value: 'SECTION_EDITOR', label: 'Section Editor' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'ADVISORY_BOARD', label: 'Advisory Board' },
  { value: 'INTERNATIONAL_BOARD_MEMBER', label: 'International Board Member' },
];

function MemberForm({ 
  member, 
  onSubmit, 
  onCancel, 
  loading 
}: { 
  member?: EditorialBoardMember; 
  onSubmit: (data: MemberFormData) => void; 
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<MemberFormData>({
    name: member?.name || '',
    position: member?.position || 'MEMBER',
    expertise: member?.expertise || '',
    resumeUrl: member?.resumeUrl || '',
    imageUrl: member?.imageUrl || '',
    email: member?.email || '',
    institution: member?.institution || '',
    isActive: member?.isActive ?? true,
    displayOrder: member?.displayOrder?.toString() || '0',
  });

  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploadingResume(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', 'resume');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload resume');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, resumeUrl: data.url }));
      toast.success('Resume uploaded successfully');
    } catch {
      toast.error('Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    setUploadingImage(true);
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('type', 'image');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Image uploaded successfully');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const [imageError, setImageError] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto bg-white p-6 rounded-lg shadow-md">
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter member name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          style={{ backgroundColor: '#ffffff', color: '#111827', borderColor: '#d1d5db' }}
          required
        />
      </div>

      <div>
        <Label htmlFor="position" className="text-sm font-medium text-gray-700">Position *</Label>
        <select
          id="position"
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value as MemberFormData['position'] })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          required
        >
          {POSITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="expertise" className="text-sm font-medium text-gray-700">Areas of Expertise *</Label>
        <Textarea
          id="expertise"
          value={formData.expertise}
          onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
          placeholder="Enter areas of expertise (comma-separated)"
          rows={2}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">Profile Picture</Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="Enter image URL or upload below"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <div className="relative">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingImage}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploadingImage}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingImage ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
          {formData.imageUrl && !imageError && (
            <div className="flex items-center space-x-3">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={formData.imageUrl}
                  alt="Profile preview"
                  fill
                  className="object-cover"
                  sizes="64px"
                  onError={() => setImageError(true)}
                  unoptimized={formData.imageUrl.startsWith('http') || formData.imageUrl.startsWith('/uploads/')}
                />
              </div>
              <div className="text-sm text-blue-600">
                <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  View Full Image
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="resumeUrl" className="text-sm font-medium text-gray-700">Resume PDF *</Label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              id="resumeUrl"
              value={formData.resumeUrl}
              onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
              placeholder="Enter resume PDF URL"
              required
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
            />
            <div className="relative">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploadingResume}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploadingResume}>
                <Upload className="w-4 h-4 mr-2" />
                {uploadingResume ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
          {formData.resumeUrl && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <FileText className="w-4 h-4" />
              <a href={formData.resumeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                View Resume PDF
              </a>
            </div>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      <div>
        <Label htmlFor="institution" className="text-sm font-medium text-gray-700">Affiliated University/Institution</Label>
        <Input
          id="institution"
          value={formData.institution}
          onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
          placeholder="Enter affiliated university or institution"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
      </div>

      <div>
        <Label htmlFor="displayOrder" className="text-sm font-medium text-gray-700">Display Order</Label>
        <Input
          id="displayOrder"
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
          placeholder="Enter display order (0 = first)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
        <p className="text-xs text-gray-500 mt-1" style={{ color: '#6b7280' }}>
          Lower numbers appear first (0 = top)
        </p>
      </div>

      <div className="flex items-center space-x-2 py-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
        />
        <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200 bg-white sticky bottom-0" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
        </Button>
      </div>
    </form>
  );
}

function MemberCard({ member, onEdit, onDelete }: { 
  member: EditorialBoardMember; 
  onEdit: (member: EditorialBoardMember) => void; 
  onDelete: (id: string) => void; 
}) {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'EDITOR_IN_CHIEF': return 'bg-red-100 text-red-800';
      case 'ASSOCIATE_EDITOR': return 'bg-blue-100 text-blue-800';
      case 'SECTION_EDITOR': return 'bg-purple-100 text-purple-800';
      case 'MEMBER': return 'bg-green-100 text-green-800';
      case 'ADVISORY_BOARD': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPositionLabel = (position: string) => {
    return POSITION_OPTIONS.find(opt => opt.value === position)?.label || position;
  };

  const [imageError, setImageError] = useState(false);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {member.imageUrl && !imageError ? (
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={member.imageUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                  onError={() => setImageError(true)}
                  unoptimized={member.imageUrl.startsWith('/uploads/')}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <User className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                {member.name}
              </CardTitle>
              <Badge className={`mb-2 ${getPositionColor(member.position)}`}>
                {getPositionLabel(member.position)}
              </Badge>
              {member.institution && (
                <p className="text-sm text-gray-600">{member.institution}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={member.isActive ? 'default' : 'secondary'}>
              {member.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">
              Order: {member.displayOrder}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {member.email && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Email:</p>
            <a href={`mailto:${member.email}`} className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              {member.email}
            </a>
          </div>
        )}
        
        {member.bio && (
          <p className="text-gray-700 mb-3 line-clamp-2">
            {member.bio}
          </p>
        )}
        
        {member.expertise && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Expertise:</p>
            <p className="text-sm text-gray-700 line-clamp-1">{member.expertise}</p>
          </div>
        )}

        {member.resumeUrl && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">Resume:</p>
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <FileText className="w-4 h-4" />
              <a href={member.resumeUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                View Resume PDF
              </a>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {member.email && (
              <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-800">
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(member)}
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
                  <AlertDialogTitle>Delete Member</AlertDialogTitle>
                  <AlertDialogDescription>
                    {`Are you sure you want to delete "${member.name}"? This action cannot be undone.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(member.id)}>
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

function MemberSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </div>
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
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminEditorialBoardPage() {
  const [members, setMembers] = useState<EditorialBoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingMember, setEditingMember] = useState<EditorialBoardMember | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/editorial-board');
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await response.json();
      setMembers(data);
    } catch {
      toast.error('Failed to fetch editorial board members');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMember = async (formData: MemberFormData) => {
    try {
      setSubmitting(true);

      const response = await fetch('/api/editorial-board', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          position: formData.position,
          expertise: formData.expertise,
          resumeUrl: formData.resumeUrl,
          imageUrl: formData.imageUrl,
          email: formData.email,
          institution: formData.institution,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create member');
      }

      toast.success('Editorial board member created successfully');
      setShowCreateDialog(false);
      fetchMembers();
    } catch {
      toast.error('Failed to create editorial board member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (formData: MemberFormData) => {
    if (!editingMember) return;

    try {
      setSubmitting(true);

      const response = await fetch('/api/editorial-board?id=' + editingMember.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingMember.id,
          name: formData.name,
          position: formData.position,
          expertise: formData.expertise,
          resumeUrl: formData.resumeUrl,
          imageUrl: formData.imageUrl,
          email: formData.email,
          institution: formData.institution,
          isActive: formData.isActive,
          displayOrder: parseInt(formData.displayOrder) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member');
      }

      toast.success('Editorial board member updated successfully');
      setEditingMember(null);
      fetchMembers();
    } catch {
      toast.error('Failed to update editorial board member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const response = await fetch('/api/editorial-board?id=' + id, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete member');
      }

      toast.success('Editorial board member deleted successfully');
      fetchMembers();
    } catch {
      toast.error('Failed to delete editorial board member');
    }
  };

  const membersByPosition = members.reduce((acc, member) => {
    if (!acc[member.position]) {
      acc[member.position] = [];
    }
    acc[member.position].push(member);
    return acc;
  }, {} as Record<string, EditorialBoardMember[]>);

  return (
    <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Editorial Board</h1>
          <p className="text-gray-600">Add and manage editorial board members</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] !bg-white overflow-hidden flex flex-col" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
            <DialogHeader className="!bg-white" style={{ backgroundColor: '#ffffff' }}>
              <DialogTitle className="!text-gray-900" style={{ color: '#111827' }}>
                Add Editorial Board Member
              </DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 px-1 !bg-white" style={{ backgroundColor: '#ffffff' }}>
              <MemberForm
                onSubmit={handleCreateMember}
                onCancel={() => setShowCreateDialog(false)}
                loading={submitting}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{members.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {members.filter(m => m.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Editors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(membersByPosition['EDITOR_IN_CHIEF']?.length || 0) + (membersByPosition['ASSOCIATE_EDITOR']?.length || 0)}
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
                  <p className="text-sm font-medium text-gray-600">Reviewers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {membersByPosition['ADVISORY_BOARD']?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <MemberSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {members
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onEdit={setEditingMember}
                onDelete={handleDeleteMember}
              />
            ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && members.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Editorial Board Members Found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first editorial board member.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] !bg-white overflow-hidden flex flex-col" style={{ backgroundColor: '#ffffff', color: '#111827' }}>
          <DialogHeader className="!bg-white" style={{ backgroundColor: '#ffffff' }}>
            <DialogTitle className="!text-gray-900" style={{ color: '#111827' }}>
              Edit Editorial Board Member
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 px-1 !bg-white" style={{ backgroundColor: '#ffffff' }}>
            {editingMember && (
              <MemberForm
                member={editingMember}
                onSubmit={handleUpdateMember}
                onCancel={() => setEditingMember(null)}
                loading={submitting}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

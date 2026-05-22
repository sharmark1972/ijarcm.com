'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Mail,
  Calendar,
  MapPin,
  FileText,
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle,
  Edit,
  ArrowLeft,
  Ban,
  UserCheck
} from 'lucide-react';

interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  institution?: string;
  bio?: string;
  createdAt: string;
  lastLogin?: string;
  isBanned: boolean;
  paperCount: number;
  reviewCount: number;
  papers: Array<{
    id: string;
    title: string;
    status: string;
    submittedAt: string;
  }>;
  reviews: Array<{
    id: string;
    paperId: string;
    paperTitle: string;
    recommendation: string;
    submittedAt: string;
  }>;
}

export default function UserDetailPage() {
  const { user, isAdmin } = useAuth();
  const params = useParams();
  const userId = params.id as string;
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchUserDetail = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
          } else {
            throw new Error('Failed to fetch user details');
          }
          return;
        }
        const data = await response.json();
        setUserDetail(data.user);
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const handleBanUser = async () => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setUserDetail(prev => prev ? { ...prev, isBanned: true } : null);
      }
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleUnbanUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setUserDetail(prev => prev ? { ...prev, isBanned: false } : null);
      }
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'PEER_REVIEWER':
        return 'bg-green-100 text-green-800';
      case 'AUTHOR':
        return 'bg-purple-100 text-purple-800';
      case 'STUDENT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'accepted':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'under_review':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !userDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested user could not be found.'}</p>
          <Link
            href="/admin/users"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {userDetail.firstName} {userDetail.lastName}
              </h1>
              <p className="text-gray-600">{userDetail.email}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/admin/users/${userId}/edit`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Link>
              {userDetail.isBanned ? (
                <button
                  onClick={handleUnbanUser}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Unban User
                </button>
              ) : (
                <button
                  onClick={handleBanUser}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Ban User
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">User Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Full Name</p>
                    <p className="text-sm text-gray-600">{userDetail.firstName} {userDetail.lastName}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-600">{userDetail.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Role</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userDetail.role)}`}>
                      {userDetail.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                {userDetail.institution && (
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Institution</p>
                      <p className="text-sm text-gray-600">{userDetail.institution}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Joined</p>
                    <p className="text-sm text-gray-600">{formatDate(userDetail.createdAt)}</p>
                  </div>
                </div>
                
                {userDetail.lastLogin && (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Last Login</p>
                      <p className="text-sm text-gray-600">{formatDate(userDetail.lastLogin)}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center">
                  {userDetail.isBanned ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Status</p>
                    <p className={`text-sm ${userDetail.isBanned ? 'text-red-600' : 'text-green-600'}`}>
                      {userDetail.isBanned ? 'Banned' : 'Active'}
                    </p>
                  </div>
                </div>
              </div>
              
              {userDetail.bio && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Bio</h3>
                  <p className="text-sm text-gray-600">{userDetail.bio}</p>
                </div>
              )}
            </div>
            
            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userDetail.paperCount}</p>
                  <p className="text-sm text-gray-600">Papers</p>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{userDetail.reviewCount}</p>
                  <p className="text-sm text-gray-600">Reviews</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Papers and Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Papers */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Papers ({userDetail.papers.length})</h2>
              </div>
              <div className="p-6">
                {userDetail.papers.length > 0 ? (
                  <div className="space-y-4">
                    {userDetail.papers.map((paper) => (
                      <div key={paper.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{paper.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Submitted on {formatDate(paper.submittedAt)}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(paper.status)}`}>
                            {paper.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No papers submitted yet.</p>
                )}
              </div>
            </div>
            
            {/* Reviews */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Reviews ({userDetail.reviews.length})</h2>
              </div>
              <div className="p-6">
                {userDetail.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {userDetail.reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{review.paperTitle}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Review submitted on {formatDate(review.submittedAt)}
                            </p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(review.recommendation)}`}>
                            {review.recommendation.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews completed yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  FileText,
  Eye,
  Download,
  TrendingUp,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Zap,
  Clock,
  UserPlus,
  FilePlus,
  MessageSquare,
  ArrowRight,
  Search,
  DollarSign,
  Award,
  Sparkles
} from 'lucide-react';

interface SearchResult {
  type: 'Paper' | 'User' | 'Conference';
  id: string;
  title?: string;
  name?: string;
  email?: string;
  firstName?: string;
  authors?: string;
}

interface AdminStats {
  overview: {
    totalUsers: number;
    totalPapers: number;
    totalReviews: number;
    totalConferences: number;
    totalDownloads: number;
    activeUsers: number;
    bannedUsers: number;
    warnedUsers: number;
    averageRating: number;
  };
  usersByRole: Record<string, number>;
  papersByStatus: Record<string, number>;
  conferencesByStatus: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user: {
      name: string;
      email?: string;
    };
    metadata?: any;
  }>;
  systemHealth: {
    status: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;SearchResult
    };
  };
}

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch admin stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Search across multiple entities
      const [papersRes, usersRes, conferencesRes] = await Promise.all([
        fetch(`/api/admin/papers?search=${encodeURIComponent(query)}`),
        fetch(`/api/admin/users?search=${encodeURIComponent(query)}`),
        fetch(`/api/admin/conferences?search=${encodeURIComponent(query)}`),
      ]);

      const results: SearchResult[] = [];
      
      if (papersRes.ok) {
        const papers = await papersRes.json();
        results.push(...(papers.papers || []).slice(0, 3).map((p: any) => ({ type: 'Paper' as const, ...p })));
      }
      
      if (usersRes.ok) {
        const users = await usersRes.json();
        results.push(...(users.users || []).slice(0, 3).map((u: any) => ({ type: 'User' as const, ...u })));
      }
      
      if (conferencesRes.ok) {
        const conferences = await conferencesRes.json();
        results.push(...(conferences.conferences || []).slice(0, 3).map((c: any) => ({ type: 'Conference' as const, ...c })));
      }

      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getSearchResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'Paper':
        return `/admin/papers/${result.id}/edit`;
      case 'User':
        return `/admin/users`;
      case 'Conference':
        return `/admin/conferences/${result.id}/edit`;
      default:
        return '/admin';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registration':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'paper_submission':
        return <FilePlus className="h-4 w-4 text-green-600" />;
      case 'review_completed':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'paper_published':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'good':
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'good':
      case 'healthy':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="py-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="animate-fade-in-up">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="mt-3 text-lg text-gray-600">
                  Welcome back, <span className="font-semibold text-blue-600">{user?.firstName}</span>! 
                  Here&apos;s what&apos;s happening in your system.
                </p>
              </div>
              
              {/* Search Bar and Actions */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full lg:w-auto animate-fade-in-up animation-delay-200">
                {/* Global Search */}
                <div className="relative flex-1 lg:w-80">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search papers, users, conferences..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                    />
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto">
                      <div className="p-2">
                        {searchResults.map((result, idx) => (
                          <Link
                            key={idx}
                            href={getSearchResultLink(result)}
                            onClick={() => setShowSearchResults(false)}
                            className="block p-3 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                    result.type === 'Paper' ? 'bg-green-100 text-green-700' :
                                    result.type === 'User' ? 'bg-blue-100 text-blue-700' :
                                    'bg-purple-100 text-purple-700'
                                  }`}>
                                    {result.type}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900">
                                    {result.title || result.name || result.email || result.firstName}
                                  </span>
                                </div>
                                {result.authors && (
                                  <p className="text-xs text-gray-500 mt-1">{result.authors}</p>
                                )}
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 p-2">
                        <button
                          onClick={() => setShowSearchResults(false)}
                          className="w-full text-center text-sm text-gray-500 hover:text-gray-700 py-2"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl bg-white shadow-md ${getSystemHealthColor(stats?.systemHealth?.status || 'good')}`}>
                    {getSystemHealthIcon(stats?.systemHealth?.status || 'good')}
                    <span className="text-sm font-semibold capitalize">
                      System {stats?.systemHealth?.status || 'healthy'}
                    </span>
                  </div>
                  <Link
                    href="/admin/settings"
                    className="group inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats?.overview?.totalUsers?.toLocaleString() || '0'}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1" />
                Active: {stats?.overview?.activeUsers || 0}
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Papers</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats?.overview?.totalPapers || 0}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1" />
                Published: {stats?.papersByStatus?.PUBLISHED || 0}
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Reviews</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats?.overview?.totalReviews || 0}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1" />
                Avg Rating: {stats?.overview?.averageRating || 0}/5
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-300">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Download className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Downloads</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats?.overview?.totalDownloads?.toLocaleString() || '0'}</dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <TrendingUp className="h-4 w-4 mr-1" />
                ↗ 12% increase
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-600 bg-clip-text text-transparent mb-2">
            Quick Actions
          </h2>
          <p className="text-gray-600">Manage your system efficiently with these quick access tools</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">User Management</h3>
            </div>
            <div className="space-y-3">
              <Link
                href="/admin/users"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5 mr-3 text-blue-600" />
                Manage All Users
              </Link>
              <Link
                href="/admin/users?action=add"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="h-5 w-5 mr-3 text-green-600" />
                Add New User
              </Link>
              <Link
                href="/admin/users?filter=banned"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Shield className="h-5 w-5 mr-3 text-red-600" />
                Banned Users
              </Link>
              <Link
                href="/admin/users?filter=warned"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <AlertTriangle className="h-5 w-5 mr-3 text-yellow-600" />
                Warned Users
              </Link>
            </div>
          </div>
          
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-100">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Content Management</h3>
            </div>
            <div className="space-y-3">
              <Link
                href="/admin/papers"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-green-600" />
                Manage Papers
              </Link>
              <Link
                href="/admin/research-papers"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Sparkles className="h-5 w-5 mr-3 text-violet-600" />
                Research Paper Studio
              </Link>
              <Link
                href="/admin/ebooks"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-indigo-600" />
                Manage Ebooks
              </Link>
              <Link
                href="/admin/issues"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-blue-600" />
                Manage Issues
              </Link>
              <Link
                href="/admin/reviews"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Eye className="h-5 w-5 mr-3 text-purple-600" />
                Review Management
              </Link>
              <Link
                href="/admin/conferences"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-3 text-indigo-600" />
                Manage Conferences
              </Link>
              <Link
                href="/admin/analytics"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="h-5 w-5 mr-3 text-yellow-600" />
                View Analytics
              </Link>
              <Link
                href="/admin/fees"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <DollarSign className="h-5 w-5 mr-3 text-green-600" />
                Publication Fees
              </Link>
              <Link
                href="/admin/ads"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Zap className="h-5 w-5 mr-3 text-orange-600" />
                Manage Ads
              </Link>
              <Link
                href="/admin/announcements"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Megaphone className="h-5 w-5 mr-3 text-red-600" />
                Manage Announcements
              </Link>
              <Link
                href="/admin/seo"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Search className="h-5 w-5 mr-3 text-blue-600" />
                SEO Management
              </Link>
              <Link
                href="/admin/citations"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-cyan-600" />
                Manage Citations
              </Link>
              <Link
                href="/admin/editorial-board"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5 mr-3 text-emerald-600" />
                Editorial Board
              </Link>
              <Link
                href="/admin/submission-guidelines"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-teal-600" />
                Submission Guidelines
              </Link>
              <Link
                href="/admin/peer-review-process"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Eye className="h-5 w-5 mr-3 text-violet-600" />
                Peer Review Process
              </Link>
              <Link
                href="/admin/archives"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Calendar className="h-5 w-5 mr-3 text-amber-600" />
                Manage Archives
              </Link>
            </div>
          </div>

          {/* Certificate & Admin Tools */}
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-200">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">Certificates & Tools</h3>
            </div>
            <div className="space-y-3">
              <Link
                href="/admin/certificates/generate"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-colors shadow-md"
              >
                <Shield className="h-5 w-5 mr-3" />
                Generate Certificate
              </Link>
              <Link
                href="/admin/certificates"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5 mr-3 text-amber-600" />
                View All Certificates
              </Link>
              <Link
                href="/admin/impact-factors"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <TrendingUp className="h-5 w-5 mr-3 text-blue-600" />
                Impact Factors
              </Link>
              <Link
                href="/admin/api-keys"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Database className="h-5 w-5 mr-3 text-green-600" />
                API Keys
              </Link>
              <Link
                href="/admin/chief-patrons"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5 mr-3 text-purple-600" />
                Chief Patrons
              </Link>
              <Link
                href="/admin/animations"
                className="w-full flex items-center px-4 py-3 text-left text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Zap className="h-5 w-5 mr-3 text-indigo-600" />
                Animation Settings
              </Link>
            </div>
          </div>

          {/* System Overview */}
          <div className="lg:col-span-2 group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl p-6 border border-gray-100 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up animation-delay-200">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 ml-3">System Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Papers by Status */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Papers by Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Published</span>
                    <span className="text-sm font-medium text-green-600">{stats?.papersByStatus?.PUBLISHED || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Under Review</span>
                    <span className="text-sm font-medium text-yellow-600">{stats?.papersByStatus?.UNDER_REVIEW || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Accepted</span>
                    <span className="text-sm font-medium text-blue-600">{stats?.papersByStatus?.ACCEPTED || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Submitted</span>
                    <span className="text-sm font-medium text-purple-600">{stats?.papersByStatus?.SUBMITTED || 0}</span>
                  </div>
                </div>
              </div>

              {/* Users by Role */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Users by Role</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Students</span>
                    <span className="text-sm font-medium text-blue-600">{stats?.usersByRole?.STUDENT || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Peer Reviewers</span>
                    <span className="text-sm font-medium text-green-600">{stats?.usersByRole?.REVIEWER || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Authors</span>
                    <span className="text-sm font-medium text-purple-600">{stats?.usersByRole?.AUTHOR || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Admins</span>
                    <span className="text-sm font-medium text-red-600">{stats?.usersByRole?.ADMIN || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 animate-fade-in-up animation-delay-300">
          <div className="px-6 py-5 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg mr-3">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <Link
                href="/admin/activity"
                className="group inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 rounded-xl transition-all duration-300"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.recentActivity?.map((activity) => (
              <div key={activity.id} className="p-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-gray-500 space-x-2">
                      <span>{typeof activity.user === 'string' ? activity.user : activity.user?.name || activity.user?.email || 'Unknown User'}</span>
                      <span>•</span>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

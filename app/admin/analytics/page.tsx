'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import {
  TrendingUp,
  Users,
  FileText,
  MessageSquare,
  Download,
  Calendar,
  Award,
  Activity,
  Globe,
  MapPin,
  Eye,
  Monitor,
  ExternalLink,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AnalyticsData {
  timeRange: number;
  userGrowth: { date: string; count: number }[];
  paperSubmissions: { date: string; count: number }[];
  reviewActivity: { date: string; count: number }[];
  downloadActivity: { date: string; count: number }[];
  conferenceStats: Record<string, number>;
  topPapers: {
    id: string;
    title: string;
    status: string;
    submittedAt: string;
    downloadCount: number;
    reviewCount: number;
    submitter: string;
  }[];
  topReviewers: {
    id: string;
    name: string;
    institution: string;
    reviewCount: number;
    averageScore: number;
  }[];
  visitorData: {
    totalVisitors: number;
    uniqueVisitors: number;
    visitorGrowth: { date: string; count: number }[];
    countryStats: {
      country: string;
      countryCode: string;
      count: number;
    }[];
    pageStats: {
      page: string;
      count: number;
    }[];
    userAgentStats: {
      browser: string;
      count: number;
    }[];
    referrerStats: {
      referrer: string;
      count: number;
    }[];
    sessionStats: {
      averageSessionDuration: number;
      bounceRate: number;
      pagesPerSession: number;
    };
  };
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalyticsPage() {
  const { user, isAdmin } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'under_review':
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="mt-2 text-gray-600">Comprehensive system analytics and insights</p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-6">
        {/* Time Series Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">User Registration Growth</h3>
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'New Users']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Paper Submissions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Paper Submissions</h3>
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.paperSubmissions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'Submissions']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Review Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Review Activity</h3>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.reviewActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'Reviews']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Download Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Download Activity</h3>
              <Download className="h-5 w-5 text-orange-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData?.downloadActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value as string)}
                    formatter={(value) => [value, 'Downloads']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Conference Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conference Status</h3>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(analyticsData?.conferenceStats || {}).map(([status, count]) => ({
                      name: status.replace('_', ' ').toUpperCase(),
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {Object.entries(analyticsData?.conferenceStats || {}).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Papers */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Papers</h3>
              <Award className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="space-y-4">
              {analyticsData?.topPapers.slice(0, 5).map((paper, index) => (
                <div key={paper.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900 truncate max-w-md">
                          {paper.title}
                        </h4>
                        <p className="text-sm text-gray-600">by {paper.submitter}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(paper.status)}`}>
                      {paper.status.replace('_', ' ')}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {paper.downloadCount} downloads
                      </div>
                      <div className="text-xs text-gray-600">
                        {paper.reviewCount} reviews
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Reviewers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Reviewers</h3>
            <Activity className="h-5 w-5 text-green-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reviews Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData?.topReviewers.map((reviewer, index) => (
                  <tr key={reviewer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                          #{index + 1}
                        </span>
                        <div className="text-sm font-medium text-gray-900">
                          {reviewer.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {reviewer.institution}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {reviewer.reviewCount} reviews
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{reviewer.averageScore}</span>
                        <span className="text-gray-500 ml-1">/5.0</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visitor Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Visitor Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Visitor Overview</h3>
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analyticsData?.visitorData?.totalVisitors || 0}
                </div>
                <div className="text-sm text-gray-600">Total Visitors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData?.visitorData?.uniqueVisitors || 0}
                </div>
                <div className="text-sm text-gray-600">Unique Visitors</div>
              </div>
            </div>
          </div>

          {/* Session Analytics */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Session Analytics</h3>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg. Session Duration</span>
                <span className="font-medium">
                  {Math.round((analyticsData?.visitorData?.sessionStats?.averageSessionDuration || 0) / 60)}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Bounce Rate</span>
                <span className="font-medium">
                  {Math.round((analyticsData?.visitorData?.sessionStats?.bounceRate || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pages per Session</span>
                <span className="font-medium">
                  {(analyticsData?.visitorData?.sessionStats?.pagesPerSession || 0).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Visitor Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Visitor Growth</h3>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData?.visitorData?.visitorGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Visitors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Countries</h3>
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-3">
              {(analyticsData?.visitorData?.countryStats || []).slice(0, 5).map((country, index) => (
                <div key={country.countryCode} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{country.country}</div>
                      <div className="text-sm text-gray-500">{country.countryCode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{country.count}</div>
                    <div className="text-sm text-gray-500">visitors</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Most Visited Pages</h3>
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {(analyticsData?.visitorData?.pageStats || []).slice(0, 5).map((page, index) => (
                <div key={page.page} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">
                      {index + 1}
                    </div>
                    <div className="font-medium text-gray-900 truncate" title={page.page}>
                      {page.page.length > 30 ? `${page.page.substring(0, 30)}...` : page.page}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{page.count}</div>
                    <div className="text-sm text-gray-500">visits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Browser & Referrer Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Browsers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Browsers</h3>
              <Monitor className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-3">
              {(analyticsData?.visitorData?.userAgentStats || []).slice(0, 5).map((browser, index) => (
                <div key={browser.browser} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-xs font-medium text-purple-600">
                      {index + 1}
                    </div>
                    <div className="font-medium text-gray-900">{browser.browser}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{browser.count}</div>
                    <div className="text-sm text-gray-500">users</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Top Referrers</h3>
              <ExternalLink className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-3">
              {(analyticsData?.visitorData?.referrerStats || []).slice(0, 5).map((referrer, index) => (
                <div key={referrer.referrer} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-medium text-orange-600">
                      {index + 1}
                    </div>
                    <div className="font-medium text-gray-900 truncate" title={referrer.referrer}>
                      {referrer.referrer === 'direct' ? 'Direct Traffic' : 
                       referrer.referrer.length > 25 ? `${referrer.referrer.substring(0, 25)}...` : referrer.referrer}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{referrer.count}</div>
                    <div className="text-sm text-gray-500">visits</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
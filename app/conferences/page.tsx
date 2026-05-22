'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Globe, Clock, Users, ExternalLink, Search, Filter, ChevronDown } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';
import { ConferenceStatus } from '@prisma/client';

interface Conference {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  venue?: string;
  website?: string;
  status: ConferenceStatus;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ConferencesPage() {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchConferences();
  }, []);

  const fetchConferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conferences');
      if (!response.ok) {
        throw new Error('Failed to fetch conferences');
      }
      const data = await response.json();
      setConferences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getStatusColor = (status: ConferenceStatus) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-100 text-blue-800';
      case 'ONGOING':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isUpcoming = (conference: Conference) => {
    const now = new Date();
    const startDate = new Date(conference.startDate);
    return startDate > now || conference.status === 'UPCOMING' || conference.status === 'ONGOING';
  };

  const upcomingConferences = conferences.filter(isUpcoming);
  const pastConferences = conferences.filter(conf => !isUpcoming(conf));

  const displayedConferences = activeTab === 'upcoming' ? upcomingConferences : pastConferences;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">Error Loading Conferences</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={fetchConferences}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="International Live Conferences - IJARCM"
        description="Discover and participate in academic conferences from around the world. Connect with researchers, share knowledge, and advance your field."
        keywords={['academic conferences', 'international conferences', 'research conferences', 'live conferences', 'IJARCM', 'academic events']}
        canonicalUrl="/conferences"
      />
      <WebsiteSchema
        name="IJARCM Conferences"
        url="https://ijrcam.com/conferences"
        description="Discover and participate in academic conferences from around the world"
      />
      
      <div className="bg-white py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Conferences', href: '/conferences' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            International Live Conferences
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover and participate in academic conferences from around the world. 
            Connect with researchers, share knowledge, and advance your field.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Upcoming ({upcomingConferences.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              Past ({pastConferences.length})
            </button>
          </div>
        </div>

        {/* Conferences Grid */}
        {displayedConferences.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} conferences
            </h3>
            <p className="text-gray-600">
              {activeTab === 'upcoming'
                ? 'Check back soon for upcoming conferences.'
                : 'No past conferences to display.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedConferences.map((conference) => (
              <div
                key={conference.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(conference.status)
                      }`}
                    >
                      {conference.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {conference.title}
                  </h3>

                  {/* Description */}
                  {conference.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {conference.description}
                    </p>
                  )}

                  {/* Date */}
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDateRange(conference.startDate, conference.endDate)}
                  </div>

                  {/* Location */}
                  {conference.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {conference.location}
                    </div>
                  )}

                  {/* Venue */}
                  {conference.venue && (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <Clock className="w-4 h-4 mr-2" />
                      {conference.venue}
                    </div>
                  )}

                  {/* Website Link */}
                  {conference.website && (
                    <div className="mt-4">
                      <a
                        href={conference.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
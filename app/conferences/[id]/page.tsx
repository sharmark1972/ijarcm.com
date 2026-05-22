'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, MapPin, Globe, Clock, Users, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ConferenceStatus } from '@prisma/client';
import DynamicSEO from '@/components/DynamicSEO';
import { getEventSchema } from '@/utils/structuredData';
import Breadcrumbs from '@/components/Breadcrumbs';

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

export default function ConferencePage() {
  const params = useParams();
  const conferenceId = params.id as string;
  const [conference, setConference] = useState<Conference | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConference = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conferences/${conferenceId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Conference not found');
        }
        throw new Error('Failed to fetch conference');
      }
      const data = await response.json();
      setConference(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [conferenceId]);

  useEffect(() => {
    if (conferenceId) {
      fetchConference();
    }
  }, [conferenceId, fetchConference]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-2/3 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !conference) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-medium mb-2">
              {error || 'Conference not found'}
            </div>
            <Link
              href="/conferences"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Conferences
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const seoData = {
    title: `${conference.title} - IJARCM Conference`,
    description: conference.description || `Join ${conference.title}, an academic conference organized by IJARCM. ${formatDateRange(conference.startDate, conference.endDate)}${conference.location ? ` in ${conference.location}` : ''}.`,
    keywords: ['conference', 'academic conference', conference.title, 'IJARCM', 'research', conference.location || 'international'],
    canonicalUrl: `/conferences/${conference.id}`
  };

  const eventSchema = getEventSchema({
    id: conference.id,
    title: conference.title,
    description: conference.description || '',
    startDate: conference.startDate,
    endDate: conference.endDate,
    location: conference.location,
    organizer: `${conference.creator.firstName} ${conference.creator.lastName}`
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Conferences', href: '/conferences' },
    { label: conference.title, href: `/conferences/${conference.id}` }
  ];

  return (
    <>
      <DynamicSEO {...seoData} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(eventSchema)
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          
          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/conferences"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Conferences
            </Link>
          </div>

          {/* Conference Header */}
          <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
            <div className="flex justify-between items-start mb-4">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  getStatusColor(conference.status)
                }`}
              >
                {conference.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {conference.title}
            </h1>

            {conference.description && (
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {conference.description}
              </p>
            )}

            {/* Conference Details Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Date & Time */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-gray-900 font-medium mb-2">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Date & Time
                </div>
                <p className="text-gray-700">
                  {formatDateRange(conference.startDate, conference.endDate)}
                </p>
              </div>

              {/* Location */}
              {conference.location && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-900 font-medium mb-2">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    Location
                  </div>
                  <p className="text-gray-700">{conference.location}</p>
                </div>
              )}

              {/* Venue */}
              {conference.venue && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-900 font-medium mb-2">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Venue
                  </div>
                  <p className="text-gray-700">{conference.venue}</p>
                </div>
              )}

              {/* Organizer */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center text-gray-900 font-medium mb-2">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Organizer
                </div>
                <p className="text-gray-700">
                  {conference.creator.firstName} {conference.creator.lastName}
                </p>
              </div>
            </div>

            {/* Website Link */}
            {conference.website && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <a
                  href={conference.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Visit Conference Website
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
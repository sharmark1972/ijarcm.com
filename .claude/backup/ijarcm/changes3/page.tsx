'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  FileText,
  AlertCircle,
  Check
} from 'lucide-react';
import Certificate from '@/components/Certificate';
import { CERTIFICATE_TEMPLATES, CertificateTemplate } from '@/types/certificate';

interface Conference {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  institution?: string;
}

export default function GenerateCertificatePage() {
  const { isAdmin } = useAuth();
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Form state
  const [certificateType, setCertificateType] = useState<'PUBLICATION' | 'CONFERENCE'>('PUBLICATION');
  const [selectedConference, setSelectedConference] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [generateWithoutUser, setGenerateWithoutUser] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [topic, setTopic] = useState('');
  const [prize, setPrize] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>('classic');
  const [conferenceParticipationType, setConferenceParticipationType] = useState<'participation' | 'presentation' | 'both'>('both');

  // Conference hybrid mode
  const [conferenceMode, setConferenceMode] = useState<'select' | 'create'>('select');
  const [newConferenceData, setNewConferenceData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
    videoUrl: '',
  });
  const [isCreatingConference, setIsCreatingConference] = useState(false);

  const [generatedCertificate, setGeneratedCertificate] = useState<{
    certificateNumber: string;
    title: string;
    issuedAt: string;
    type: 'PUBLICATION' | 'PARTICIPATION' | 'REVIEW' | 'AWARD' | 'CONFERENCE';
    conferenceName?: string;
    conferenceDates?: string;
    customDate?: string;
  } | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const certCaptureRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certCaptureRef.current) return;
    setDownloading(true);
    try {
      const certMain = certCaptureRef.current.querySelector('.cert-main') as HTMLDivElement;
      if (!certMain) return;
      const canvas = await html2canvas(certMain, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 1123,
        height: 794,
      });
      const link = document.createElement('a');
      link.download = `certificate-${generatedCertificate?.certificateNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      redirect('/dashboard');
    }
  }, [isAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch conferences
        const conferencesResponse = await fetch('/api/admin/conferences?limit=100');
        if (conferencesResponse.ok) {
          const conferencesData = await conferencesResponse.json();
          setConferences(conferencesData.conferences || []);
        }

        // Fetch users
        const usersResponse = await fetch('/api/admin/users?limit=100');
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const end = new Date(endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return `${start} - ${end}`;
  };

  const handleGenerateCertificate = async () => {
    if (!generateWithoutUser && !selectedUser) {
      alert('Please select a user or enable "Generate without user" option');
      return;
    }

    if (!customName.trim()) {
      alert('Please enter a recipient name');
      return;
    }

    if (certificateType === 'CONFERENCE') {
      if (conferenceMode === 'select' && !selectedConference) {
        alert('Please select a conference for conference certificates');
        return;
      }
      if (conferenceMode === 'create') {
        if (!newConferenceData.title.trim()) { alert('Please enter a conference name'); return; }
        if (!newConferenceData.startDate) { alert('Please enter a start date'); return; }
        if (!newConferenceData.endDate) { alert('Please enter an end date'); return; }
        if (new Date(newConferenceData.startDate) >= new Date(newConferenceData.endDate)) {
          alert('End date must be after start date'); return;
        }
      }
    }

    setGenerating(true);
    try {
      const selectedConferenceData = conferences.find(c => c.id === selectedConference);
      const selectedUserData = users.find(u => u.id === selectedUser);

      let resolvedConferenceName = '';
      let resolvedConferenceDates = '';

      const requestBody: {
        userId?: string;
        type: string;
        authorName: string;
        institution: string;
        conferenceName?: string;
        conferenceDates?: string;
        topic?: string;
        prize?: string;
        customDate?: string;
      } = {
        type: certificateType,
        authorName: customName,
        institution: customInstitution || selectedUserData?.institution || '',
        topic: topic || undefined,
        prize: prize || undefined,
        customDate: customDate || undefined,
      };

      // Only include userId if not generating without user
      if (!generateWithoutUser && selectedUser) {
        requestBody.userId = selectedUser;
      }

      if (certificateType === 'CONFERENCE') {
        if (conferenceMode === 'select') {
          resolvedConferenceName = selectedConferenceData?.title || '';
          resolvedConferenceDates = selectedConferenceData
            ? formatDateRange(selectedConferenceData.startDate, selectedConferenceData.endDate)
            : '';
        } else {
          // Create new conference first
          setIsCreatingConference(true);
          let createdConference;
          try {
            const createRes = await fetch('/api/admin/conferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: newConferenceData.title.trim(),
                description: newConferenceData.description.trim() || undefined,
                startDate: newConferenceData.startDate,
                endDate: newConferenceData.endDate,
                location: newConferenceData.location.trim() || undefined,
                status: newConferenceData.status,
                videoUrl: newConferenceData.videoUrl.trim() || undefined,
              }),
            });
            if (!createRes.ok) {
              const err = await createRes.json();
              alert(err.error || 'Failed to create conference');
              return;
            }
            const createData = await createRes.json();
            createdConference = createData.conference;
          } finally {
            setIsCreatingConference(false);
          }
          resolvedConferenceName = createdConference.title;
          resolvedConferenceDates = formatDateRange(createdConference.startDate, createdConference.endDate);
        }
        requestBody.conferenceName = resolvedConferenceName;
        requestBody.conferenceDates = resolvedConferenceDates;
      } else {
        alert('Publication certificates require a paper ID. This feature will be available soon.');
        return;
      }

      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedCertificate({
          ...data.certificate,
          conferenceName: resolvedConferenceName,
          conferenceDates: resolvedConferenceDates,
        });
        setShowCertificate(true);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
    } finally {
      setGenerating(false);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Generate Custom Certificates</h1>
                <p className="mt-2 text-gray-600">Create custom certificates for conferences and publications</p>
              </div>
              <Link
                href="/admin/certificates"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                View All Certificates
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Certificate Details</h2>

            {/* Grid Layout for Compact Form */}
            <div className="space-y-4">
              {/* Row 1: Certificate Type + Certificate Template */}
              <div className="grid grid-cols-2 gap-4">
                {/* Certificate Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Type
                  </label>
                  <select
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as 'PUBLICATION' | 'CONFERENCE')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PUBLICATION">Publication Certificate</option>
                    <option value="CONFERENCE">Conference Certificate</option>
                  </select>
                </div>

                {/* Certificate Template Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Template
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as CertificateTemplate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CERTIFICATE_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Buttons - Full Width */}
              <div className="grid grid-cols-3 gap-2">
                {CERTIFICATE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? template.id === 'classic'
                          ? 'border-amber-500 bg-amber-50'
                          : template.id === 'modern'
                          ? 'border-sky-500 bg-sky-50'
                          : 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`h-8 rounded ${
                        template.id === 'classic'
                          ? 'bg-gradient-to-r from-amber-200 to-amber-300'
                          : template.id === 'modern'
                          ? 'bg-gradient-to-r from-sky-200 to-sky-300'
                          : 'bg-gradient-to-r from-emerald-200 to-emerald-300'
                      }`}
                    />
                    <p className="text-xs font-medium mt-1 text-gray-600">{template.name}</p>
                  </button>
                ))}
              </div>

              {/* Conference Selection — Hybrid */}
              {certificateType === 'CONFERENCE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conference
                </label>

                {/* Toggle */}
                <div className="flex rounded-md border border-gray-300 overflow-hidden mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConferenceMode('select');
                      setNewConferenceData({ title: '', description: '', startDate: '', endDate: '', location: '', status: 'UPCOMING', videoUrl: '' });
                    }}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                      conferenceMode === 'select'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConferenceMode('create');
                      setSelectedConference('');
                    }}
                    className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                      conferenceMode === 'create'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    + Create New
                  </button>
                </div>

                {/* Select Existing mode */}
                {conferenceMode === 'select' && (
                  <>
                    <select
                      value={selectedConference}
                      onChange={(e) => setSelectedConference(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a conference...</option>
                      {conferences.map((conference) => (
                        <option key={conference.id} value={conference.id}>
                          {conference.title} ({new Date(conference.startDate).getFullYear()})
                        </option>
                      ))}
                    </select>

                    {/* Read-only details when conference selected */}
                    {selectedConference && (() => {
                      const conf = conferences.find(c => c.id === selectedConference);
                      if (!conf) return null;
                      return (
                        <div className="mt-3 border border-gray-200 rounded-md bg-gray-50 p-3 space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Conference Name</p>
                            <p className="text-sm text-gray-800 font-medium">{conf.title}</p>
                          </div>
                          {conf.description && (
                            <div>
                              <p className="text-xs text-gray-500">Description</p>
                              <p className="text-sm text-gray-700">{conf.description}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="text-sm text-gray-700">{new Date(conf.startDate).toLocaleDateString('en-IN')}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">End Date</p>
                              <p className="text-sm text-gray-700">{new Date(conf.endDate).toLocaleDateString('en-IN')}</p>
                            </div>
                          </div>
                          {conf.location && (
                            <div>
                              <p className="text-xs text-gray-500">Location</p>
                              <p className="text-sm text-gray-700">{conf.location}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${
                              conf.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                              conf.status === 'ONGOING' ? 'bg-green-100 text-green-700' :
                              conf.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                              'bg-red-100 text-red-700'
                            }`}>{conf.status}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}

                {/* Create New mode */}
                {conferenceMode === 'create' && (
                  <div className="border border-blue-200 rounded-md bg-blue-50/30 p-3 space-y-2">
                    {/* Row 1: Conference Name + Location */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Conference Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newConferenceData.title}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter conference name"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={newConferenceData.location}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="Enter location or 'Online'"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newConferenceData.description}
                        onChange={(e) => setNewConferenceData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter conference description"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
                      />
                    </div>

                    {/* Row 3: Start Date + End Date */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newConferenceData.startDate}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, startDate: e.target.value }))}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={newConferenceData.endDate}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, endDate: e.target.value }))}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>

                    {/* Row 4: Status + Video URL */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={newConferenceData.status}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, status: e.target.value as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' }))}
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        >
                          <option value="UPCOMING">Upcoming</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Video URL</label>
                        <input
                          type="url"
                          value={newConferenceData.videoUrl}
                          onChange={(e) => setNewConferenceData(prev => ({ ...prev, videoUrl: e.target.value }))}
                          placeholder="https://..."
                          className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Generate Without User Option */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={generateWithoutUser}
                  onChange={(e) => {
                    setGenerateWithoutUser(e.target.checked);
                    if (e.target.checked) {
                      setSelectedUser('');
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Generate without user
                  </label>
                  <p className="text-xs text-gray-500">
                    Check to generate without linking to user account
                  </p>
                </div>
              </div>

              {/* User Selection */}
              {!generateWithoutUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Row: Participation Type + Recipient Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {certificateType === 'CONFERENCE' ? (
                      <>Participation Type <span className="text-red-500">*</span></>
                    ) : (
                      'Certificate Variant'
                    )}
                  </label>
                  {certificateType === 'CONFERENCE' ? (
                    <select
                      value={conferenceParticipationType}
                      onChange={(e) => setConferenceParticipationType(e.target.value as 'participation' | 'presentation' | 'both')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="participation">Participation</option>
                      <option value="presentation">Presentation</option>
                      <option value="both">Participation & Presentation</option>
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                      -
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row: Institution + Certificate Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution (Optional)
                  </label>
                  <input
                    type="text"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                    placeholder="Enter institution"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificate Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row: Topic + Prize */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Conference topic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prize/Award (Optional)
                  </label>
                  <input
                    type="text"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    placeholder="Prize details"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Generate Button */}
            </div>

            <button
              onClick={handleGenerateCertificate}
              disabled={generating || isCreatingConference}
              className="w-full mt-6 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingConference ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Conference...
                </>
              ) : generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Certificate...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </button>
          </div>

          {/* Right panel: Instructions OR Generated Certificate */}
          {showCertificate && generatedCertificate ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Certificate Generated</h3>
                    <p className="text-xs text-gray-500">{generatedCertificate.certificateNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Scaled Certificate Preview */}
              <div className="p-4 flex-1 overflow-hidden">
                <div style={{ zoom: 0.43, transformOrigin: 'top left' }}>
                  <Certificate
                    certificateNumber={generatedCertificate.certificateNumber}
                    authorName={customName}
                    title={generatedCertificate.title}
                    institution={customInstitution}
                    issuedAt={generatedCertificate.issuedAt}
                    type={generatedCertificate.type}
                    conferenceName={generatedCertificate.conferenceName}
                    conferenceDates={generatedCertificate.conferenceDates}
                    topic={topic}
                    prize={prize}
                    customDate={generatedCertificate.customDate}
                    showDownload={false}
                    isPreview={false}
                    template={selectedTemplate}
                    conferenceParticipationType={conferenceParticipationType}
                  />
                </div>

                {/* Full-size download button outside zoom */}
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: downloading ? '#9ca3af' : 'linear-gradient(135deg, #92400e, #d97706)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    {downloading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                        </svg>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download Certificate as Image
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden full-size cert for html2canvas capture */}
              <div ref={certCaptureRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', pointerEvents: 'none' }}>
                <Certificate
                  certificateNumber={generatedCertificate.certificateNumber}
                  authorName={customName}
                  title={generatedCertificate.title}
                  institution={customInstitution}
                  issuedAt={generatedCertificate.issuedAt}
                  type={generatedCertificate.type}
                  conferenceName={generatedCertificate.conferenceName}
                  conferenceDates={generatedCertificate.conferenceDates}
                  topic={topic}
                  prize={prize}
                  customDate={generatedCertificate.customDate}
                  showDownload={false}
                  isPreview={false}
                  template={selectedTemplate}
                  conferenceParticipationType={conferenceParticipationType}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">1</span>
                  </div>
                  <p className="text-sm text-gray-700">Select the certificate type you want to generate</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <p className="text-sm text-gray-700">For conference certificates, select the specific conference from the dropdown</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">3</span>
                  </div>
                  <p className="text-sm text-gray-700">Choose the recipient user and enter their name as it should appear on the certificate</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">4</span>
                  </div>
                  <p className="text-sm text-gray-700">Optionally add the institution name and click generate to create the certificate</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-yellow-800 mb-1">Important Note:</p>
                    <p className="text-gray-600">Conference certificates are for participation and recognition. Publication certificates are automatically generated when papers are approved and published.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
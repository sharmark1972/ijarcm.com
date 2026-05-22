'use client';

import { useEffect, useState } from 'react';
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

    if (certificateType === 'CONFERENCE' && !selectedConference) {
      alert('Please select a conference for conference certificates');
      return;
    }

    setGenerating(true);
    try {
      const selectedConferenceData = conferences.find(c => c.id === selectedConference);
      const selectedUserData = users.find(u => u.id === selectedUser);

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
        requestBody.conferenceName = selectedConferenceData?.title || '';
        requestBody.conferenceDates = selectedConferenceData 
          ? formatDateRange(selectedConferenceData.startDate, selectedConferenceData.endDate)
          : '';
      } else {
        // For publication certificates, we need a paper ID
        // For now, create a mock certificate or require paper selection
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
          conferenceName: selectedConferenceData?.title,
          conferenceDates: selectedConferenceData 
            ? formatDateRange(selectedConferenceData.startDate, selectedConferenceData.endDate)
            : '',
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
            
            {/* Certificate Type */}
            <div className="mb-6">
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

            {/* Certificate Template */}
            <div className="mb-6">
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
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid grid-cols-3 gap-2">
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
            </div>

            {/* Conference Selection */}
            {certificateType === 'CONFERENCE' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Conference
                </label>
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
              </div>
            )}

            {/* Generate Without User Option */}
            <div className="mb-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={generateWithoutUser}
                  onChange={(e) => {
                    setGenerateWithoutUser(e.target.checked);
                    if (e.target.checked) {
                      setSelectedUser('');
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Generate certificate without user association
                </span>
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Check this to generate a certificate without linking it to a specific user account
              </p>
            </div>

            {/* User Selection */}
            {!generateWithoutUser && (
              <div className="mb-6">
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

            {/* Custom Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter recipient name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Institution */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Institution (Optional)
              </label>
              <input
                type="text"
                value={customInstitution}
                onChange={(e) => setCustomInstitution(e.target.value)}
                placeholder="Enter institution name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Topic Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic (Optional)
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter conference topic or paper subject"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Prize Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize/Award (Optional)
              </label>
              <input
                type="text"
                value={prize}
                onChange={(e) => setPrize(e.target.value)}
                placeholder="Enter prize or award details"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Custom Date Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Date (Optional)
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use current date. Use this to backdate or set a specific issue date.
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Generate Certificate
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Select the certificate type you want to generate
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    For conference certificates, select the specific conference from the dropdown
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Choose the recipient user and enter their name as it should appear on the certificate
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">4</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Optionally add the institution name and click generate to create the certificate
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold text-yellow-800 mb-1">Important Note:</p>
                  <p className="text-gray-600">
                    Conference certificates are for participation and recognition. Publication certificates are automatically generated when papers are approved and published.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Certificate Preview */}
        {showCertificate && generatedCertificate && (
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Generated Certificate</h3>
              <button
                onClick={() => setShowCertificate(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Certificate generated successfully!</span>
              </div>
            </div>

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
              showDownload={true}
              isPreview={false}
              template={selectedTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
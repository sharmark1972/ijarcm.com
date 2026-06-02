'use client';

import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, FileText, AlertCircle, Check } from 'lucide-react';
import Certificate from '@/components/Certificate';
import { CERTIFICATE_TEMPLATES, CertificateTemplate, JournalInfo } from '@/types/certificate';
import ConferenceFields, { createConferenceIfNeeded } from './type-fields/ConferenceFields';
import PublicationFields from './type-fields/PublicationFields';
import type { Journal, User, CertificateTypeValue, TypeFieldsData } from './types';

export default function GenerateCertificatePage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [selectedJournalId, setSelectedJournalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [certificateType, setCertificateType] = useState<CertificateTypeValue>('PUBLICATION');
  const [typeFieldsData, setTypeFieldsData] = useState<TypeFieldsData>({});
  const [selectedUser, setSelectedUser] = useState('');
  const [generateWithoutUser, setGenerateWithoutUser] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customInstitution, setCustomInstitution] = useState('');
  const [topic, setTopic] = useState('');
  const [venue, setVenue] = useState('');
  const [prize, setPrize] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate>('classic');
  const [conferenceParticipationType, setConferenceParticipationType] = useState<'participation' | 'presentation' | 'both'>('both');

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

  const handleDownloadImage = async () => {
    if (!certCaptureRef.current) return;
    setDownloading(true);
    try {
      const certMain = certCaptureRef.current.querySelector('.cert-main') as HTMLDivElement;
      if (!certMain) return;
      const canvas = await html2canvas(certMain, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
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

  const handleDownloadPDF = async () => {
    if (!certCaptureRef.current) return;
    setDownloading(true);
    try {
      const certMain = certCaptureRef.current.querySelector('.cert-main') as HTMLDivElement;
      if (!certMain) return;
      const canvas = await html2canvas(certMain, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: null });
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`certificate-${generatedCertificate?.certificateNumber}.pdf`);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) redirect('/dashboard');
  }, [isAdmin]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersResponse, journalsResponse] = await Promise.all([
          fetch('/api/admin/users?limit=100'),
          fetch('/api/admin/journals'),
        ]);
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setUsers(usersData.users || []);
        }
        if (journalsResponse.ok) {
          const journalsData = await journalsResponse.json();
          const activeJournals: Journal[] = (journalsData.journals || []).filter((j: Journal) => j.isActive);
          setJournals(activeJournals);
          const defaultJournal = activeJournals.find((j: Journal) => j.isDefault);
          if (defaultJournal) setSelectedJournalId(defaultJournal.id);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Reset type-specific data when type changes
  const handleTypeChange = (newType: CertificateTypeValue) => {
    setCertificateType(newType);
    setTypeFieldsData({});
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

    const selectedUserData = users.find(u => u.id === selectedUser);

    const requestBody: Record<string, unknown> = {
      type: certificateType,
      authorName: customName,
      institution: customInstitution || selectedUserData?.institution || '',
      topic: topic || undefined,
      prize: prize || undefined,
      customDate: customDate || undefined,
      journalId: selectedJournalId || undefined,
    };

    if (!generateWithoutUser && selectedUser) {
      requestBody.userId = selectedUser;
    }

    let resolvedConferenceName = '';
    let resolvedConferenceDates = '';

    if (certificateType === 'CONFERENCE') {
      // Check if typeFieldsData already has conferenceName (select mode)
      // or if we need to create (create mode via hidden input)
      if (typeFieldsData.conferenceName) {
        resolvedConferenceName = typeFieldsData.conferenceName;
        resolvedConferenceDates = typeFieldsData.conferenceDates || '';
      } else {
        // create mode — call helper
        setGenerating(true);
        const created = await createConferenceIfNeeded();
        if (!created) { setGenerating(false); return; }
        resolvedConferenceName = created.conferenceName;
        resolvedConferenceDates = created.conferenceDates;
      }
      if (!resolvedConferenceName) {
        alert('Please select or create a conference');
        return;
      }
      requestBody.conferenceName = resolvedConferenceName;
      requestBody.conferenceDates = resolvedConferenceDates;

    } else if (certificateType === 'PUBLICATION') {
      if (!typeFieldsData.paperId) {
        alert('Please select a paper');
        return;
      }
      requestBody.paperId = typeFieldsData.paperId;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

            <div className="space-y-4">
              {/* Row 1: Certificate Type + Template */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Type</label>
                  <select
                    value={certificateType}
                    onChange={(e) => handleTypeChange(e.target.value as CertificateTypeValue)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="PUBLICATION">Publication Certificate</option>
                    <option value="CONFERENCE">Conference Certificate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value as CertificateTemplate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    {CERTIFICATE_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {CERTIFICATE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? template.id === 'classic' ? 'border-amber-500 bg-amber-50'
                          : template.id === 'modern' ? 'border-sky-500 bg-sky-50'
                          : 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`h-8 rounded ${
                      template.id === 'classic' ? 'bg-gradient-to-r from-amber-200 to-amber-300'
                        : template.id === 'modern' ? 'bg-gradient-to-r from-sky-200 to-sky-300'
                        : 'bg-gradient-to-r from-emerald-200 to-emerald-300'
                    }`} />
                    <p className="text-xs font-medium mt-1 text-gray-600">{template.name}</p>
                  </button>
                ))}
              </div>

              {/* Journal Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal / Site <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedJournalId}
                  onChange={(e) => setSelectedJournalId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a journal...</option>
                  {journals.map((journal) => (
                    <option key={journal.id} value={journal.id}>
                      {journal.abbreviation} — {journal.name}
                    </option>
                  ))}
                </select>
                {selectedJournalId && (() => {
                  const j = journals.find(j => j.id === selectedJournalId);
                  if (!j) return null;
                  return (
                    <div className="mt-2 border border-gray-200 rounded-md bg-gray-50 p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
                      {j.issnPrint && <span><span className="font-medium">ISSN Print:</span> {j.issnPrint}</span>}
                      {j.issnOnline && <span><span className="font-medium">ISSN Online:</span> {j.issnOnline}</span>}
                      {j.origin && <span><span className="font-medium">Origin:</span> {j.origin}</span>}
                      {j.website && <span><span className="font-medium">Website:</span> {j.website.replace(/^https?:\/\//, '')}</span>}
                    </div>
                  );
                })()}
              </div>

              {/* Type-specific fields — swappable, no duplicate logic */}
              {certificateType === 'PUBLICATION' && (
                <PublicationFields onChange={setTypeFieldsData} />
              )}
              {certificateType === 'CONFERENCE' && (
                <ConferenceFields onChange={setTypeFieldsData} />
              )}

              {/* Generate Without User */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={generateWithoutUser}
                  onChange={(e) => {
                    setGenerateWithoutUser(e.target.checked);
                    if (e.target.checked) setSelectedUser('');
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700">Generate without user</label>
                  <p className="text-xs text-gray-500">Check to generate without linking to user account</p>
                </div>
              </div>

              {/* User Select */}
              {!generateWithoutUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
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

              {/* Participation Type (Conference only) + Recipient Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {certificateType === 'CONFERENCE' ? <>Participation Type <span className="text-red-500">*</span></> : 'Certificate Variant'}
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
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">-</div>
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

              {/* Institution + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Institution (Optional)</label>
                  <input
                    type="text"
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                    placeholder="Enter institution"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Date (Optional)</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Topic + Venue + Prize */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic (Optional)</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Conference topic"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue (Optional)</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Enter venue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prize/Award (Optional)</label>
                  <input
                    type="text"
                    value={prize}
                    onChange={(e) => setPrize(e.target.value)}
                    placeholder="Prize details"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateCertificate}
              disabled={generating}
              className="w-full mt-6 flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Right panel: Instructions OR Generated Certificate */}
          {showCertificate && generatedCertificate ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Certificate Generated</h3>
                    <p className="text-xs text-gray-500">{generatedCertificate.certificateNumber}</p>
                  </div>
                </div>
                <button onClick={() => setShowCertificate(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>

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
                    venue={venue}
                    prize={prize}
                    customDate={generatedCertificate.customDate}
                    showDownload={false}
                    isPreview={false}
                    template={selectedTemplate}
                    conferenceParticipationType={conferenceParticipationType}
                    journal={journals.find(j => j.id === selectedJournalId) as JournalInfo | undefined}
                  />
                </div>

                <div className="flex justify-center gap-4 mt-3">
                  <button
                    onClick={handleDownloadImage}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: downloading ? '#9ca3af' : 'linear-gradient(135deg, #92400e, #d97706)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    {downloading ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Downloading...</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download as Image</>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: downloading ? '#9ca3af' : 'linear-gradient(135deg, #0f766e, #14b8a6)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    {downloading ? (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Downloading...</>
                    ) : (
                      <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download as PDF</>
                    )}
                  </button>
                </div>
              </div>

              {/* Hidden full-size cert for html2canvas */}
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
                  venue={venue}
                  prize={prize}
                  customDate={generatedCertificate.customDate}
                  showDownload={false}
                  isPreview={false}
                  template={selectedTemplate}
                  conferenceParticipationType={conferenceParticipationType}
                  journal={journals.find(j => j.id === selectedJournalId) as JournalInfo | undefined}
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
                  <p className="text-sm text-gray-700">Select the certificate type — Publication or Conference</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">2</span>
                  </div>
                  <p className="text-sm text-gray-700">For publication: select an issue, then select the paper. For conference: select or create a conference</p>
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
                  <p className="text-sm text-gray-700">Optionally add institution, date, and click Generate</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold text-yellow-800 mb-1">Important Note:</p>
                    <p className="text-gray-600">Only published papers are available for publication certificates. Conference certificates are for participation and recognition.</p>
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

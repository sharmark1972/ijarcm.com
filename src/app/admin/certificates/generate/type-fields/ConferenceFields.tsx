'use client';

import { useEffect, useState } from 'react';
import type { Conference, TypeFieldsData } from '../types';

interface ConferenceFieldsProps {
  onChange: (data: TypeFieldsData) => void;
}

export default function ConferenceFields({ onChange }: ConferenceFieldsProps) {
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);
  const [conferenceMode, setConferenceMode] = useState<'select' | 'create'>('select');
  const [selectedConference, setSelectedConference] = useState('');
  const [isCreatingConference, setIsCreatingConference] = useState(false);
  const [newConferenceData, setNewConferenceData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'UPCOMING' as 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED',
    videoUrl: '',
  });

  useEffect(() => {
    fetch('/api/admin/conferences?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setConferences(data.conferences || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const end = new Date(endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return `${start} - ${end}`;
  };

  const handleConferenceSelect = (id: string) => {
    setSelectedConference(id);
    const conf = conferences.find(c => c.id === id);
    if (conf) {
      onChange({
        conferenceName: conf.title,
        conferenceDates: formatDateRange(conf.startDate, conf.endDate),
        venue: conf.location || '',
      });
    } else {
      onChange({});
    }
  };

  const handleNewConferenceChange = (patch: Partial<typeof newConferenceData>) => {
    const updated = { ...newConferenceData, ...patch };
    setNewConferenceData(updated);
    if (updated.title && updated.startDate && updated.endDate) {
      onChange({
        conferenceName: updated.title,
        conferenceDates: formatDateRange(updated.startDate, updated.endDate),
        venue: updated.location || '',
      });
    }
  };

  // Expose createConference fn via a data attribute trick — parent calls this before POST
  // Instead: parent will call getConferencePayload() exposed via ref pattern is complex,
  // so we keep create logic here and fire onChange with resolved name after creation.
  // Parent checks if conferenceName is set before submitting.

  if (loading) {
    return <div className="py-4 text-sm text-gray-500">Loading conferences...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Conference</label>

      {/* Toggle */}
      <div className="flex rounded-md border border-gray-300 overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => {
            setConferenceMode('select');
            setNewConferenceData({ title: '', description: '', startDate: '', endDate: '', location: '', status: 'UPCOMING', videoUrl: '' });
            onChange({});
          }}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
            conferenceMode === 'select' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Select Existing
        </button>
        <button
          type="button"
          onClick={() => {
            setConferenceMode('create');
            setSelectedConference('');
            onChange({});
          }}
          className={`flex-1 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
            conferenceMode === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          + Create New
        </button>
      </div>

      {/* Select Existing */}
      {conferenceMode === 'select' && (
        <>
          <select
            value={selectedConference}
            onChange={(e) => handleConferenceSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a conference...</option>
            {conferences.map((conference) => (
              <option key={conference.id} value={conference.id}>
                {conference.title} ({new Date(conference.startDate).getFullYear()})
              </option>
            ))}
          </select>

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

      {/* Create New */}
      {conferenceMode === 'create' && (
        <div className="border border-blue-200 rounded-md bg-blue-50/30 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Conference Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newConferenceData.title}
                onChange={(e) => handleNewConferenceChange({ title: e.target.value })}
                placeholder="Enter conference name"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={newConferenceData.location}
                onChange={(e) => handleNewConferenceChange({ location: e.target.value })}
                placeholder="Enter location or 'Online'"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newConferenceData.description}
              onChange={(e) => handleNewConferenceChange({ description: e.target.value })}
              placeholder="Enter conference description"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={newConferenceData.startDate}
                onChange={(e) => handleNewConferenceChange({ startDate: e.target.value })}
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
                onChange={(e) => handleNewConferenceChange({ endDate: e.target.value })}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={newConferenceData.status}
                onChange={(e) => handleNewConferenceChange({ status: e.target.value as typeof newConferenceData.status })}
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
                onChange={(e) => handleNewConferenceChange({ videoUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Expose create fn for parent — store in module-level ref accessible via data attribute */}
      <input
        type="hidden"
        data-conference-mode={conferenceMode}
        data-conference-new-title={newConferenceData.title}
        data-conference-new-start={newConferenceData.startDate}
        data-conference-new-end={newConferenceData.endDate}
        data-conference-new-location={newConferenceData.location}
        data-conference-new-description={newConferenceData.description}
        data-conference-new-status={newConferenceData.status}
        data-conference-new-video={newConferenceData.videoUrl}
        data-conference-creating={isCreatingConference ? 'true' : 'false'}
        id="conference-fields-data"
      />
    </div>
  );
}

// Helper: parent calls this to create conference if mode=create, returns resolved name+dates
export async function createConferenceIfNeeded(): Promise<{ conferenceName: string; conferenceDates: string; venue: string } | null> {
  const el = document.getElementById('conference-fields-data') as HTMLInputElement | null;
  if (!el) return null;

  const mode = el.dataset.conferenceMode;
  if (mode !== 'create') return null;

  const title = el.dataset.conferenceNewTitle || '';
  const startDate = el.dataset.conferenceNewStart || '';
  const endDate = el.dataset.conferenceNewEnd || '';
  const location = el.dataset.conferenceNewLocation || '';
  const description = el.dataset.conferenceNewDescription || '';
  const status = el.dataset.conferenceNewStatus || 'UPCOMING';
  const videoUrl = el.dataset.conferenceNewVideo || '';

  if (!title.trim()) { alert('Please enter a conference name'); return null; }
  if (!startDate) { alert('Please enter a start date'); return null; }
  if (!endDate) { alert('Please enter an end date'); return null; }
  if (new Date(startDate) >= new Date(endDate)) { alert('End date must be after start date'); return null; }

  const createRes = await fetch('/api/admin/conferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate,
      location: location.trim() || undefined,
      status,
      videoUrl: videoUrl.trim() || undefined,
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    alert(err.error || 'Failed to create conference');
    return null;
  }

  const createData = await createRes.json();
  const conf = createData.conference;
  const start = new Date(conf.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const end = new Date(conf.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return {
    conferenceName: conf.title,
    conferenceDates: `${start} - ${end}`,
    venue: conf.location || '',
  };
}

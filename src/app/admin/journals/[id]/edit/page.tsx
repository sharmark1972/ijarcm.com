'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [form, setForm] = useState({
    name: '',
    abbreviation: '',
    website: '',
    issnPrint: '',
    issnOnline: '',
    origin: '',
    doiAllotted: false,
    isActive: true,
  });

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/admin/journals/${id}`);
        if (res.ok) {
          const data = await res.json();
          const j = data.journal;
          setIsDefault(j.isDefault);
          setForm({
            name: j.name,
            abbreviation: j.abbreviation,
            website: j.website || '',
            issnPrint: j.issnPrint || '',
            issnOnline: j.issnOnline || '',
            origin: j.origin || '',
            doiAllotted: j.doiAllotted,
            isActive: j.isActive,
          });
        }
      } catch (error) {
        console.error('Failed to fetch journal:', error);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.abbreviation.trim()) {
      alert('Name and abbreviation are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/journals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        router.push('/admin/journals');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update journal');
      }
    } catch {
      alert('Failed to update journal');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/journals" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Journal</h1>
              {isDefault && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">Default Journal</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Journal Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abbreviation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.abbreviation}
                onChange={(e) => setForm(p => ({ ...p, abbreviation: e.target.value.toUpperCase() }))}
                disabled={isDefault}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
              <select
                value={form.origin}
                onChange={(e) => setForm(p => ({ ...p, origin: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select origin</option>
                <option value="Indian">Indian</option>
                <option value="American">American</option>
                <option value="Netherland">Netherland</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm(p => ({ ...p, website: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISSN (Print)</label>
              <input
                type="text"
                value={form.issnPrint}
                onChange={(e) => setForm(p => ({ ...p, issnPrint: e.target.value }))}
                placeholder="e.g. 2455-0116"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ISSN (Online)</label>
              <input
                type="text"
                value={form.issnOnline}
                onChange={(e) => setForm(p => ({ ...p, issnOnline: e.target.value }))}
                placeholder="e.g. 2395-6410"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="doiAllotted"
                checked={form.doiAllotted}
                onChange={(e) => setForm(p => ({ ...p, doiAllotted: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="doiAllotted" className="text-sm font-medium text-gray-700">DOI Allotted</label>
            </div>
            {!isDefault && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link
              href="/admin/journals"
              className="px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

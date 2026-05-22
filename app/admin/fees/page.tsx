'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AlertCircle,
  CheckCircle,
  Loader,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface FeeConfig {
  baseFee: number;
  perPageFee: number;
  plagiarismFee: number;
  rewritingFee: number;
  rapidPublicationFee: number;
  discountPercentage: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: FeeConfig;
}

export default function AdminFeesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [fees, setFees] = useState<FeeConfig>({
    baseFee: 15000,
    perPageFee: 1000,
    plagiarismFee: 1000,
    rewritingFee: 2000,
    rapidPublicationFee: 30000,
    discountPercentage: 50
  });

  const [originalFees, setOriginalFees] = useState<FeeConfig>(fees);

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin/fees');
      return;
    }

    // Check if user is admin (you may need to adjust this based on your session structure)
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/admin/fees');
      return;
    }

    // Fetch current fees configuration
    fetchFeeConfig();
  }, [status, session, router]);

  const fetchFeeConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/fees', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch fee configuration');
      }

      const data: ApiResponse = await response.json();
      if (data.success && data.data) {
        setFees(data.data);
        setOriginalFees(data.data);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load fee configuration'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate fees
    if (Object.values(fees).some(value => value < 0)) {
      setMessage({
        type: 'error',
        text: 'All fees must be non-negative'
      });
      return;
    }

    if (fees.discountPercentage < 0 || fees.discountPercentage > 100) {
      setMessage({
        type: 'error',
        text: 'Discount percentage must be between 0 and 100'
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/admin/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fees)
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to save fee configuration');
      }

      setOriginalFees(fees);
      setMessage({
        type: 'success',
        text: 'Fee configuration updated successfully'
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving fees:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save fee configuration'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFees(originalFees);
    setMessage(null);
  };

  const hasChanges = JSON.stringify(fees) !== JSON.stringify(originalFees);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Publication Fees Management</h1>
          <p className="text-gray-600 mt-2">
            Configure publication fees and APC settings for your journal
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-medium">{message.text}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 sm:p-8">
          <div className="space-y-8">
            {/* Section 1: Base Publication Fees */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Base Publication Fees</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Publication Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Publication Fee (Up to 6 Pages)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fees.baseFee}
                      onChange={(e) => setFees({ ...fees, baseFee: parseInt(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Standard publication fee for papers up to 6 pages</p>
                </div>

                {/* Per Page Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Per Page Fee (Beyond 6 Pages)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fees.perPageFee}
                      onChange={(e) => setFees({ ...fees, perPageFee: parseInt(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Charge per additional page beyond 6</p>
                </div>
              </div>
            </div>

            {/* Section 2: Additional Services */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Services</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Plagiarism Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Plagiarism Checking Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fees.plagiarismFee}
                      onChange={(e) => setFees({ ...fees, plagiarismFee: parseInt(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">If not submitted by author</p>
                </div>

                {/* Rewriting Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rewriting & Formatting Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fees.rewritingFee}
                      onChange={(e) => setFees({ ...fees, rewritingFee: parseInt(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">If not done by author</p>
                </div>
              </div>
            </div>

            {/* Section 3: Special Services */}
            <div className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Special Services</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rapid Publication Fee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rapid Publication Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-gray-600 font-medium">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={fees.rapidPublicationFee}
                      onChange={(e) => setFees({ ...fees, rapidPublicationFee: parseInt(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Expedited review and publication</p>
                </div>
              </div>
            </div>

            {/* Section 4: Discounts */}
            <div className="pb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Discount Settings</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Discount Percentage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (Economically Weaker Sections)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="5"
                      value={fees.discountPercentage}
                      onChange={(e) => setFees({ ...fees, discountPercentage: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-3 text-gray-600 font-medium">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Discount applied to total APC for eligible authors</p>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4">Fee Structure Preview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-800">Base Publication (≤6p)</span>
                  <span className="font-semibold text-blue-900">₹{fees.baseFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Per Page (6+p)</span>
                  <span className="font-semibold text-blue-900">₹{fees.perPageFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Plagiarism Checking</span>
                  <span className="font-semibold text-blue-900">₹{fees.plagiarismFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Rewriting & Formatting</span>
                  <span className="font-semibold text-blue-900">₹{fees.rewritingFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Rapid Publication</span>
                  <span className="font-semibold text-blue-900">₹{fees.rapidPublicationFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800">Discount Rate</span>
                  <span className="font-semibold text-blue-900">{fees.discountPercentage}%</span>
                </div>
              </div>
            </div>

            {/* Example Calculation */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3">Example Calculation</h3>
              <div className="text-sm text-purple-800 space-y-2">
                <p>
                  <span className="font-medium">10-page paper without author-submitted reports:</span>
                </p>
                <div className="ml-4 space-y-1">
                  <p>Base publication (6p): ₹{fees.baseFee.toLocaleString()}</p>
                  <p>Extra pages (4 × ₹{fees.perPageFee}): ₹{(4 * fees.perPageFee).toLocaleString()}</p>
                  <p>Plagiarism checking: ₹{fees.plagiarismFee.toLocaleString()}</p>
                  <p>Rewriting & formatting: ₹{fees.rewritingFee.toLocaleString()}</p>
                  <p className="pt-2 border-t border-purple-300 font-semibold">
                    Total: ₹{(fees.baseFee + (4 * fees.perPageFee) + fees.plagiarismFee + fees.rewritingFee).toLocaleString()}
                  </p>
                  <p className="text-purple-700">
                    With {fees.discountPercentage}% discount: ₹{Math.floor((fees.baseFee + (4 * fees.perPageFee) + fees.plagiarismFee + fees.rewritingFee) * (1 - fees.discountPercentage / 100)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex gap-3 justify-end border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={handleReset}
              disabled={!hasChanges || saving}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && !saving
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }`}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                hasChanges && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-100 text-blue-400 cursor-not-allowed'
              }`}
            >
              {saving && <Loader className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Help & Information</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-900">Base Publication Fee</p>
              <p>The standard fee charged when a paper is accepted for publication (up to 6 pages).</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Per Page Fee</p>
              <p>Additional charge for each page beyond the 6-page limit. Applied cumulatively.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Additional Services</p>
              <p>Fees for plagiarism checking and rewriting services if authors don&apos;t provide them.</p>
            </div>
            <div>
              <p className="font-medium text-gray-900">Discounts</p>
              <p>Percentage discount applied to the total APC for authors from economically weaker sections.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

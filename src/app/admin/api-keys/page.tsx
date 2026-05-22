'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  description?: string;
  rateLimit: number;
  allowedOrigins: string[];
  createdAt: string;
  isActive: boolean;
  lastUsed?: string;
  usageCount: number;
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKey, setNewKey] = useState({
    name: '',
    description: '',
    rateLimit: 100,
    allowedOrigins: ['']
  });
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      fetchApiKeys();
    }
  }, [status, session, router]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      // For now, we'll use mock data since we don't have API keys table in DB yet
      // In production, this would be: const response = await fetch('/api/admin/api-keys');
      const mockApiKeys: ApiKey[] = [
        {
          id: 'key_1234567890',
          name: 'Test Website API',
          description: 'API key for testing purposes',
          rateLimit: 100,
          allowedOrigins: ['https://example.com'],
          createdAt: new Date().toISOString(),
          isActive: true,
          lastUsed: new Date().toISOString(),
          usageCount: 25
        }
      ];
      setApiKeys(mockApiKeys);
    } catch {
      setError('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/public/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newKey,
          allowedOrigins: newKey.allowedOrigins.filter(origin => origin.trim() !== '')
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.data.apiKey);
        setSuccess('API key created successfully!');
        setShowCreateForm(false);
        setNewKey({
          name: '',
          description: '',
          rateLimit: 100,
          allowedOrigins: ['']
        });
        fetchApiKeys(); // Refresh list
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch {
      setError('Failed to create API key');
    }
  };

  const handleDeactivateKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to deactivate this API key?')) {
      return;
    }

    try {
      // In production, this would be: await fetch(`/api/admin/api-keys/${keyId}`, { method: 'DELETE' });
      setSuccess('API key deactivated successfully');
      fetchApiKeys(); // Refresh list
    } catch {
      setError('Failed to deactivate API key');
    }
  };

  const addOriginField = () => {
    setNewKey({
      ...newKey,
      allowedOrigins: [...newKey.allowedOrigins, '']
    });
  };

  const updateOriginField = (index: number, value: string) => {
    const updatedOrigins = [...newKey.allowedOrigins];
    updatedOrigins[index] = value;
    setNewKey({
      ...newKey,
      allowedOrigins: updatedOrigins
    });
  };

  const removeOriginField = (index: number) => {
    if (newKey.allowedOrigins.length > 1) {
      const updatedOrigins = newKey.allowedOrigins.filter((_, i) => i !== index);
      setNewKey({
        ...newKey,
        allowedOrigins: updatedOrigins
      });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">API Keys Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Create New API Key
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Create API Key Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New API Key</h2>
            <form onSubmit={handleCreateKey}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={newKey.description}
                  onChange={(e) => setNewKey({ ...newKey, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rate Limit (requests per minute)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newKey.rateLimit}
                  onChange={(e) => setNewKey({ ...newKey, rateLimit: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Allowed Origins (optional)
                </label>
                {newKey.allowedOrigins.map((origin, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="url"
                      value={origin}
                      onChange={(e) => updateOriginField(index, e.target.value)}
                      placeholder="https://example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                    />
                    {newKey.allowedOrigins.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOriginField(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOriginField}
                  className="bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
                >
                  Add Origin
                </button>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Key Modal */}
      {generatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">API Key Generated</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>Important:</strong> Save this API key securely. It won&apos;t be shown again.
              </p>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm break-all">
                {generatedKey}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setGeneratedKey(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                I&apos;ve Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate Limit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No API keys found. Create your first API key to get started.
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{key.name}</div>
                      {key.description && (
                        <div className="text-sm text-gray-500">{key.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {key.rateLimit}/min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {key.usageCount} requests
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        key.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {key.isActive ? (
                      <button
                        onClick={() => handleDeactivateKey(key.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">API Documentation</h3>
        <p className="text-blue-700 mb-2">
          For detailed API documentation and examples, visit:
        </p>
        <a
          href="/api/public/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          /api/public/docs
        </a>
      </div>
    </div>
  );
}
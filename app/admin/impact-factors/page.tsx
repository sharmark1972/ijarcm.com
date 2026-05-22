'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Download, Award, TrendingUp, FileText, ExternalLink, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema, OrganizationSchema } from '@/components/SchemaMarkup';

interface ImpactFactor {
  id: string;
  year: number;
  value: number;
  certificatePath?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ImpactFactorsAdminPage() {
  const { data: session } = useSession();
  const [impactFactors, setImpactFactors] = useState<ImpactFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFactor, setEditingFactor] = useState<ImpactFactor | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    value: 0,
    isActive: true
  });

  useEffect(() => {
    if (session?.user?.role !== 'ADMIN') {
      redirect('/admin');
    }

    fetchImpactFactors();
  }, [session]);

  const fetchImpactFactors = async () => {
    try {
      const response = await fetch('/api/admin/impact-factors');
      if (!response.ok) {
        throw new Error('Failed to fetch impact factors');
      }
      
      const data = await response.json();
      setImpactFactors(data);
    } catch (err) {
      console.error('Error fetching impact factors:', err);
      setError('Failed to load impact factors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingFactor 
        ? `/api/admin/impact-factors/${editingFactor.id}`
        : '/api/admin/impact-factors';
      
      const method = editingFactor ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save impact factor');
      }
      
      const data = await response.json();
      setImpactFactors(prev => 
        editingFactor 
          ? prev.map(factor => factor.id === editingFactor.id ? data : factor)
          : [...prev, data]
      );
      
      setShowForm(false);
      setEditingFactor(null);
      setFormData({
        year: new Date().getFullYear(),
        value: 0,
        isActive: true
      });
    } catch (err) {
      console.error('Error saving impact factor:', err);
      setError('Failed to save impact factor');
    }
  };

  const handleEdit = (factor: ImpactFactor) => {
    setEditingFactor(factor);
    setFormData({
      year: factor.year,
      value: factor.value,
      isActive: factor.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this impact factor? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/impact-factors/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete impact factor');
      }
      
      setImpactFactors(prev => prev.filter(factor => factor.id !== id));
    } catch (err) {
      console.error('Error deleting impact factor:', err);
      setError('Failed to delete impact factor');
    }
  };

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/impact-factors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update impact factor status');
      }
      
      setImpactFactors(prev => 
        prev.map(factor => 
          factor.id === id ? { ...factor, isActive } : factor
        )
      );
    } catch (err) {
      console.error('Error updating impact factor status:', err);
      setError('Failed to update impact factor status');
    }
  };

  return (
    <>
      <DynamicSEO 
        title="Impact Factors Management - Admin"
        description="Manage journal impact factors and certificates for IJARCM."
        keywords={['impact factors', 'admin', 'journal metrics', 'IJARCM']}
        ogImage="https://ijrcam.com/og-image.jpg"
        canonicalUrl="https://ijrcam.com/admin/impact-factors"
      />
      <WebsiteSchema 
        name="Impact Factors Management - Admin"
        url="https://ijrcam.com/admin/impact-factors"
        description="Manage journal impact factors and certificates for IJARCM."
        publisher="IJARCM"
      />
      <OrganizationSchema 
        name="IJARCM"
        url="https://ijrcam.com/admin/impact-factors"
        description="Manage journal impact factors and certificates for IJARCM."
        contactPoint={{
          email: "editor@ijrcam.com",
          contactType: "Editorial Office"
        }}
      />
      
      <div className="min-h-screen bg-gray-50">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Impact Factors Management</h1>
              <p className="text-gray-600">Manage journal impact factors and upload certificates</p>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div className="bg-white shadow-lg rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingFactor ? 'Edit Impact Factor' : 'Add New Impact Factor'}
                </h2>
                
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span className="ml-2">{showForm ? 'Cancel' : 'Add New'}</span>
                </button>
              </div>
              
              {showForm && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                        Year
                      </label>
                      <input
                        type="number"
                        id="year"
                        min="2000"
                        max={new Date().getFullYear() + 1}
                        value={formData.year}
                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
                        Impact Factor Value
                      </label>
                      <input
                        type="number"
                        id="value"
                        min="0"
                        max="10"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">
                      Active (display on website)
                    </label>
                  </div>
                </form>
              )}
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Impact Factors History</h3>
                <div className="text-sm text-gray-500">
                  {impactFactors.length} impact factors recorded
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 border-t-transparent"></div>
                </div>
              ) : impactFactors.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Impact Factors Yet</h3>
                  <p className="text-gray-500">Add your first impact factor to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Impact Factor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Certificate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {impactFactors.map((factor) => (
                        <tr key={factor.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {factor.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-2xl font-bold text-blue-600">
                                {factor.value.toFixed(2)}
                              </span>
                              <div className="ml-2 flex items-center">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-gray-500">
                                  +{(factor.value * 0.1).toFixed(2)} from last year
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              factor.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {factor.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {factor.certificatePath ? (
                              <a
                                href={factor.certificatePath}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400">Not uploaded</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(factor.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {factor.creator ? `${factor.creator.firstName} ${factor.creator.lastName}` : 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(factor)}
                                className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              
                              <button
                                onClick={() => handleToggleStatus(factor.id, !factor.isActive)}
                                className={`inline-flex items-center px-2 py-1 rounded ${
                                  factor.isActive 
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                } transition-colors`}
                              >
                                {factor.isActive ? (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    <span className="ml-1">Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    <span className="ml-1">Activate</span>
                                  </>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleDelete(factor.id)}
                                className="inline-flex items-center px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
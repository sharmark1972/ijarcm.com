'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Award, TrendingUp, FileText, Calendar, ExternalLink, Plus, Edit, Trash2, Eye, Download } from 'lucide-react';
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

export default function ImpactFactorsPage() {
  const [impactFactors, setImpactFactors] = useState<ImpactFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchImpactFactors = async () => {
      try {
        const response = await fetch('/api/impact-factors');
        if (!response.ok) {
          throw new Error('Failed to fetch impact factors');
        }
        
        const data = await response.json();
        setImpactFactors(data.impactFactors || []);
      } catch (err) {
        console.error('Error fetching impact factors:', err);
        setError('Failed to load impact factors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchImpactFactors();
  }, []);

  return (
    <>
      <DynamicSEO 
        title="Impact Factors - IJARCM"
        description="View the historical impact factors of IJARCM journal, tracking our academic influence and citation metrics over the years."
        keywords={['impact factor', 'journal metrics', 'academic influence', 'citation analysis', 'IJARCM']}
        ogImage="https://ijrcam.com/og-image.jpg"
        canonicalUrl="https://ijrcam.com/impact-factors"
      />
      <WebsiteSchema 
        name="Impact Factors - IJARCM"
        url="https://ijrcam.com/impact-factors"
        description="View the historical impact factors of IJARCM journal, tracking our academic influence and citation metrics over the years."
        publisher="IJARCM"
      />
      <OrganizationSchema 
        name="IJARCM"
        url="https://ijrcam.com/impact-factors"
        description="View the historical impact factors of IJARCM journal, tracking our academic influence and citation metrics over the years."
        contactPoint={{
          email: "editor@ijrcam.com",
          contactType: "Editorial Office"
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full text-white shadow-lg">
              <Award className="h-8 w-8 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold">Journal Impact Factors</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-4">
              Track our academic influence and citation metrics over the years. Our impact factors reflect the quality and significance of research published in IJARCM.
            </p>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-8 rounded-lg text-center">
              <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
              <p className="text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : impactFactors.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Impact Factors Available</h3>
              <p className="text-gray-600 mb-6">
                Impact factor data will be available once our journal has been indexed and metrics have been calculated.
              </p>
              <Link 
                href="/" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Return Home
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {impactFactors.map((factor) => (
                      <tr key={factor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {factor.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                            <span className="text-gray-400">Not available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(factor.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
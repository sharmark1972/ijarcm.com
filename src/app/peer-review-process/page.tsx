'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Users, Award, ArrowRight, Loader2, FileText, AlertCircle } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface PeerReviewProcess {
  id: string;
  title: string;
  description: string;
  stepNumber: number;
  estimatedDuration?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function ProcessStep({ process, isLast }: { process: PeerReviewProcess; isLast: boolean }) {
  return (
    <div className="relative group">
      {/* Step Card */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6 relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-serif font-bold text-xl shadow-md">
              {process.stepNumber}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
              <h3 className="text-lg font-serif font-bold text-slate-900">
                {process.title}
              </h3>
              {process.estimatedDuration && (
                <span className="inline-flex items-center text-xs font-medium text-slate-500 mt-1 sm:mt-0 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <Clock className="w-3 h-3 mr-1" />
                  {process.estimatedDuration}
                </span>
              )}
            </div>
            <div 
              className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: process.description.replace(/\n/g, '<br />') }}
            />
          </div>
        </div>
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div className="hidden md:block absolute left-6 top-full h-12 w-0.5 bg-slate-200 -z-0"></div>
      )}
      
      {/* Mobile Connector */}
      {!isLast && (
        <div className="md:hidden flex justify-center py-4">
          <ArrowRight className="w-6 h-6 text-slate-300 rotate-90" />
        </div>
      )}
      
      {/* Spacing for desktop */}
      {!isLast && <div className="hidden md:block h-8"></div>}
    </div>
  );
}

function ProcessSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-8">
      <div className="animate-pulse flex items-start gap-4">
        <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="h-6 w-48 bg-slate-100 rounded"></div>
            <div className="h-5 w-24 bg-slate-100 rounded"></div>
          </div>
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function PeerReviewProcessPage() {
  const [processes, setProcesses] = useState<PeerReviewProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/peer-review-process?isActive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch peer review processes');
      }
      const data = await response.json();
      setProcesses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Error Loading Process</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Peer Review Process - IJARCM"
        description="Learn about our rigorous peer review process that ensures the highest quality of published research."
        keywords={["peer review", "academic review", "manuscript review", "research quality", "IJARCM"]}
        canonicalUrl="/peer-review-process"
      />
      <WebsiteSchema />
      
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Peer Review Process', href: '/peer-review-process' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">Peer Review Process</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our rigorous peer review process ensures the highest quality of published research. 
              We employ a double-blind review system to maintain objectivity and academic integrity.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 mb-2">Expert Reviewers</h3>
              <p className="text-slate-600 text-xs">
                Evaluated by leading experts in the specific field of study.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 mb-2">Rigorous Standards</h3>
              <p className="text-slate-600 text-xs">
                Adhering to strict COPE guidelines for publication ethics.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 mb-2">Fair & Transparent</h3>
              <p className="text-slate-600 text-xs">
                Constructive feedback provided to help improve manuscript quality.
              </p>
            </div>
          </div>

          {/* Process Steps */}
          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-8 text-center">
              Workflow Overview
            </h2>
            
            {loading ? (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => <ProcessSkeleton key={i} />)}
              </div>
            ) : (
              <div className="relative">
                {processes.map((process, index) => (
                  <ProcessStep 
                    key={process.id} 
                    process={process} 
                    isLast={index === processes.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Empty State */}
          {!loading && processes.length === 0 && (
            <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                No Process Steps Defined
              </h3>
              <p className="text-slate-600 text-sm">
                The review process details are currently being updated.
              </p>
            </div>
          )}

          {/* Additional Info Cards */}
          {!loading && processes.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-slate-700" />
                  <h3 className="font-serif font-bold text-slate-900">Review Timeline</h3>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The total review process typically takes 8-12 weeks from submission to final decision. 
                  Authors will be notified at each major milestone via our submission portal.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-serif font-bold text-slate-900">Editorial Support</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our editorial team is available to assist authors throughout the review process. 
                  Contact us if you have any questions about your submission status.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

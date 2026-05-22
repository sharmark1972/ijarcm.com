'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle, AlertCircle, BookOpen, Send, Loader2 } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface SubmissionGuideline {
  id: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'FORMATTING' | 'SUBMISSION_PROCESS' | 'REVIEW_PROCESS' | 'PUBLICATION';
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels = {
  GENERAL: 'General Guidelines',
  FORMATTING: 'Formatting Requirements',
  SUBMISSION_PROCESS: 'Submission Process',
  REVIEW_PROCESS: 'Review Process',
  PUBLICATION: 'Publication Guidelines'
};

const categoryIcons = {
  GENERAL: BookOpen,
  FORMATTING: FileText,
  SUBMISSION_PROCESS: Send,
  REVIEW_PROCESS: CheckCircle,
  PUBLICATION: AlertCircle
};

function GuidelineCard({ guideline }: { guideline: SubmissionGuideline }) {
  const IconComponent = categoryIcons[guideline.category];
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-md shrink-0">
              <IconComponent className="w-5 h-5 text-slate-700" />
            </div>
            <h3 className="text-lg font-serif font-bold text-slate-900 leading-tight">
              {guideline.title}
            </h3>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 whitespace-nowrap">
            {categoryLabels[guideline.category].split(' ')[0]}
          </span>
        </div>
      </div>
      <div className="p-6 flex-1">
        <div 
          className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: guideline.content.replace(/\n/g, '<br />') }}
        />
      </div>
    </div>
  );
}

function GuidelineSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm h-full p-6">
      <div className="animate-pulse space-y-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 rounded-md"></div>
            <div className="h-6 w-48 bg-slate-100 rounded"></div>
          </div>
          <div className="h-5 w-20 bg-slate-100 rounded-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded w-full"></div>
          <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionGuidelinesPage() {
  const [guidelines, setGuidelines] = useState<SubmissionGuideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    fetchGuidelines();
  }, []);

  const fetchGuidelines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/submission-guidelines?isActive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch submission guidelines');
      }
      const data = await response.json();
      setGuidelines(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const groupedGuidelines = guidelines.reduce((acc, guideline) => {
    if (!acc[guideline.category]) {
      acc[guideline.category] = [];
    }
    acc[guideline.category].push(guideline);
    return acc;
  }, {} as Record<string, SubmissionGuideline[]>);

  const categoryOrder = [
    'GENERAL',
    'FORMATTING',
    'SUBMISSION_PROCESS',
    'REVIEW_PROCESS',
    'PUBLICATION'
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Error Loading Guidelines</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Submission Guidelines - IJARCM"
        description="Comprehensive submission guidelines for IJARCM. Learn about formatting requirements, submission process, review procedures, and publication guidelines."
        keywords={['submission guidelines', 'manuscript submission', 'academic journal', 'IJARCM', 'formatting']}
        canonicalUrl="/submission-guidelines"
      />
      
      <WebsiteSchema />
      
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Submission Guidelines', href: '/submission-guidelines' }
            ]}
          />
        </div>
      </div>
      
      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">Submission Guidelines</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Please review these comprehensive guidelines carefully before submitting your manuscript. 
              Following these guidelines will help ensure a smooth review process.
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-12">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-center mb-8 overflow-x-auto pb-2">
                <TabsList className="bg-white border border-slate-200 p-1 rounded-lg inline-flex">
                  <TabsTrigger 
                    value="all" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md transition-all"
                  >
                    All Guidelines
                  </TabsTrigger>
                  {categoryOrder.map((category) => {
                    const IconComponent = categoryIcons[category as keyof typeof categoryIcons];
                    return (
                      <TabsTrigger 
                        key={category} 
                        value={category} 
                        className="px-4 py-2 text-sm font-medium text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md transition-all flex items-center gap-2"
                      >
                        <span className="hidden md:inline">{categoryLabels[category as keyof typeof categoryLabels].split(' ')[0]}</span>
                        <span className="md:hidden"><IconComponent className="w-4 h-4" /></span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0">
                {loading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => <GuidelineSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="space-y-16">
                    {categoryOrder.map((category) => {
                      const categoryGuidelines = groupedGuidelines[category];
                      if (!categoryGuidelines?.length) return null;

                      return (
                        <div key={category}>
                          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-200 pb-2">
                            {React.createElement(categoryIcons[category as keyof typeof categoryIcons], {
                              className: "w-6 h-6 text-slate-700"
                            })}
                            <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                          </h2>
                          <div className="grid md:grid-cols-2 gap-6">
                            {categoryGuidelines.map((guideline) => (
                              <GuidelineCard key={guideline.id} guideline={guideline} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {categoryOrder.map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  {loading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                       {[1, 2].map((i) => <GuidelineSkeleton key={i} />)}
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6 flex items-center gap-3">
                        {React.createElement(categoryIcons[category as keyof typeof categoryIcons], {
                          className: "w-6 h-6 text-slate-700"
                        })}
                        <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6">
                        {(groupedGuidelines[category] || []).map((guideline) => (
                          <GuidelineCard key={guideline.id} guideline={guideline} />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Empty State */}
          {!loading && guidelines.length === 0 && (
            <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                No Guidelines Found
              </h3>
              <p className="text-slate-600">
                Guidelines are currently being updated. Please check back later.
              </p>
            </div>
          )}

          {/* Help Box */}
          {!loading && guidelines.length > 0 && (
            <div className="mt-16 bg-white border border-slate-200 rounded-lg p-8 text-center">
              <h3 className="text-xl font-serif font-bold text-slate-900 mb-2">
                Have Questions?
              </h3>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                If you need clarification on any of the guidelines or the submission process, our editorial team is here to help.
              </p>
              <a 
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
              >
                Contact Editorial Office
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

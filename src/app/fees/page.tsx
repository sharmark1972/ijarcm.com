'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  Zap,
  HelpCircle,
  Download,
  FileText
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema } from '@/components/SchemaMarkup';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Fee {
  label: string;
  amount: number;
  description: string;
  icon: React.ReactNode;
  conditions?: string;
}

interface APCCalculation {
  submission: number;
  publication: number;
  plagiarism: number;
  rewriting: number;
  rapidPublication: number;
  total: number;
}

export default function FeesPage() {
  const [includePlagiarism, setIncludePlagiarism] = useState(false);
  const [includeRewriting, setIncludeRewriting] = useState(false);
  const [includeRapidPublication, setIncludeRapidPublication] = useState(false);

  // Calculate APC
  const calculateAPC = (): APCCalculation => {
    const submission = 0; // Free
    
    // Publication fees: 72000 for normal, 140000 for rapid
    const publication = includeRapidPublication ? 140000 : 72000;

    // Plagiarism checking
    const plagiarism = includePlagiarism ? 1000 : 0;

    // Rewriting and formatting
    const rewriting = includeRewriting ? 2000 : 0;

    // Rapid publication (included in publication price)
    const rapidPublication = 0;

    // Final total
    const total = submission + publication + plagiarism + rewriting;

    return {
      submission,
      publication,
      plagiarism,
      rewriting,
      rapidPublication,
      total
    };
  };

  const calculation = calculateAPC();

  const feeStructure: Fee[] = [
    {
      label: 'Submission',
      amount: 0,
      description: 'Initial paper submission',
      icon: <CheckCircle className="w-5 h-5" />,
      conditions: 'FREE - All submissions are free of charge'
    },
    {
      label: 'Normal Publication',
      amount: 72000,
      description: 'Standard publication with regular timeline',
      icon: <FileText className="w-5 h-5" />,
      conditions: 'Includes all pages, plagiarism and AI reports submitted by author'
    },
    {
      label: 'Rapid Publication',
      amount: 140000,
      description: 'Fast-track international publication',
      icon: <Zap className="w-5 h-5" />,
      conditions: 'Expedited review and publication process (2-3 weeks)'
    },
    {
      label: 'Plagiarism Checking',
      amount: 1000,
      description: 'If not submitted by author',
      icon: <AlertCircle className="w-5 h-5" />,
      conditions: 'Required if author does not provide plagiarism report'
    },
    {
      label: 'Rewriting & Formatting',
      amount: 2000,
      description: 'Professional editing service',
      icon: <AlertCircle className="w-5 h-5" />,
      conditions: 'Optional service for manuscript improvement'
    }
  ];

  return (
    <>
      <DynamicSEO
        title="Publication Fees - IJARCM"
        description="Transparent fee structure for IJARCM publication. Free submission, competitive publication fees, and APC calculator."
        keywords={['publication fees', 'APC', 'article processing charge', 'submission fees', 'IJARCM']}
        canonicalUrl="/fees"
        ogType="website"
      />
      <WebsiteSchema
        name="IJARCM Publication Fees"
        description="Publication fee structure and APC calculator"
        url="/fees"
        publisher="IJARCM"
      />

      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Publication Fees', href: '/fees' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">
              Publication Fees
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We believe in transparent and competitive pricing for research publication.
              Our fees cover the costs of peer review, editing, hosting, and archiving.
            </p>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg p-6 border-l-4 border-green-500 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 rounded-md shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Free Submission</h3>
                  <p className="text-slate-600 text-sm">Submit your research at no cost. Pay only after acceptance.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-md shrink-0">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Standard Rate</h3>
                  <p className="text-slate-600 text-sm">₹72,000 for normal publication (all pages included).</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border-l-4 border-amber-500 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 rounded-md shrink-0">
                  <Zap className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-slate-900 mb-1">Rapid Publication</h3>
                  <p className="text-slate-600 text-sm">₹1,40,000 for expedited international review (2-3 weeks).</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Fee Structure */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Fee Structure</h2>

                <div className="space-y-4">
                  {feeStructure.map((fee, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-lg p-6 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="text-slate-500 shrink-0 mt-1">
                          {fee.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-slate-900">{fee.label}</h3>
                            <span className="text-lg font-bold text-slate-900 font-mono">
                              ₹{fee.amount.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-600 text-sm mb-2">{fee.description}</p>
                          {fee.conditions && (
                            <p className="text-xs text-slate-500 italic">{fee.conditions}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Important Notes */}
                <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex gap-3">
                    <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-700">
                      <p className="font-bold mb-2 text-slate-900">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1.5">
                        <li>Submission is completely free</li>
                        <li>Publication charges apply only after acceptance</li>
                        <li>Authors must submit plagiarism and AI reports (free checking available if not done)</li>
                        <li>All pages included in publication fee - no extra page charges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* FAQs */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm">Is submission free?</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Yes, paper submission is completely free. Publication charges apply only after your paper is accepted.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm">Can I pay in installments?</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Please contact our office for installment payment options. We may be able to arrange flexible payment terms.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm">Is there a page limit?</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      No, the publication fee covers all pages. There are no additional charges for extra pages.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 mb-2 text-sm">Do I get a refund if rejected?</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Since submission is free and charges are applied only after acceptance, there are no refunds as no payment is made during submission.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* APC Calculator */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-serif font-bold text-slate-900 mb-6">APC Calculator</h2>

                <div className="space-y-4">
                  {/* Plagiarism Checkbox */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-slate-300 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Plagiarism Checking</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono">₹1,000</span>
                      <input
                        type="checkbox"
                        checked={includePlagiarism}
                        onChange={(e) => setIncludePlagiarism(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 border-gray-300"
                      />
                    </div>
                  </label>

                  {/* Rewriting Checkbox */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:border-slate-300 transition-colors">
                    <span className="text-sm font-medium text-slate-700">Rewriting & Formatting</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono">₹2,000</span>
                      <input
                        type="checkbox"
                        checked={includeRewriting}
                        onChange={(e) => setIncludeRewriting(e.target.checked)}
                        className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 border-gray-300"
                      />
                    </div>
                  </label>

                  {/* Publication Type Selection */}
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                      Publication Speed
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${!includeRapidPublication ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="publicationType"
                            checked={!includeRapidPublication}
                            onChange={() => setIncludeRapidPublication(false)}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">Normal</span>
                        </div>
                        <span className="text-sm font-mono">₹72,000</span>
                      </label>
                      
                      <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${includeRapidPublication ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                        <div className="flex items-center gap-2">
                           <input
                            type="radio"
                            name="publicationType"
                            checked={includeRapidPublication}
                            onChange={() => setIncludeRapidPublication(true)}
                            className="hidden"
                          />
                          <span className="text-sm font-medium">Rapid (Int.)</span>
                        </div>
                        <span className="text-sm font-mono">₹1,40,000</span>
                      </label>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="mt-6 pt-6 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Base Publication</span>
                      <span className="font-medium font-mono">₹{calculation.publication.toLocaleString()}</span>
                    </div>
                    {calculation.plagiarism > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Plagiarism Check</span>
                        <span className="font-medium font-mono">₹{calculation.plagiarism.toLocaleString()}</span>
                      </div>
                    )}
                    {calculation.rewriting > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rewriting</span>
                        <span className="font-medium font-mono">₹{calculation.rewriting.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t-2 border-slate-900 flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total APC</span>
                    <span className="text-2xl font-bold text-slate-900 font-mono">
                      ₹{calculation.total.toLocaleString()}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href="/submit"
                    className="block w-full mt-6 px-4 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors text-center shadow-sm"
                  >
                    Proceed to Submission
                  </Link>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                 <button className="text-sm text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2 mx-auto">
                    <Download className="w-4 h-4" /> Download Fee Schedule PDF
                 </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import Link from 'next/link';
import {
  Copyright,
  Shield,
  AlertTriangle,
  FileText,
  Mail,
  ExternalLink,
  BookOpen,
  Users,
  Scale,
  Eye
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

function CopyrightPage() {
  return (
    <>
      <DynamicSEO
        title="Copyright Policy - IJARCM"
        description="Learn about IJARCM's copyright policy, author rights, and intellectual property protection."
        keywords={['copyright policy', 'author rights', 'intellectual property', 'IJARCM']}
        canonicalUrl="/copyright"
      />
      <WebsiteSchema
        name="IJARCM Copyright Policy"
        url="https://ijrcam.com/copyright"
        description="Copyright policy and intellectual property guidelines for IJARCM"
      />
      
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs 
            items={[
              { label: 'Home', href: '/' },
              { label: 'Copyright Policy', href: '/copyright' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">
              Copyright Policy
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              We are committed to protecting intellectual property rights and ensuring the integrity of published research.
            </p>
          </div>

          <div className="space-y-8">
            {/* Introduction */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-slate-100 rounded-md mr-3">
                  <Copyright className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">Copyright Notice</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-600">
                <p className="mb-4">
                  International Journal of Academic Research in Commerce and Management (IJARCM) is committed to protecting intellectual property rights and ensuring compliance with copyright laws. This policy outlines our copyright practices and rights of authors, readers, and journal.
                </p>
                <p>
                  All content published in IJARCM is protected by copyright law and international treaties. Unauthorized reproduction, distribution, or modification of published materials is strictly prohibited without explicit permission from the copyright holder.
                </p>
              </div>
            </section>

            {/* Author Rights */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-slate-100 rounded-md mr-3">
                  <Users className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">Author Rights & Responsibilities</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Copyright Ownership</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                    <li>Authors retain copyright of their work while granting IJARCM exclusive publication rights</li>
                    <li>Upon acceptance, authors must sign a copyright transfer agreement</li>
                    <li>Authors may reuse their work in other publications with proper attribution to IJARCM</li>
                    <li>Authors are responsible for obtaining permissions for any copyrighted material used in their work</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Author Responsibilities</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                    <li>Ensure originality of submitted work and proper citation of sources</li>
                    <li>Obtain written permission for copyrighted figures, tables, or excerpts</li>
                    <li>Disclose any conflicts of interest or funding sources</li>
                    <li>Comply with ethical guidelines and research standards</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* License Terms */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-slate-100 rounded-md mr-3">
                  <FileText className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">License Terms</h2>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Creative Commons Attribution 4.0 International License</h3>
                <p className="text-slate-600 text-sm">
                  IJARCM publishes articles under Creative Commons Attribution 4.0 International License (CC BY 4.0), which allows others to share and adapt work with proper attribution.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">You are free to:</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                    <li><strong>Share:</strong> copy and redistribute material in any medium or format</li>
                    <li><strong>Adapt:</strong> remix, transform, and build upon material for any purpose</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Under following terms:</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 text-sm">
                    <li><strong>Attribution:</strong> You must give appropriate credit, provide a link to the license, and indicate if changes were made</li>
                    <li><strong>No additional restrictions:</strong> You may not apply legal terms or technological measures that restrict others from doing what the license permits</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Infringement Policy */}
            <section className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-slate-100 rounded-md mr-3">
                  <AlertTriangle className="w-5 h-5 text-slate-700" />
                </div>
                <h2 className="text-xl font-serif font-bold text-slate-900">Infringement Policy</h2>
              </div>
              
              <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                <p>
                  If you believe that any material on IJARCM infringes your copyright, please contact us immediately. We comply with the Digital Millennium Copyright Act (DMCA) and respond promptly to legitimate infringement claims.
                </p>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                  <h4 className="font-bold text-slate-900 mb-2">Report Infringement</h4>
                  <p className="mb-2">Email your claim to <a href="mailto:dmca@ijarcm.com" className="text-blue-700 hover:underline">dmca@ijarcm.com</a> including:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your contact information</li>
                    <li>Description of copyrighted work</li>
                    <li>Location of infringing material</li>
                    <li>Statement of good faith belief</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Additional Resources */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/terms-of-service"
                className="flex items-center p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-sm"
              >
                <FileText className="w-5 h-5 text-slate-400 mr-3" />
                <span className="font-medium text-slate-900">Terms of Service</span>
                <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>

              <Link
                href="/privacy-policy"
                className="flex items-center p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors shadow-sm"
              >
                <Shield className="w-5 h-5 text-slate-400 mr-3" />
                <span className="font-medium text-slate-900">Privacy Policy</span>
                <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
              </Link>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default CopyrightPage;

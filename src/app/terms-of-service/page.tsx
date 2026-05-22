'use client';

import { Shield, FileText, Users, AlertTriangle } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function TermsOfServicePage() {
  return (
    <>
      <DynamicSEO
        title="Terms of Service - IJARCM | International Journal of Academic Research in Commerce and Management"
        description="Read IJARCM&apos;s terms of service and user agreement. Understand the terms and conditions for using our academic journal platform and submission system."
        keywords={[
          'terms of service IJARCM',
          'user agreement',
          'terms and conditions',
          'academic journal terms',
          'platform usage terms',
          'submission guidelines',
          'user responsibilities',
          'service agreement'
        ]}
        canonicalUrl="/terms-of-service"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service',
          description: 'Terms of service and user agreement for IJARCM academic journal platform.',
          url: 'https://ijrcam.com/terms-of-service',
          publisher: {
            '@type': 'Organization',
            name: 'IJARCM',
            url: 'https://ijrcam.com'
          }
        }}
      />
      <WebsiteSchema />
      <Breadcrumbs />
      
      <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Please read these terms and conditions carefully before using our journal platform.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            {/* Acceptance of Terms */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">1. Acceptance of Terms</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                By accessing and using the International Journal of Academic Research in Commerce and Management (IJARCM) platform, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
              <p className="text-gray-700 leading-relaxed">
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            {/* User Accounts */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <Users className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">2. User Accounts</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                To access certain features of our platform, you may be required to create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Updating your information to keep it current</li>
              </ul>
            </section>

            {/* Submission Guidelines */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Submission Guidelines</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When submitting manuscripts to IJARCM, you agree that:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Your work is original and has not been published elsewhere</li>
                <li>You have the right to submit the work</li>
                <li>The work does not infringe on any third-party rights</li>
                <li>You will comply with our peer review process</li>
                <li>You grant us the right to publish your work if accepted</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The content on this platform, including but not limited to text, graphics, logos, and software, is the property of IJARCM or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Authors retain copyright of their published works while granting IJARCM the right to publish and distribute the work.
              </p>
            </section>

            {/* Prohibited Uses */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">5. Prohibited Uses</h2>
              </div>
              <p className="text-gray-700 leading-relaxed mb-4">
                You may not use our platform for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Any unlawful purpose or to solicit others to unlawful acts</li>
                <li>Violating any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>Infringing upon or violating our intellectual property rights or the intellectual property rights of others</li>
                <li>Harassing, abusing, insulting, harming, defaming, slandering, disparaging, intimidating, or discriminating</li>
                <li>Submitting false or misleading information</li>
                <li>Uploading or transmitting viruses or any other type of malicious code</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                The information on this platform is provided on an &quot;as is&quot; basis. To the fullest extent permitted by law, IJARCM excludes all representations, warranties, conditions, and terms.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                In no event shall IJARCM, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, punitive, consequential, or special damages.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account and bar access to the platform immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever including but not limited to a breach of the Terms.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@ijarcm.com</p>
                <p className="text-gray-700"><strong>Phone:</strong> 8562985629</p>
                <p className="text-gray-700"><strong>Address:</strong> Academic Publishing House, University District</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
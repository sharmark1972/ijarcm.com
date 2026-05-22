'use client';

import { Users, Target, Globe, BookOpen, TrendingUp, Award } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function AboutPage() {
  return (
    <>
      <DynamicSEO
        title="About IJARCM - International Journal of Academic Research in Commerce and Management"
        description="Learn about IJARCM's mission, vision, and commitment to advancing knowledge in commerce and management through high-quality peer-reviewed research. Join our global academic community."
        keywords={[
          'about IJARCM',
          'academic journal',
          'commerce research',
          'management studies',
          'peer review',
          'international journal',
          'business research',
          'scholarly publishing'
        ]}
        canonicalUrl="/about"
      />
      <WebsiteSchema
        name="IJARCM About Page"
        url="https://ijrcam.com/about"
        description="Learn about the International Journal of Academic Research in Commerce and Management - our mission, vision, research areas, and editorial team."
      />
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'About', href: '/about' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">About IJARCM</h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              The International Journal of Academic Research in Commerce and Management is a premier platform for scholarly research, fostering innovation and excellence in business and management studies.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-slate-100 rounded-lg mr-4">
                  <Target className="h-6 w-6 text-slate-700" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Our Mission</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                To advance knowledge in commerce and management through the publication of high-quality, peer-reviewed research that addresses contemporary challenges and contributes to the development of innovative solutions for business and society.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-slate-100 rounded-lg mr-4">
                  <Globe className="h-6 w-6 text-slate-700" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-slate-900">Our Vision</h2>
              </div>
              <p className="text-slate-600 leading-relaxed">
                To be the leading international journal that bridges the gap between academic research and practical application in commerce and management, fostering global collaboration and knowledge exchange.
              </p>
            </div>
          </div>

          {/* Key Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-serif font-bold text-slate-900 text-center mb-12">Why Choose IJARCM?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-6">
                  <Award className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">Rigorous Peer Review</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our double-blind peer review process ensures the highest quality standards and academic integrity.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-6">
                  <Globe className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">Global Reach</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Published research reaches a worldwide audience of academics, practitioners, and policymakers.
                </p>
              </div>
              
              <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-slate-100 rounded-lg mx-auto mb-6">
                  <TrendingUp className="h-6 w-6 text-slate-700" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900 mb-3">Impact & Innovation</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We prioritize research that drives innovation and creates meaningful impact in business and society.
                </p>
              </div>
            </div>
          </div>

          {/* Research Areas */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 md:p-12 mb-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Research Areas</h2>
              <p className="text-slate-600">Covering a wide spectrum of disciplines in commerce and management.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Strategic Management', desc: 'Corporate strategy, competitive advantage, and organizational performance.' },
                { title: 'Marketing & Consumer Behavior', desc: 'Digital marketing, brand management, and consumer psychology.' },
                { title: 'Financial Management', desc: 'Corporate finance, investment analysis, and risk management.' },
                { title: 'Operations & Supply Chain', desc: 'Process optimization, logistics, and supply chain sustainability.' },
                { title: 'Human Resource Management', desc: 'Talent management, organizational behavior, and workplace dynamics.' },
                { title: 'International Business', desc: 'Global trade, cross-cultural management, and emerging markets.' }
              ].map((area, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-100 hover:border-slate-300 transition-colors">
                  <h3 className="text-lg font-serif font-bold text-slate-900 mb-2">{area.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {area.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Statistics Strip */}
          <div className="bg-slate-900 rounded-lg p-12 text-white mb-16">
            <div className="grid md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
              <div className="pt-4 md:pt-0">
                <div className="text-4xl font-bold mb-2 font-serif">500+</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Published Articles</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-4xl font-bold mb-2 font-serif">50+</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Countries Represented</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-4xl font-bold mb-2 font-serif">95%</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Author Satisfaction</div>
              </div>
              <div className="pt-4 md:pt-0">
                <div className="text-4xl font-bold mb-2 font-serif">2.8</div>
                <div className="text-slate-400 text-sm uppercase tracking-wider">Impact Factor</div>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="text-center bg-white p-12 rounded-lg border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Join Our Academic Community</h2>
            <p className="text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re a researcher looking to publish your work or an academic seeking cutting-edge insights, IJARCM welcomes you to be part of our global community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/submit"
                className="inline-flex items-center justify-center px-8 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors font-medium"
              >
                Submit Your Research
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-3 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors font-medium"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

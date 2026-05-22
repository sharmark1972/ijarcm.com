'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Users,
  Download,
  Globe,
  Shield,
  Zap,
  BookOpen,
  Target,
  Clock,
  Search,
  CheckCircle2
} from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import { WebsiteSchema, OrganizationSchema } from '@/components/SchemaMarkup';
import OurLeadership from '@/components/OurLeadership';
import AnnouncementsDisplay from '@/components/AnnouncementsDisplay';
import VisitorCounter from '@/components/VisitorCounter';
import VisitorAnalytics from '@/components/VisitorAnalytics';
import PublicationStatistics from '@/components/PublicationStatistics';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import IssueDisplay, { IssueDisplayProps } from '@/components/IssueDisplay';
import IndexingDatabases from '@/components/IndexingDatabases';

interface LatestPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  issuePublishDate?: string;
  downloads: number;
  category: string;
}

interface Stats {
  totalPapers: number;
  totalAuthors: number;
  totalDownloads: number;
  totalReviews: number;
}

export default function HomePage() {
  const [latestPapers, setLatestPapers] = useState<LatestPaper[]>([]);
  const [latestIssue, setLatestIssue] = useState<IssueDisplayProps | null>(null);
  const [upcomingIssue, setUpcomingIssue] = useState<IssueDisplayProps | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalPapers: 0,
    totalAuthors: 0,
    totalDownloads: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);

  useVisitorTracking();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const response = await fetch('/api/home');
      if (!response.ok) throw new Error('Failed to fetch home data');
      const data = await response.json();
      setStats(data.stats);
      setLatestPapers(data.latestPapers);
      setLatestIssue(data.latestIssue);
      setUpcomingIssue(data.upcomingIssue);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DynamicSEO 
        title="IJARCM - International Journal of Academic Research in Commerce and Management"
        description="Premier academic journal publishing rigorous peer-reviewed research in commerce, management, and technology."
        keywords={['commerce', 'management', 'research journal', 'academic publishing', 'IJARCM', 'peer review']}
        ogImage="https://ijrcam.com/og-image.jpg"
        canonicalUrl="https://ijrcam.com"
      />
      <WebsiteSchema 
        name="IJARCM"
        url="https://ijrcam.com"
        description="Premier academic journal publishing rigorous peer-reviewed research in commerce, management, and technology."
        publisher="IJARCM"
      />
      <OrganizationSchema 
        name="IJARCM"
        url="https://ijrcam.com"
        logo="https://ijrcam.com/ijarcm-logo.svg"
        description="IJARCM - International Journal of Academic Research in Commerce and Management"
        contactPoint={{
          email: "editor@ijrcam.com",
          contactType: "Editorial Office"
        }}
      />
      
      <div className="min-h-screen bg-white font-sans">
        
        {/* Hero Section */}
        <section className="relative bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="inline-flex items-center px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-semibold tracking-wide uppercase">
                  ISSN: 2455-0116 (Print) | 2395-6410 (Online)
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 leading-tight">
                  International Journal of <br className="hidden md:block" />
                  <span className="text-slate-700">Academic Research in Commerce & Management</span>
                </h1>
                
                <p className="text-xl text-slate-600 max-w-2xl leading-relaxed">
                  A premier international journal dedicated to publishing rigorous, peer-reviewed research that shapes the future of business and technology.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link
                    href="/submit"
                    className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors font-medium text-lg shadow-sm"
                  >
                    Submit Manuscript
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  
                  <Link
                    href="/library"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors font-medium text-lg"
                  >
                    Browse Library
                  </Link>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-slate-200 max-w-lg">
                  <div>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalPapers.toLocaleString()}+</div>
                    <div className="text-sm text-slate-500 font-medium">Published Papers</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalAuthors.toLocaleString()}+</div>
                    <div className="text-sm text-slate-500 font-medium">Authors</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-slate-900">12+</div>
                    <div className="text-sm text-slate-500 font-medium">Indexing</div>
                  </div>
                </div>
              </div>
              
              {/* Leadership/Board Preview */}
              <div className="lg:col-span-4">
                <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-serif font-bold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-2">Editorial Leadership</h3>
                  <OurLeadership />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Issues Section */}
        {(latestIssue || upcomingIssue) && (
          <section className="py-16 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Current Issue</h2>
                    <p className="text-slate-600 mt-2">Volume {latestIssue?.volume}, Issue {latestIssue?.issue} ({latestIssue?.year})</p>
                 </div>
                 <Link href="/issues" className="text-slate-900 hover:text-slate-700 font-medium inline-flex items-center">
                    View All Issues <ArrowRight className="w-4 h-4 ml-1" />
                 </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {latestIssue && (
                  <IssueDisplay
                    {...latestIssue}
                    isUpcoming={false}
                  />
                )}
                {upcomingIssue && (
                  <IssueDisplay
                    {...upcomingIssue}
                    isUpcoming={true}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        {/* Indexing Databases */}
        <div className="border-b border-slate-100 bg-slate-50/50">
           <IndexingDatabases />
        </div>

        {/* Latest Publications */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12">
              <div>
                 <h2 className="text-3xl font-serif font-bold text-slate-900 mb-2">Latest Research</h2>
                 <p className="text-slate-600">Explore the most recent peer-reviewed articles.</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Link
                  href="/library"
                  className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium"
                >
                  View Full Library
                </Link>
              </div>
            </div>
            
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-slate-50 h-64 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : latestPapers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {latestPapers.map((paper) => (
                  <div key={paper.id} className="group bg-white rounded-lg p-6 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {paper.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(paper.issuePublishDate || paper.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="font-serif font-bold text-lg mb-2 text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
                    </h3>
                    
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">
                      {paper.abstract}
                    </p>
                    
                    <div className="mb-4 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">Authors:</span> {paper.authors.join(', ')}
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center text-xs text-slate-500">
                        <Download className="w-3 h-3 mr-1" />
                        {paper.downloads}
                      </div>
                      <Link
                        href={`/papers/${paper.id}`}
                        className="text-slate-900 hover:text-blue-700 font-medium text-sm flex items-center"
                      >
                        Read More <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No Publications Yet</h3>
                <p className="text-slate-500">Check back soon for new research.</p>
              </div>
            )}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-slate-900 mb-4">Journal Features</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                 We are committed to the highest standards of academic publishing.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Globe, title: 'Global Reach', desc: 'Connecting researchers from over 50 countries.' },
                { icon: Shield, title: 'Rigorous Peer Review', desc: 'Double-blind review process ensuring quality and objectivity.' },
                { icon: Zap, title: 'Rapid Publication', desc: 'Efficient processing with an average turnaround of 4-6 weeks.' },
                { icon: BookOpen, title: 'Open Access', desc: 'Free unrestricted access to all published research.' },
                { icon: Target, title: 'High Visibility', desc: 'Indexed in major academic databases for maximum citation.' },
                { icon: CheckCircle2, title: 'Ethical Standards', desc: 'Strict adherence to COPE guidelines for publication ethics.' }
              ].map((feature, index) => (
                <div key={index} className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
                  <feature.icon className="w-8 h-8 text-slate-700 mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Announcements */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-slate-900">Announcements</h2>
             </div>
             <AnnouncementsDisplay targetAudience="ALL" limit={3} showDismiss={false} />
          </div>
        </section>

        {/* Publication Stats */}
        <PublicationStatistics />

        {/* CTA */}
        <section className="py-16 bg-slate-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Submit Your Research Today
            </h2>
            <p className="text-slate-300 mb-8 text-lg">
              Join our community of scholars and contribute to the global body of knowledge.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/submit"
                className="inline-flex items-center justify-center px-8 py-3 bg-white text-slate-900 rounded-md hover:bg-slate-100 transition-colors font-bold"
              >
                Start Submission
              </Link>
              <Link
                href="/submission-guidelines"
                className="inline-flex items-center justify-center px-8 py-3 border border-slate-600 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                Read Guidelines
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Calendar, FileText } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Author {
  id: string;
  name: string;
  email?: string;
  bio?: string;
  institution?: string;
  specialization?: string[];
  papers?: Array<{
    id: string;
    title: string;
    publishedAt: string;
    abstract?: string;
  }>;
}

export default function AuthorPage({ params }: { params: { name: string } }) {
  const [author, setAuthor] = useState<Author | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthor = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Decode the author name from URL
        const decodedName = decodeURIComponent(params.name);
        
        // Fetch author data
        const response = await fetch(`/api/authors/${decodedName}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Author not found');
          } else {
            setError('Failed to load author information');
          }
          return;
        }
        
        const authorData = await response.json();
        setAuthor(authorData);
      } catch (err) {
        console.error('Error fetching author:', err);
        setError('Failed to load author information');
      } finally {
        setLoading(false);
      }
    };

    fetchAuthor();
  }, [params.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading author profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <DynamicSEO
          title="Author Not Found - IJARCM"
          description="The requested author profile could not be found on IJARCM."
          canonicalUrl={`/authors/${params.name}`}
        />
        <WebsiteSchema
          name="Author Not Found"
          url={`https://ijrcam.com/authors/${params.name}`}
          description="Author profile not found on International Journal of Academic Research in Commerce and Management"
        />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-8">
                <Link
                  href="/"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <User className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Author Not Found</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link
                  href="/authors"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Browse All Authors
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!author) {
    return null;
  }

  return (
    <>
      <DynamicSEO
        title={`${author.name} - Author Profile - IJARCM`}
        description={`View the profile, publications, and research contributions of ${author.name} at IJARCM - International Journal of Academic Research in Commerce and Management.`}
        keywords={[
          author.name,
          'author profile',
          'IJARCM author',
          'research publications',
          'academic research',
          ...(author.specialization || [])
        ]}
        canonicalUrl={`/authors/${params.name}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: author.name,
          email: author.email,
          affiliation: author.institution,
          description: author.bio,
          knowsAbout: author.specialization,
          url: `https://ijrcam.com/authors/${params.name}`
        }}
      />
      <WebsiteSchema
        name={`${author.name} - Author Profile`}
        url={`https://ijrcam.com/authors/${params.name}`}
        description={`Profile and publications of ${author.name} at International Journal of Academic Research in Commerce and Management`}
      />
      
      <div className="bg-white py-4 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Authors', href: '/authors' },
              { label: author.name, href: `/authors/${params.name}` }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Author Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{author.name}</h1>
                {author.institution && (
                  <p className="text-lg text-gray-600 mb-2">{author.institution}</p>
                )}
                {author.email && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{author.email}</span>
                  </div>
                )}
                {author.specialization && author.specialization.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {author.specialization.map((spec, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {author.bio && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{author.bio}</p>
              </div>
            )}
          </div>

          {/* Publications */}
          {author.papers && author.papers.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Publications</h2>
              <div className="space-y-6">
                {author.papers.map((paper) => (
                  <div key={paper.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
                        <Link
                          href={`/papers/${paper.id}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {paper.title}
                        </Link>
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(paper.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {paper.abstract && (
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {paper.abstract}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/papers/${paper.id}`}
                        className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Paper
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Publications */}
          {(!author.papers || author.papers.length === 0) && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Publications Yet</h3>
              <p className="text-gray-600 mb-6">
                {author.name} hasn&apos;t published any papers with IJARCM yet. Check back soon for their latest research contributions.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Submit Your Research
              </Link>
            </div>
          )}

          {/* Back to Authors */}
          <div className="mt-8 text-center">
            <Link
              href="/authors"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Authors
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface Author {
  id: string;
  name: string;
  email?: string;
  institution?: string;
  specialization?: string[];
  papersCount?: number;
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/authors');
        
        if (!response.ok) {
          throw new Error('Failed to fetch authors');
        }
        
        const authorsData = await response.json();
        setAuthors(authorsData);
      } catch (err) {
        console.error('Error fetching authors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthors();
  }, []);

  const filteredAuthors = authors.filter(author => {
    const matchesSearch = author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (author.institution && author.institution.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    
    // Add more filtering logic based on filter value
    switch (filter) {
      case 'with-papers':
        return matchesSearch && (author.papersCount && author.papersCount > 0);
      case 'without-papers':
        return matchesSearch && (!author.papersCount || author.papersCount === 0);
      default:
        return matchesSearch;
    }
  });

  return (
    <>
      <DynamicSEO
        title="Authors - IJARCM | International Journal of Academic Research in Commerce and Management"
        description="Browse our team of authors and researchers contributing to IJARCM. Find experts in commerce, management, and related fields."
        keywords={[
          'IJARCM authors',
          'research authors',
          'academic researchers',
          'commerce experts',
          'management scholars',
          'journal contributors',
          'research publications'
        ]}
        canonicalUrl="/authors"
      />
      <WebsiteSchema
        name="IJARCM Authors"
        url="https://ijrcam.com/authors"
        description="Browse authors and researchers contributing to International Journal of Academic Research in Commerce and Management"
      />
      
      <div className="bg-white py-4 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Authors', href: '/authors' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Authors</h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Meet the brilliant minds behind our research publications. Our authors come from diverse academic backgrounds and contribute valuable insights to commerce and management research.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search authors by name or institution..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Authors</option>
                  <option value="with-papers">With Papers</option>
                  <option value="without-papers">Without Papers</option>
                </select>
                <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <Filter className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Authors Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading authors...</p>
            </div>
          ) : filteredAuthors.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Authors Found</h3>
              <p className="text-gray-600 mb-6">
                No authors match your current search criteria. Try adjusting your search terms or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAuthors.map((author) => (
                <div key={author.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {author.name ? (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <Link
                          href={`/authors/${author.id}`}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {author.name}
                        </Link>
                      </h3>
                      {author.institution && (
                        <p className="text-gray-600 text-sm mb-2">{author.institution}</p>
                      )}
                      {author.specialization && author.specialization.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {author.specialization.slice(0, 3).map((spec, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                            >
                              {spec}
                            </span>
                          ))}
                          {author.specialization.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              +{author.specialization.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      {author.papersCount !== undefined && (
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="font-medium">{author.papersCount}</span>
                          <span className="ml-1">papers published</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <div className="text-center mt-12">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Become an Author</h2>
              <p className="text-gray-600 mb-6">
                Join our community of researchers and contribute your expertise to the field of commerce and management.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/submit"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Submit Your Research
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border border-blue-600 text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Contact Editorial Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Building, User, Search, BookOpen, Grid, List, AlertCircle, Linkedin, Globe } from 'lucide-react';
import DynamicSEO from '@/components/DynamicSEO';
import WebsiteSchema from '@/components/schema/WebsiteSchema';
import Breadcrumbs from '@/components/Breadcrumbs';

interface ReviewerBoardMember {
  id: string;
  name: string;
  title?: string;
  institution?: string;
  email?: string;
  bio?: string;
  expertise?: string;
  imageUrl?: string;
  position?: string;
  displayOrder: number;
  isActive: boolean;
  resumeUrl?: string;
}

function MemberCard({ member }: { member: ReviewerBoardMember }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col h-full">
      <div className="flex flex-col items-center text-center mb-6">
        <Avatar className="w-24 h-24 mb-4 ring-2 ring-slate-100">
          <AvatarImage src={member.imageUrl} alt={member.name} className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-1">
          {member.name}
        </h3>
        
        {member.position && (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-2">
            {member.position}
          </div>
        )}

        {member.title && (
          <p className="text-sm text-slate-600 mb-1">{member.title}</p>
        )}
        
        {member.institution && (
          <div className="flex items-center justify-center gap-1 text-sm text-slate-500">
            <Building className="w-3 h-3" />
            <span>{member.institution}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-4 flex-1">
        {member.expertise && (
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {member.expertise.split(',').map((skill, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-center gap-3">
        {member.email && (
          <a href={`mailto:${member.email}`} className="text-slate-400 hover:text-slate-900 transition-colors">
            <Mail className="w-4 h-4" />
          </a>
        )}
        {member.resumeUrl && (
          <a href={member.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 transition-colors" title="View Resume">
            <BookOpen className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

function MemberListItem({ member }: { member: ReviewerBoardMember }) {
  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-sm transition-shadow">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="w-16 h-16 ring-2 ring-slate-100 shrink-0">
          <AvatarImage src={member.imageUrl} alt={member.name} className="object-cover" />
          <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-900">{member.name}</h3>
              {member.position && (
                <p className="text-sm text-slate-600 font-medium">{member.position}</p>
              )}
            </div>
            {member.resumeUrl && (
               <a href={member.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1 border border-slate-200 rounded px-2 py-1">
                 <BookOpen className="w-3 h-3" /> Resume
               </a>
            )}
          </div>
          
          <div className="space-y-2 text-sm text-slate-600 mb-3">
            {member.institution && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <span>{member.institution}</span>
              </div>
            )}
          </div>

          {member.expertise && (
            <div className="flex flex-wrap gap-1.5">
              {member.expertise.split(',').map((skill, index) => (
                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-600 border border-slate-100">
                  {skill.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 h-full">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full mb-4"></div>
        <div className="h-6 w-32 bg-slate-100 rounded mb-2"></div>
        <div className="h-4 w-24 bg-slate-100 rounded mb-4"></div>
        <div className="h-4 w-full bg-slate-100 rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-slate-100 rounded"></div>
      </div>
    </div>
  );
}

export default function ReviewerBoardPage() {
  const [members, setMembers] = useState<ReviewerBoardMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<ReviewerBoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviewer-board?isActive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch reviewer board members');
      }
      const data = await response.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = useCallback(() => {
    let filtered = members;
    if (searchTerm) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredMembers(filtered);
  }, [members, searchTerm]);

  useEffect(() => {
    filterMembers();
  }, [filterMembers]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Error Loading Board</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicSEO
        title="Reviewer Board - IJARCM"
        description="Meet the distinguished reviewer board of IJARCM, featuring leading experts in commerce and management."
        keywords={['reviewer board', 'academic reviewers', 'IJARCM']}
        canonicalUrl="/reviewer-board"
      />
      <WebsiteSchema />
      
      <div className="bg-white py-4 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Reviewer Board', href: '/reviewer-board' }
            ]}
          />
        </div>
      </div>

      <div className="min-h-screen bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold text-slate-900 mb-6">
              Reviewer Board
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our distinguished reviewer board comprises leading experts in their respective fields,
              committed to maintaining the highest standards of academic excellence through rigorous peer review.
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
              
              <div className="flex items-center bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-sm transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-sm transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <MemberSkeleton key={i} />)}
             </div>
          ) : filteredMembers.length > 0 ? (
            <div className={viewMode === 'card' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "grid grid-cols-1 gap-4"}>
              {filteredMembers
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((member) => (
                  viewMode === 'card'
                    ? <MemberCard key={member.id} member={member} />
                    : <MemberListItem key={member.id} member={member} />
                ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Members Found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your search criteria.</p>
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

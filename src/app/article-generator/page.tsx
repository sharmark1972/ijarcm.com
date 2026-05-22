'use client';

import { Sparkles } from 'lucide-react';
import ArticleGenerator from '@/components/ArticleGenerator';

export default function ArticleGeneratorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Article Generator
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Enter material and site information to generate a full-fledged article PDF
            </p>
          </div>

          <ArticleGenerator />
        </div>
      </div>
    </div>
  );
}

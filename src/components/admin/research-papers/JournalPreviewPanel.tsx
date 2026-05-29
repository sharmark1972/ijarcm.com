'use client';

import { Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ResearchPaperDraft, ResearchPaperIssue } from '@/types/research-paper-workflow';

interface JournalPreviewPanelProps {
  draft: ResearchPaperDraft;
  issue?: ResearchPaperIssue;
  onDownloadDraft: () => void;
}

export function JournalPreviewPanel({ draft, issue, onDownloadDraft }: JournalPreviewPanelProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-slate-900">Journal Preview</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Final formatting will mirror your sample journal layout.
          </p>
        </div>
        <Button type="button" onClick={onDownloadDraft}>
          <Download className="h-4 w-4" />
          Export draft
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6">
          <div className="space-y-4 border-b border-slate-200 pb-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{draft.detectedMode === 'review' ? 'Review Paper' : 'Implementation Paper'}</Badge>
              <Badge variant="outline">Similarity {draft.similarityScore}%</Badge>
              {issue ? <Badge variant="outline">{issue.title}</Badge> : null}
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{draft.title}</h3>
            <p className="text-sm text-slate-500">
              {draft.authors.map((author) => author.name).join(', ')}
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Abstract</p>
              <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{draft.abstract}</p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Keywords</p>
              <p className="text-sm leading-6 text-slate-700">{draft.keywords.join(', ')}</p>
            </div>

            {draft.sections.map((section, index) => (
              <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-slate-900">
                  {index + 1}. {section.heading.replace(/^\d+\.\s*/, '')}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {section.cleaned || 'No content yet.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

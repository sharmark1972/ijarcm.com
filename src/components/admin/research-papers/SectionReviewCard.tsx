'use client';

import type { ReactNode } from 'react';
import { RotateCcw, Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ResearchSection, SectionStatus } from '@/types/research-paper-workflow';
import { cn } from '@/lib/utils';

interface SectionReviewCardProps {
  section: ResearchSection;
  onChange: (id: ResearchSection['id'], value: string) => void;
  onAutoFix: (id: ResearchSection['id']) => void;
  onRestore: (id: ResearchSection['id']) => void;
}

const statusMeta: Record<SectionStatus, { label: string; className: string; icon: ReactNode }> = {
  complete: {
    label: 'Ready',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  'needs-review': {
    label: 'Needs review',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
  missing: {
    label: 'Missing',
    className: 'border-slate-200 bg-slate-100 text-slate-600',
    icon: <ShieldAlert className="h-3.5 w-3.5" />,
  },
};

export function SectionReviewCard({ section, onChange, onAutoFix, onRestore }: SectionReviewCardProps) {
  const meta = statusMeta[section.status];

  return (
    <Card className={cn('border-slate-200 shadow-sm', section.status === 'needs-review' && 'ring-1 ring-amber-200')}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-slate-900">{section.heading}</CardTitle>
          <Badge variant="outline" className={meta.className}>
            <span className="mr-1 flex items-center">{meta.icon}</span>
            {meta.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onAutoFix(section.id)}>
            <Sparkles className="h-4 w-4" />
            Humanize
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onRestore(section.id)}>
            <RotateCcw className="h-4 w-4" />
            Restore original
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Original
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {section.original || 'No extracted text yet.'}
          </p>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Cleaned text
          </p>
          <Textarea
            value={section.cleaned}
            onChange={(event) => onChange(section.id, event.target.value)}
            rows={10}
            className="min-h-[260px] bg-white"
            placeholder={`Write the cleaned ${section.heading.toLowerCase()} here`}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {section.notes.map((note) => (
              <Badge key={note} variant="secondary" className="bg-slate-100 text-slate-700">
                {note}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

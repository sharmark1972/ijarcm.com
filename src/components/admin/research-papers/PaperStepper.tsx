'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { PipelineStage } from '@/types/research-paper-workflow';

interface StepItem {
  id: PipelineStage;
  title: string;
  description: string;
}

const steps: StepItem[] = [
  { id: 'upload', title: 'Upload', description: 'Receive manuscript' },
  { id: 'extract', title: 'Extract', description: 'Read DOCX text' },
  { id: 'classify', title: 'Classify', description: 'Detect paper type' },
  { id: 'clean', title: 'Clean', description: 'Humanize and correct' },
  { id: 'review', title: 'Review', description: 'Approve edits' },
  { id: 'preview', title: 'Preview', description: 'Render final format' },
  { id: 'done', title: 'Done', description: 'Ready for publish' },
];

interface PaperStepperProps {
  activeStage: PipelineStage;
  progress: number;
}

export function PaperStepper({ activeStage, progress }: PaperStepperProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-900">Processing Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <div className="space-y-3">
          {steps.map((step, index) => {
            const currentIndex = steps.findIndex((item) => item.id === activeStage);
            const isDone = index < currentIndex;
            const isActive = step.id === activeStage;

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3 transition-colors',
                  isActive ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white',
                )}
              >
                <div className="mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{step.title}</p>
                  <p className="text-sm text-slate-500">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


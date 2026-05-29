'use client';

import { useState } from 'react';
import { Upload, FileText, X, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UploadDropzoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onSamplePick?: (sampleKey: 'earthworm' | 'vedic' | 'omnichannel') => void;
}

export function UploadDropzone({
  file,
  onFileSelect,
  onClear,
  onSamplePick,
}: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) onFileSelect(droppedFile);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Upload className="h-5 w-5 text-sky-600" />
          Upload DOCX Manuscript
        </CardTitle>
        <CardDescription>
          Drag and drop a manuscript or choose a sample to preview the full workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'rounded-2xl border-2 border-dashed p-6 transition-all',
            isDragging
              ? 'border-sky-500 bg-sky-50'
              : 'border-slate-200 bg-slate-50',
          )}
        >
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="rounded-full bg-white p-3 shadow-sm">
              <FileText className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">
                Drop your `.docx` manuscript here
              </p>
              <p className="text-sm text-slate-600">
                The future backend will extract title, authors, keywords, and sections automatically.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <label>
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) onFileSelect(selected);
                  }}
                />
                <Button type="button" asChild>
                  <span className="cursor-pointer">Choose File</span>
                </Button>
              </label>
              <Button type="button" variant="outline" onClick={onClear} disabled={!file}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        {file ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Selected</Badge>
                <p className="truncate font-medium text-slate-900">{file.name}</p>
              </div>
              <p className="text-sm text-slate-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClear} aria-label="Remove file">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {onSamplePick ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Quick demo samples</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onSamplePick('earthworm')}>
                <Sparkles className="h-4 w-4" />
                Agriculture sample
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onSamplePick('vedic')}>
                <Sparkles className="h-4 w-4" />
                Review sample
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => onSamplePick('omnichannel')}>
                <Sparkles className="h-4 w-4" />
                Business sample
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}


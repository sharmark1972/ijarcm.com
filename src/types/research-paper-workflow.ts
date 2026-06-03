export type ResearchPaperMode = 'auto' | 'review' | 'implementation';

export type PipelineStage =
  | 'upload'
  | 'extract'
  | 'classify'
  | 'clean'
  | 'review'
  | 'preview'
  | 'done';

export type SectionStatus = 'complete' | 'needs-review' | 'missing';

export interface ResearchPaperIssue {
  id: string;
  title: string;
  volume: string;
  issueNumber: string;
  year: number;
  isPublished: boolean;
}

export interface ResearchSection {
  id: string;
  heading: string;
  original: string;
  cleaned: string;
  notes: string[];
  status: SectionStatus;
  isFullWidth?: boolean;
}

export interface ResearchPaperDraft {
  jobId: string;
  fileName: string;
  fileSize: number;
  detectedMode: Exclude<ResearchPaperMode, 'auto'>;
  confidence: number;
  title: string;
  abstract: string;
  keywords: string[];
  authors: Array<{
    name: string;
    email?: string;
    affiliation?: string;
    corresponding: boolean;
  }>;
  doi?: string;
  issueId?: string;
  category: string;
  similarityScore: number;
  bodyColumnMode: 'two-column' | 'single-column';
  sections: ResearchSection[];
}

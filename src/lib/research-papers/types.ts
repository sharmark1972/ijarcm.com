import type { ResearchPaperStatus } from '@prisma/client';

export type BodyColumnMode = 'two-column' | 'single-column';

export interface ParsedResearchPaper {
  title: string;
  abstract: string;
  keywords: string[];
  affiliation?: string;
  authors: Array<{
    name: string;
    email?: string;
    affiliation?: string;
    isCorresponding?: boolean;
  }>;
  sections: Array<{
    heading: string;
    content: string;
    isFullWidth?: boolean;
  }>;
}

export interface ResearchPaperDraftUpdateInput {
  title?: string | null;
  shortTitle?: string | null;
  abstract?: string | null;
  keywords?: string[];
  doi?: string | null;
  issueId?: string | null;
  bodyColumnMode?: BodyColumnMode | null;
  status?: ResearchPaperStatus;
  authors?: Array<{
    id?: string;
    name: string;
    email?: string | null;
    affiliation?: string | null;
    isCorresponding?: boolean;
  }>;
  sections?: Array<{
    id?: string;
    heading: string;
    content: string;
    isFullWidth?: boolean;
  }>;
}

export interface StoredResearchPaperFile {
  originalName: string;
  fileUrl: string;
  size: number;
  extension: string;
}

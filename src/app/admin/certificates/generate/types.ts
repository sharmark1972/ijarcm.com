// Shared types for certificate generate page and its sub-components

export interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  website?: string | null;
  issnPrint?: string | null;
  issnOnline?: string | null;
  origin?: string | null;
  doiAllotted: boolean;
  isDefault: boolean;
  isActive: boolean;
}

export interface Conference {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
}

export interface Issue {
  id: string;
  title: string;
  volume: string;
  issue: string; // issueNumber
  year: number;
  publicationDate: string;
  paperCount: number;
}

export interface IssuePaper {
  id: string;
  title: string;
  uniqueNumber?: string | null;
  volumeNumber?: string | null;
  issueNumber?: string | null;
  publishedAt?: string | null;
  paperAuthors?: Array<{
    user: { firstName: string; lastName: string; email: string };
  }>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  institution?: string;
}

export type CertificateTypeValue = 'PUBLICATION' | 'CONFERENCE';

// Data that type-specific fields expose upward to the parent
export interface TypeFieldsData {
  // CONFERENCE
  conferenceName?: string;
  conferenceDates?: string;
  venue?: string;
  // PUBLICATION
  paperId?: string;
  paperTitle?: string;
  paperNumber?: string;
}

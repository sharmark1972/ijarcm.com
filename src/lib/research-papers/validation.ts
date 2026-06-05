import type { ResearchPaperDraftUpdateInput } from './types';

export function validateDraftUpdate(input: ResearchPaperDraftUpdateInput) {
  if (input.title !== undefined && input.title !== null && input.title.trim().length > 700) {
    throw new Error('Title must be 700 characters or fewer.');
  }

  if (input.doi && input.doi.length > 200) {
    throw new Error('DOI must be 200 characters or fewer.');
  }
}

export function validatePublishReady(draft: {
  title: string | null;
  abstract: string | null;
  issueId: string | null;
  status?: string;
  authors: Array<{ name: string }>;
  sections: Array<{ heading: string; content: string }>;
}) {
  const errors: string[] = [];

  if (!draft.title?.trim()) errors.push('Title is required.');
  if (!draft.abstract?.trim()) errors.push('Abstract is required.');
  if (draft.authors.length === 0) errors.push('At least one author is required.');
  if (draft.sections.length === 0) errors.push('At least one section is required.');
  if (draft.sections.some((section) => !section.heading.trim())) errors.push('Every section must have a heading.');
  if (draft.status === 'PUBLISHED' && !draft.issueId) errors.push('Please select an issue before publishing.');

  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
}

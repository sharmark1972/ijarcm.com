'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { redirect, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Plus,
  RotateCcw,
  Save,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ResearchPaperDraft } from '@/types/research-paper-workflow';

interface AdminIssue {
  id: string;
  title: string;
  volume: string;
  issueNumber: string;
  year: number;
}

interface BackendDraft {
  id: string;
  title: string | null;
  abstract: string | null;
  keywords: string[] | null;
  doi: string | null;
  issueId: string | null;
  sourceFileName: string | null;
  sourceFileSize: number | null;
  authors: Array<{
    id: string;
    name: string;
    email: string | null;
    affiliation: string | null;
    isCorresponding: boolean;
  }>;
  sections: Array<{
    id: string;
    heading: string;
    content: string;
  }>;
}

function blankDraft(): ResearchPaperDraft {
  return {
    jobId: '',
    fileName: '',
    fileSize: 0,
    title: '',
    abstract: '',
    keywords: [],
    authors: [],
    doi: '',
    issueId: '',
    category: '',
    detectedMode: 'implementation',
    confidence: 0,
    similarityScore: 0,
    sections: [
      { id: 'abstract', heading: 'Abstract', original: '', cleaned: '', notes: [], status: 'missing' },
    ],
  };
}

export default function NewResearchPaperPage() {
  const { isAdmin } = useAuth();
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ResearchPaperDraft>(blankDraft());
  const [draftId, setDraftId] = useState(searchParams.get('id') || '');
  const [activeSectionId, setActiveSectionId] = useState('abstract');
  const [issueId, setIssueId] = useState('');
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isAdmin()) {
    redirect('/dashboard');
  }

  const activeSectionIndex = Math.max(
    draft.sections.findIndex((section) => section.id === activeSectionId),
    0,
  );
  const active = draft.sections[activeSectionIndex];

  const selectedIssue = useMemo(
    () => issues.find((issue) => issue.id === issueId),
    [issueId, issues],
  );

  useEffect(() => {
    const fetchIssues = async () => {
      const response = await fetch('/api/admin/issues?limit=100');
      const data = await response.json();
      if (response.ok) setIssues(data.issues || []);
    };

    fetchIssues();
  }, []);

  useEffect(() => {
    if (!draftId) return;

    const fetchDraft = async () => {
      try {
        setError('');
        const response = await fetch(`/api/admin/research-papers/${draftId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load draft');
        applyBackendDraft(data.draft);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft');
      }
    };

    fetchDraft();
  }, [draftId]);

  const reset = () => {
    setFile(null);
    setDraft(blankDraft());
    setDraftId('');
    setIssueId('');
    setActiveSectionId('abstract');
    setIsProcessing(false);
    setMessage('');
    setError('');
  };

  const analyze = async () => {
    if (!file) return;
    try {
      setIsProcessing(true);
      setError('');
      setMessage('');
      const formData = new FormData();
      formData.append('file', file);
      if (issueId) formData.append('issueId', issueId);

      const response = await fetch('/api/admin/research-papers/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to read file');

      setDraftId(data.draft.id);
      applyBackendDraft(data.draft);
      setMessage('File read successfully. Review and save the extracted draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyBackendDraft = (backendDraft: BackendDraft) => {
    const mappedSections = backendDraft.sections.length > 0
      ? backendDraft.sections.map((section) => ({
          id: section.id,
          heading: section.heading,
          original: section.content,
          cleaned: section.content,
          notes: [],
          status: section.content.trim() ? 'complete' as const : 'missing' as const,
        }))
      : blankDraft().sections;

    setDraft({
      jobId: backendDraft.id,
      fileName: backendDraft.sourceFileName || '',
      fileSize: backendDraft.sourceFileSize || 0,
      title: backendDraft.title || '',
      abstract: backendDraft.abstract || '',
      keywords: Array.isArray(backendDraft.keywords) ? backendDraft.keywords : [],
      authors: backendDraft.authors.map((author) => ({
        name: author.name,
        email: author.email || '',
        corresponding: author.isCorresponding,
      })),
      doi: backendDraft.doi || '',
      issueId: backendDraft.issueId || '',
      category: '',
      detectedMode: 'implementation',
      confidence: 0,
      similarityScore: 0,
      sections: mappedSections,
    });
    setIssueId(backendDraft.issueId || '');
    setActiveSectionId(mappedSections[0]?.id || 'abstract');
  };

  const updateActiveSection = (changes: Partial<typeof active>) => {
    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === activeSectionId ? { ...section, ...changes } : section,
      ),
    }));
  };

  const updateSectionContent = (value: string) => {
    updateActiveSection({
      cleaned: value,
      status: value.trim() ? 'complete' : 'missing',
    });
  };

  const addSection = () => {
    const id = `section-${Date.now()}`;
    setDraft((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id,
          heading: `New Section ${prev.sections.length + 1}`,
          original: '',
          cleaned: '',
          notes: [],
          status: 'missing',
        },
      ],
    }));
    setActiveSectionId(id);
  };

  const removeActiveSection = () => {
    if (draft.sections.length <= 1) return;
    const nextActive =
      draft.sections[activeSectionIndex - 1]?.id ||
      draft.sections[activeSectionIndex + 1]?.id ||
      'abstract';

    setDraft((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== activeSectionId),
    }));
    setActiveSectionId(nextActive);
  };

  const moveActiveSection = (direction: -1 | 1) => {
    setDraft((prev) => {
      const index = prev.sections.findIndex((section) => section.id === activeSectionId);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= prev.sections.length) return prev;

      const sections = [...prev.sections];
      const [section] = sections.splice(index, 1);
      sections.splice(targetIndex, 0, section);
      return { ...prev, sections };
    });
  };

  const addAuthor = () => {
    setDraft((prev) => ({
      ...prev,
      authors: [...prev.authors, { name: '', email: '', corresponding: false }],
    }));
  };

  const buildSavePayload = () => ({
    title: draft.title,
    abstract: draft.abstract,
    keywords: draft.keywords,
    doi: draft.doi || null,
    issueId: issueId || null,
    authors: draft.authors
      .map((author) => ({
        name: author.name.trim(),
        email: author.email?.trim() || null,
        affiliation: null,
        isCorresponding: author.corresponding,
      }))
      .filter((author) => author.name || author.email || author.affiliation),
    sections: draft.sections
      .map((section) => ({
        heading: section.heading.trim(),
        content: section.cleaned.trim(),
      }))
      .filter((section) => section.heading || section.content),
  });

  const saveDraft = async () => {
    if (!draftId) {
      setError('Upload and read a DOCX file before saving.');
      return null;
    }

    try {
      setIsSaving(true);
      setError('');
      setMessage('');
      const response = await fetch(`/api/admin/research-papers/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save draft');
      applyBackendDraft(data.draft);
      setMessage('Draft saved successfully.');
      return data.draft as BackendDraft;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const previewPdf = async () => {
    const saved = await saveDraft();
    if (!saved || !draftId) return;

    const previewWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');

    try {
      setIsSaving(true);
      const response = await fetch(`/api/admin/research-papers/${draftId}/generate-preview-pdf`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate PDF preview');
      const previewUrl = `/api/admin/research-papers/${draftId}/pdf?type=preview&t=${Date.now()}`;
      if (previewWindow) {
        previewWindow.location.href = previewUrl;
        previewWindow.focus();
      } else {
        window.location.href = previewUrl;
      }
    } catch (err) {
      if (previewWindow) {
        previewWindow.close();
      }
      setError(err instanceof Error ? err.message : 'Failed to generate PDF preview');
    } finally {
      setIsSaving(false);
    }
  };

  const exportDraft = () => {
    const content = [
      draft.title,
      draft.authors.map((author) => author.name).join(', '),
      '',
      draft.abstract,
      '',
      `Keywords: ${draft.keywords.join(', ')}`,
      '',
      ...draft.sections.map((section) => `${section.heading}\n${section.cleaned}`),
    ].join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${draft.title || 'research-paper-draft'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Button asChild variant="ghost" className="mb-2 px-0 text-slate-500 hover:bg-transparent hover:text-slate-900">
                <Link href="/admin/research-papers">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Add Research Paper</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Upload the manuscript, review the extracted details, and prepare the paper for journal formatting.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button className="bg-slate-900 hover:bg-slate-800" onClick={exportDraft} disabled={!draft.title}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Manuscript</h2>
                  <p className="text-sm text-slate-500">DOC or DOCX file</p>
                </div>
                <Upload className="h-5 w-5 text-slate-500" />
              </div>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-slate-400 hover:bg-white">
                <FileText className="h-8 w-8 text-slate-400" />
                <span className="mt-3 block w-full max-w-full break-words px-2 text-sm font-medium leading-5 text-slate-900">
                  {file ? file.name : 'Choose manuscript'}
                </span>
                <span className="mt-1 text-xs text-slate-500">Accepted: .doc, .docx</span>
                <input
                  type="file"
                  accept=".doc,.docx"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) setFile(selected);
                  }}
                />
              </label>

              <div className="mt-4 flex gap-2">
                <Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={analyze} disabled={!file || isProcessing}>
                  <FileText className="h-4 w-4" />
                  {isProcessing ? 'Reading file...' : 'Read file'}
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/research-papers/pdf-template">Template</Link>
                </Button>
              </div>
              {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-950">Publishing Details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Issue</label>
                  <Select value={issueId || 'none'} onValueChange={(value) => setIssueId(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign later" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Assign later</SelectItem>
                      {issues.map((issue) => (
                        <SelectItem key={issue.id} value={issue.id}>
                          Vol. {issue.volume}, Issue {issue.issueNumber} ({issue.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">DOI</label>
                  <Input
                    value={draft.doi || ''}
                    placeholder="Optional"
                    onChange={(event) => setDraft((prev) => ({ ...prev, doi: event.target.value }))}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-950">Authors</h2>
                <Button variant="outline" size="sm" onClick={addAuthor}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {draft.authors.length === 0 ? (
                  <p className="text-sm text-slate-500">No authors extracted yet.</p>
                ) : (
                  draft.authors.map((author, index) => (
                    <div key={`${author.name}-${index}`} className="grid gap-2">
                      <Input
                        value={author.name}
                        placeholder="Author name"
                        onChange={(event) =>
                          setDraft((prev) => {
                            const authors = [...prev.authors];
                            authors[index] = { ...authors[index], name: event.target.value };
                            return { ...prev, authors };
                          })
                        }
                      />
                      <Input
                        value={author.email || ''}
                        placeholder="Email optional"
                        onChange={(event) =>
                          setDraft((prev) => {
                            const authors = [...prev.authors];
                            authors[index] = { ...authors[index], email: event.target.value };
                            return { ...prev, authors };
                          })
                        }
                      />
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Preview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedIssue ? selectedIssue.title : 'Issue can be assigned later'}
                </p>
              </div>
              <div className="mt-5 grid gap-2">
                <Button variant="outline" disabled={!draft.title || isSaving} onClick={previewPdf}>
                  <Eye className="h-4 w-4" />
                  Preview PDF
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800" disabled={!draft.title || isSaving} onClick={saveDraft}>
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
                  <Input
                    value={draft.title}
                    placeholder="Extracted paper title"
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Paper type</label>
                  <Select
                    value={draft.detectedMode}
                    onValueChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        detectedMode: value as ResearchPaperDraft['detectedMode'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="review">Review Paper</SelectItem>
                      <SelectItem value="implementation">Implementation Paper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
                  <Input
                    value={draft.category}
                    placeholder="Category"
                    onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Abstract</label>
                  <Textarea
                    rows={4}
                    value={draft.abstract}
                    placeholder="Extracted abstract"
                    onChange={(event) => setDraft((prev) => ({ ...prev, abstract: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Keywords</label>
                  <Input
                    value={draft.keywords.join(', ')}
                    placeholder="keyword one, keyword two"
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        keywords: event.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                      }))
                    }
                  />
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Paper Sections</h2>
                  <p className="text-sm text-slate-500">Use the same headings that appear in the manuscript.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                  Add section
                </Button>
              </div>

              <div className="grid md:grid-cols-[280px_1fr]">
                <div className="border-r border-slate-200 bg-[#f8fafc] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outline</p>
                    <Badge variant="outline" className="bg-white">
                      {draft.sections.length}
                    </Badge>
                  </div>
                  {draft.sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSectionId(section.id)}
                      className={`mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${
                        activeSectionId === section.id
                          ? 'border-slate-400 bg-white text-slate-950 shadow-sm'
                          : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          activeSectionId === section.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-white text-slate-500 ring-1 ring-slate-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {section.heading.replace(/^\d+\.\s*/, '') || 'Untitled'}
                        </span>
                        <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              section.cleaned ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {section.cleaned ? 'Ready' : 'Empty'}
                        </span>
                      </span>
                      {section.cleaned ? null : <X className="h-4 w-4 shrink-0 text-amber-500" />}
                    </button>
                  ))}
                </div>

                <div className="bg-white p-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Section {activeSectionIndex + 1}
                        </p>
                        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                          {active.heading.replace(/^\d+\.\s*/, '') || 'Untitled'}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => moveActiveSection(-1)} disabled={activeSectionIndex === 0}>
                          Up
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => moveActiveSection(1)}
                          disabled={activeSectionIndex === draft.sections.length - 1}
                        >
                          Down
                        </Button>
                        <Button variant="outline" size="sm" onClick={removeActiveSection} disabled={draft.sections.length <= 1}>
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="mb-1 block text-sm font-medium text-slate-700">Heading</label>
                      <Input
                        value={active.heading}
                        placeholder="Section heading"
                        className="bg-white"
                        onChange={(event) => updateActiveSection({ heading: event.target.value })}
                      />
                    </div>

                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={active.status === 'complete' ? 'default' : 'outline'}>
                          {active.status === 'complete' ? 'Ready' : 'Empty'}
                        </Badge>
                        <Badge variant="outline" className="bg-white">
                          {active.cleaned.length} chars
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white"
                        onClick={() => updateSectionContent(active.cleaned || active.original)}
                      >
                        <FileText className="h-4 w-4" />
                        Improve text
                      </Button>
                    </div>

                    <Textarea
                      rows={14}
                      value={active.cleaned}
                      placeholder="Section content will appear here after the file is read"
                      className="min-h-[360px] resize-y border-slate-300 bg-white text-base leading-7"
                      onChange={(event) => updateSectionContent(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

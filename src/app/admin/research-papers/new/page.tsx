'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { redirect, useRouter, useSearchParams } from 'next/navigation';
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
import { SectionEditor } from '@/components/admin/research-papers/SectionEditor';
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
    isFullWidth?: boolean;
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
      { id: 'abstract', heading: 'Abstract', original: '', cleaned: '', notes: [], status: 'missing', isFullWidth: true },
    ],
  };
}

export default function NewResearchPaperPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
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
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'gemini' | 'zai' | 'basic' | 'done'>('idle');
  const [extractionMethod, setExtractionMethod] = useState<'gemini' | 'zai' | 'basic' | null>(null);

  if (!isAdmin()) {
    redirect('/dashboard');
  }

  const activeSectionIndex = Math.max(
    draft.sections.findIndex((section) => section.id === activeSectionId),
    0,
  );
  const active = draft.sections[activeSectionIndex];
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

    setIsProcessing(true);
    setError('');
    setExtractionMethod(null);
    setExtractionStatus('idle');

    const formData = new FormData();
    formData.append('file', file);
    if (issueId) formData.append('issueId', issueId);

    try {
      const response = await fetch('/api/admin/research-papers/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect to server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const eventLine = part.match(/^event: (.+)$/m)?.[1];
          const dataLine = part.match(/^data: (.+)$/m)?.[1];
          if (!eventLine || !dataLine) continue;

          const data = JSON.parse(dataLine);

          if (eventLine === 'status') {
            setExtractionStatus(data.step);
          } else if (eventLine === 'done') {
            setExtractionMethod(data.extractionMethod);
            setExtractionStatus('done');
            setDraftId(data.draft.id);
            applyBackendDraft(data.draft);
          } else if (eventLine === 'error') {
            throw new Error(data.error || 'Extraction failed');
          }
        }
      }
    } catch (err) {
      setExtractionStatus('idle');
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
          isFullWidth: section.isFullWidth ?? true,
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
        affiliation: author.affiliation || '',
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

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          isFullWidth: true,
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
      authors: [...prev.authors, { name: '', email: '', affiliation: '', corresponding: false }],
    }));
  };

  const removeAuthor = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      authors: prev.authors.filter((_, i) => i !== index),
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
        affiliation: (author as any).affiliation?.trim() || null,
        isCorresponding: author.corresponding,
      }))
      .filter((author) => author.name),
    sections: draft.sections
      .map((section) => ({
        heading: section.heading.trim(),
        content: section.cleaned.trim(),
        isFullWidth: section.isFullWidth ?? true,
      }))
      .filter((section) => section.heading || section.content),
  });

  const silentSave = async () => {
    if (!draftId) return null;
    try {
      const response = await fetch(`/api/admin/research-papers/${draftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSavePayload()),
      });
      const data = await response.json();
      if (!response.ok) return null;
      return data.draft as BackendDraft;
    } catch {
      return null;
    }
  };

  const saveDraft = async () => {
    if (!draftId) {
      setError('Upload and read a DOCX file before saving.');
      return;
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
      router.push('/admin/research-papers');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const previewPdf = async () => {
    if (!draftId) {
      setError('Upload and read a DOCX file before previewing.');
      return;
    }

    const previewWindow = window.open('', '_blank');

    try {
      setIsSaving(true);
      await silentSave();
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
        window.open(previewUrl, '_blank');
      }
    } catch (err) {
      if (previewWindow) previewWindow.close();
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

              {/* Extraction status — dynamic steps */}
              {isProcessing && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${extractionStatus === 'gemini' ? 'text-slate-700' : 'text-slate-400'}`}>
                    {extractionStatus === 'gemini'
                      ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                      : <span className="h-3 w-3 rounded-full bg-red-300" />}
                    Extracting with Gemini AI...
                  </div>
                  {(extractionStatus === 'zai' || extractionStatus === 'basic') && (
                    <div className={`flex items-center gap-2 ${extractionStatus === 'zai' ? 'text-slate-700' : 'text-slate-400'}`}>
                      {extractionStatus === 'zai'
                        ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                        : <span className="h-3 w-3 rounded-full bg-red-300" />}
                      Trying ZAI AI...
                    </div>
                  )}
                  {extractionStatus === 'basic' && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                      Using basic extraction...
                    </div>
                  )}
                </div>
              )}

              {/* Result badge */}
              {!isProcessing && extractionMethod && (
                <div className={`mt-3 rounded-lg border p-3 text-sm ${
                  extractionMethod === 'gemini' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                  extractionMethod === 'zai'    ? 'border-blue-200 bg-blue-50 text-blue-700' :
                                                  'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                  {extractionMethod === 'gemini' && '✓ Extracted with Gemini AI'}
                  {extractionMethod === 'zai'    && '✓ Extracted with ZAI AI'}
                  {extractionMethod === 'basic'  && '⚠ Basic extraction used — please verify the data'}
                </div>
              )}

              {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50">
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Abstract</label>
                    <span className={`text-xs font-medium ${
                      draft.abstract.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length > 148
                        ? 'text-red-600'
                        : 'text-slate-400'
                    }`}>
                      {draft.abstract.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length} / 148 words
                    </span>
                  </div>
                  {draft.abstract.replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length > 148 && (
                    <p className="mb-1 text-xs text-red-600">Abstract exceeds 148 words — it will be truncated in the PDF.</p>
                  )}
                  <SectionEditor
                    content={draft.abstract}
                    onChange={(html) => setDraft((prev) => ({ ...prev, abstract: html }))}
                    size="small"
                  />
                </div>
                <div>
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
                    <div key={`${author.name}-${index}`} className="rounded-lg border border-slate-200 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">Author {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeAuthor(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        value={author.name}
                        placeholder="Author name *"
                        onChange={(event) =>
                          setDraft((prev) => {
                            const authors = [...prev.authors];
                            authors[index] = { ...authors[index], name: event.target.value };
                            return { ...prev, authors };
                          })
                        }
                      />
                      <Input
                        value={(author as any).affiliation || ''}
                        placeholder="Affiliation / Institution"
                        onChange={(event) =>
                          setDraft((prev) => {
                            const authors = [...prev.authors];
                            authors[index] = { ...authors[index], affiliation: event.target.value };
                            return { ...prev, authors };
                          })
                        }
                      />
                      <Input
                        value={author.email || ''}
                        placeholder="Email (optional)"
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
              <div className="space-y-4">
                <div>
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
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Paper Sections</h2>
                  <p className="text-sm text-slate-500">Click a section in the outline to jump to it.</p>
                </div>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="h-4 w-4" />
                  Add section
                </Button>
              </div>

              <div className="grid md:grid-cols-[260px_1fr]" style={{ minHeight: '600px' }}>
                {/* Left: Section Outline */}
                <div className="border-r border-slate-200 bg-[#f8fafc] p-4 sticky top-0 self-start" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outline</p>
                    <Badge variant="outline" className="bg-white">{draft.sections.length}</Badge>
                  </div>
                  {draft.sections.map((section, index) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm transition ${
                        activeSectionId === section.id
                          ? 'border-slate-400 bg-white text-slate-950 shadow-sm'
                          : 'border-transparent bg-transparent text-slate-700 hover:border-slate-200 hover:bg-white'
                      }`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        activeSectionId === section.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">
                          {section.heading.replace(/^\d+(\.\d+)*\.?\s*/, '') || 'Untitled'}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <span className={`h-1.5 w-1.5 rounded-full ${section.cleaned ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                          {section.cleaned ? 'Has content' : 'Empty'}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right: Continuous scroll — all sections */}
                <div className="divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: '85vh' }}>
                  {draft.sections.map((section, index) => (
                    <div
                      key={section.id}
                      ref={(el) => { sectionRefs.current[section.id] = el; }}
                      className="p-6"
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      {/* Section header */}
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Section {index + 1}</p>
                          <h3 className="mt-1 text-lg font-semibold text-slate-900">
                            {section.heading.replace(/^\d+(\.\d+)*\.?\s*/, '') || 'Untitled'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={section.isFullWidth ? 'full' : '2col'}
                            onValueChange={(value) =>
                              setDraft((prev) => ({
                                ...prev,
                                sections: prev.sections.map((s) =>
                                  s.id === section.id ? { ...s, isFullWidth: value === 'full' } : s
                                ),
                              }))
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full">1-column</SelectItem>
                              <SelectItem value="2col">2-column</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); setActiveSectionId(section.id); setTimeout(removeActiveSection, 0); }}
                            disabled={draft.sections.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Heading input */}
                      <div className="mb-3">
                        <Input
                          value={section.heading}
                          placeholder="Section heading"
                          className="bg-white text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              sections: prev.sections.map((s) =>
                                s.id === section.id ? { ...s, heading: e.target.value } : s
                              ),
                            }))
                          }
                        />
                      </div>

                      {/* TipTap editor */}
                      <SectionEditor
                        content={section.cleaned}
                        onChange={(html) =>
                          setDraft((prev) => ({
                            ...prev,
                            sections: prev.sections.map((s) =>
                              s.id === section.id
                                ? { ...s, cleaned: html, status: html.trim() ? 'complete' : 'missing' }
                                : s
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

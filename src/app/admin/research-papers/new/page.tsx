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
import { extractStructuredDataFromDocx } from '@/lib/research-papers/docx-extractor';

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
  bodyColumnMode?: 'two-column' | 'single-column' | null;
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
    bodyColumnMode: 'two-column',
    sections: [
      { id: 'abstract', heading: 'Abstract', original: '', cleaned: '', notes: [], status: 'missing', isFullWidth: true },
    ],
  };
}

export default function NewResearchPaperPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || '';
  const isEditMode = !!editId;
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<ResearchPaperDraft>(blankDraft());
  const [draftId, setDraftId] = useState(searchParams.get('id') || '');
  const [activeSectionId, setActiveSectionId] = useState('abstract');
  const [issueId, setIssueId] = useState('');
  const [issues, setIssues] = useState<AdminIssue[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(!!searchParams.get('id'));
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewingPdf, setIsPreviewingPdf] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'local' | 'gemini' | 'zai' | 'basic' | 'done'>('idle');
  const [extractionMethod, setExtractionMethod] = useState<'gemini' | 'zai' | 'basic' | null>(null);
  const [extractionMode, setExtractionMode] = useState<'auto' | 'gemini' | 'zai' | 'basic'>('auto');
  const [paperStatus, setPaperStatus] = useState<string>('DRAFT');
  const [paperType, setPaperType] = useState<string>('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState<Blob | null>(null);
  const [uploadedPdfFile, setUploadedPdfFile] = useState<File | null>(null);
  const [pdfChoice, setPdfChoice] = useState<'generated' | 'uploaded' | null>(null);

  if (!isAdmin()) {
    redirect('/dashboard');
  }

  if (isDraftLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading paper data...</p>
        </div>
      </div>
    );
  }

  const activeSectionIndex = Math.max(
    draft.sections.findIndex((section) => section.id === activeSectionId),
    0,
  );
  const active = draft.sections[activeSectionIndex];
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const generatedPdfSignatureRef = useRef('');

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
        setIsDraftLoading(true);
        setError('');
        const response = await fetch(`/api/admin/research-papers/${draftId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load draft');
        applyExtractedData(data.draft);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load draft');
      } finally {
        setIsDraftLoading(false);
      }
    };

    fetchDraft();
  }, [draftId]);

  useEffect(() => {
    if (!editId) return;

    const fetchPaper = async () => {
      try {
        setError('');
        const response = await fetch(`/api/admin/papers/${editId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load paper');

        const paper = data.paper;
        setIssueId(paper.issueId || '');
        setPaperStatus(paper.status || 'PUBLISHED');
        setPaperType(paper.paperType || '');

        const keywords = paper.keywords
          ? paper.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];

        const authors = (paper.paperAuthors || []).map((pa: any) => ({
          name: `${pa.user.firstName} ${pa.user.lastName}`.trim(),
          email: pa.user.email || '',
          affiliation: '',
          corresponding: pa.isCorresponding,
        }));

        setDraft((prev) => ({
          ...prev,
          title: paper.title || '',
          abstract: paper.abstract || '',
          keywords,
          authors,
          doi: paper.doi || '',
          category: paper.category || '',
          bodyColumnMode: 'two-column',
          sections: [
            { id: 'abstract', heading: 'Abstract', original: paper.abstract || '', cleaned: paper.abstract || '', notes: [], status: 'complete', isFullWidth: true },
          ],
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load paper');
      }
    };

    fetchPaper();
  }, [editId]);

  const reset = () => {
    setFile(null);
    setDraft(blankDraft());
    setDraftId('');
    setIssueId('');
    setActiveSectionId('abstract');
    setIsProcessing(false);
    setMessage('');
    setError('');
    setGeneratedPdfBlob(null);
    generatedPdfSignatureRef.current = '';
    setUploadedPdfFile(null);
    setPdfChoice(null);
  };

  const analyze = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setExtractionMethod(null);
    setExtractionStatus('local');

    try {
      const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      if (extension !== '.docx') {
        throw new Error('Automatic local extraction currently supports DOCX files only.');
      }

      console.log('[STEP 1] DOCX local read start — file:', file.name, 'size:', file.size, 'bytes');
      const structured = await extractStructuredDataFromDocx(await file.arrayBuffer(), extension);
      console.log('[STEP 1] DOCX local read done — sections found:', structured.sections.length, '| DB: NOT touched | R2: NOT touched');

      // Keep original HTML sections (with base64 images) in browser — never send to server
      const originalSectionsWithImages = structured.sections.map((s) => ({ ...s }));

      // Strip base64 images from structured before sending to AI server (reduce payload)
      const structuredForAi = {
        ...structured,
        sections: structured.sections.map((s) => ({
          ...s,
          content: s.content.replace(/<img[^>]*>/gi, ''),
        })),
        rawHtml: structured.rawHtml.replace(/<img[^>]*>/gi, ''),
      };

      setExtractionStatus(extractionMode === 'zai' ? 'zai' : extractionMode === 'basic' ? 'basic' : 'gemini');

      console.log('[STEP 2] AI extract start — mode:', extractionMode, '| sending to server (no DB, no R2)');
      const response = await fetch('/api/admin/research-papers/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured: structuredForAi,
          sourceFileName: file.name,
          sourceFileSize: file.size,
          extractionMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI extraction failed');

      console.log('[STEP 2] AI extract done — method:', data.extractionMethod, '| DB: NOT touched | R2: NOT touched');
      setExtractionMethod(data.extractionMethod);
      setExtractionStatus('done');

      // Merge AI metadata with original HTML sections (which have images)
      const mergedData = {
        ...data.extractedData,
        sections: originalSectionsWithImages.map((s, i) => ({
          heading: data.extractedData.sections[i]?.heading || s.heading,
          content: s.content, // original HTML with base64 images
          isFullWidth: true,
        })),
      };
      applyExtractedData(mergedData);
      console.log('[STEP 2] Data applied to local state — sections have HTML with images');
    } catch (err) {
      setExtractionStatus('idle');
      setError(err instanceof Error ? err.message : 'Failed to read file');
      console.error('[STEP 1/2] ERROR:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyExtractedData = (extractedData: {
    title: string;
    abstract: string;
    keywords: string[];
    bodyColumnMode?: 'two-column' | 'single-column' | null;
    authors: Array<{ name: string; email: string; affiliation: string; isCorresponding: boolean; authorOrder: number }>;
    sections: Array<{ heading: string; content: string; isFullWidth: boolean }>;
    sourceFileName: string;
    sourceFileSize: number;
  }) => {
    const mappedSections = extractedData.sections.length > 0
      ? extractedData.sections.map((section, index) => ({
          id: `section-${index}`,
          heading: section.heading,
          original: section.content,
          cleaned: section.content,
          notes: [],
          status: section.content.trim() ? 'complete' as const : 'missing' as const,
          isFullWidth: section.isFullWidth ?? true,
        }))
      : blankDraft().sections;

    setDraft({
      jobId: '',
      fileName: extractedData.sourceFileName || '',
      fileSize: extractedData.sourceFileSize || 0,
      title: extractedData.title || '',
      abstract: extractedData.abstract || '',
      keywords: extractedData.keywords || [],
      authors: extractedData.authors.map((author) => ({
        name: author.name,
        email: author.email || '',
        affiliation: author.affiliation || '',
        corresponding: author.isCorresponding,
      })),
      doi: '',
      issueId: '',
      category: '',
      detectedMode: 'implementation',
      confidence: 0,
      similarityScore: 0,
      bodyColumnMode: extractedData.bodyColumnMode === 'single-column' ? 'single-column' : 'two-column',
      sections: mappedSections,
    });
    setActiveSectionId(mappedSections[0]?.id || 'section-0');
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
    bodyColumnMode: draft.bodyColumnMode,
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

  const buildPdfPayload = () => {
    const issueData = selectedIssue
      ? {
          volume: selectedIssue.volume,
          issueNumber: selectedIssue.issueNumber,
          year: selectedIssue.year,
          publishDate: new Date().toISOString(),
        }
      : null;

    return {
      title: draft.title,
      abstract: draft.abstract,
      keywords: draft.keywords,
      doi: draft.doi || undefined,
      authors: draft.authors.map((a) => ({
        name: a.name,
        email: a.email || undefined,
        affiliation: (a as any).affiliation || undefined,
      })),
      bodyColumnMode: draft.bodyColumnMode,
      sections: draft.sections.map((s) => ({
        heading: s.heading,
        content: s.cleaned,
        isFullWidth: s.isFullWidth ?? true,
      })),
      issue: issueData,
    };
  };

  const getPdfSignature = () => JSON.stringify(buildPdfPayload());

  const generatePdfBlob = async () => {
    const signature = getPdfSignature();
    if (generatedPdfBlob && generatedPdfSignatureRef.current === signature) {
      console.log('[STEP 3] PDF already generated (cached) — skipping regeneration | DB: NOT touched | R2: NOT touched');
      return generatedPdfBlob;
    }

    console.log('[STEP 3] PDF generate start — sending local state to server (Playwright) | DB: NOT touched | R2: NOT touched');
    const response = await fetch('/api/admin/research-papers/preview-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: signature,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate PDF preview');
    }

    const blob = await response.blob();
    setGeneratedPdfBlob(blob);
    generatedPdfSignatureRef.current = signature;
    if (pdfChoice !== 'uploaded') setPdfChoice('generated');
    console.log('[STEP 3] PDF generate done — blob size:', blob.size, 'bytes | DB: NOT touched | R2: NOT touched');
    return blob;
  };

  const createPaper = async () => {
    setSubmitAttempted(true);

    if (!draft.title) {
      setError('Title is required before submitting.');
      return;
    }
    if (paperStatus === 'PUBLISHED' && !issueId) {
      setError('Please select an issue before publishing.');
      return;
    }
    if (!draft.abstract) {
      setError('Abstract is required before submitting.');
      return;
    }
    if (draft.authors.filter((a) => a.name.trim()).length === 0) {
      setError('At least one author is required.');
      return;
    }
    if (draft.sections.filter((s) => s.heading || s.cleaned).length === 0) {
      setError('At least one section is required.');
      return;
    }
    if (!file) {
      setError('DOCX file is required. Please re-upload the file before submitting.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setMessage('');

      const authors = draft.authors
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          email: a.email?.trim() || null,
          affiliation: (a as any).affiliation?.trim() || null,
          isCorresponding: a.corresponding,
        }));

      // Plain text only — no HTML, no images — for DB
      const sections = draft.sections
        .filter((s) => s.heading || s.cleaned)
        .map((s) => ({
          heading: s.heading.trim(),
          content: s.cleaned.replace(/<img[^>]*>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          isFullWidth: s.isFullWidth ?? true,
        }));

      // PDF generate karo (cached ho to instant, nahi to fresh)
      console.log('[STEP 4a] PDF generate/fetch from cache start');
      const pdfBlob = await generatePdfBlob();
      console.log('[STEP 4a] PDF ready — size:', pdfBlob.size, 'bytes');

      console.log('[STEP 4b] Submit start —', {
        title: draft.title,
        authors: authors.length,
        sections: sections.length,
        keywords: draft.keywords.length,
        issueId,
        docx: file.name,
        pdf: pdfBlob.size + ' bytes',
        'DB': 'WILL BE CREATED NOW',
        'R2': 'DOCX + PDF WILL BE UPLOADED',
      });

      const submitData = new FormData();
      submitData.append('title', draft.title);
      submitData.append('abstract', draft.abstract || '');
      submitData.append('keywords', JSON.stringify(draft.keywords.filter(Boolean)));
      submitData.append('authors', JSON.stringify(authors));
      submitData.append('sections', JSON.stringify(sections));
      submitData.append('bodyColumnMode', draft.bodyColumnMode || 'two-column');
      submitData.append('status', paperStatus);
      if (issueId) submitData.append('issueId', issueId);
      if (draft.doi) submitData.append('doi', draft.doi);
      submitData.append('sourceFileName', file.name);
      submitData.append('sourceFileSize', String(file.size));
      submitData.append('docx', file);
      submitData.append('pdf', pdfBlob, 'paper.pdf');

      const response = await fetch('/api/admin/research-papers/submit', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit paper');

      console.log('[STEP 4] Submit done —', {
        draftId: data.draft?.id,
        status: data.draft?.status,
        sourceFilePath: data.draft?.sourceFilePath,
        sectionsInDB: data.draft?.sections?.length,
        authorsInDB: data.draft?.authors?.length,
        'DB': 'ResearchPaperDraft CREATED ✅',
        'R2': 'DOCX uploaded ✅',
        'PDF': 'NOT saved ✅',
      });

      setMessage('Paper published successfully!');
      router.push(`/admin/research-papers/${data.draft.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit paper');
      console.error('[STEP 4] Submit ERROR:', err);
    } finally {
      setIsSaving(false);
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
    if (!draft.title) {
      setError('Title is required before previewing.');
      return;
    }

    const loadingHtml = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Generating PDF...</title>
          <style>
            html, body {
              margin: 0;
              min-height: 100vh;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, sans-serif;
            }
            body {
              display: grid;
              place-items: center;
            }
            .wrap {
              text-align: center;
            }
            .spinner {
              width: 34px;
              height: 34px;
              margin: 0 auto 14px;
              border: 3px solid #cbd5e1;
              border-top-color: #0f172a;
              border-radius: 999px;
              animation: spin 0.8s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="spinner"></div>
            <div style="font-size:15px;font-weight:700">Generating PDF...</div>
            <div style="margin-top:6px;font-size:12px;color:#64748b">Please keep this tab open.</div>
          </div>
        </body>
      </html>
    `;
    const loadingUrl = URL.createObjectURL(new Blob([loadingHtml], { type: 'text/html' }));
    const previewWindow = window.open(loadingUrl, '_blank');

    try {
      setIsPreviewingPdf(true);
      setError('');

      const blob = await generatePdfBlob();
      const url = URL.createObjectURL(blob);
      if (previewWindow) {
        URL.revokeObjectURL(loadingUrl);
        previewWindow.location.href = url;
        previewWindow.focus();
      } else {
        window.open(url, '_blank');
        URL.revokeObjectURL(loadingUrl);
      }
    } catch (err) {
      URL.revokeObjectURL(loadingUrl);
      if (previewWindow) previewWindow.close();
      setError(err instanceof Error ? err.message : 'Failed to generate PDF preview');
    } finally {
      setIsPreviewingPdf(false);
    }
  };

  const downloadPdf = async () => {
    if (!draft.title) {
      setError('Title is required before downloading.');
      return;
    }

    try {
      setIsPreviewingPdf(true);
      setError('');

      const blob = await generatePdfBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${draft.title.slice(0, 50)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsPreviewingPdf(false);
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
                <Link href="/admin/papers">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{isEditMode ? 'Edit Research Paper' : 'Add Research Paper'}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isEditMode ? 'Update paper details, regenerate PDF and submit changes.' : 'Upload the manuscript, review the extracted details, and prepare the paper for journal formatting.'}
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
                    if (selected) {
                      setFile(selected);
                      setGeneratedPdfBlob(null);
                      generatedPdfSignatureRef.current = '';
                      setPdfChoice(null);
                    }
                  }}
                />
              </label>

              <div className="mt-4 space-y-3">
                <div className="flex gap-1">
                  {(['auto', 'gemini', 'zai', 'basic'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExtractionMode(mode)}
                      className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        extractionMode === mode
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {mode === 'auto' ? 'Auto' : mode === 'basic' ? 'No AI' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={analyze} disabled={!file || isProcessing}>
                    <FileText className="h-4 w-4" />
                    {isProcessing ? 'Reading file...' : 'Read file'}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/research-papers/pdf-template">Template</Link>
                  </Button>
                </div>
              </div>

              {/* Extraction status — dynamic steps */}
              {isProcessing && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 text-sm">
                  <div className={`flex items-center gap-2 ${extractionStatus === 'local' ? 'text-slate-700' : 'text-slate-400'}`}>
                    {extractionStatus === 'local'
                      ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-500 border-t-transparent" />
                      : <span className="h-3 w-3 rounded-full bg-emerald-300" />}
                    Reading DOCX locally...
                  </div>
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
                    <SelectTrigger className={submitAttempted && paperStatus === 'PUBLISHED' && !issueId ? 'border-red-400 ring-1 ring-red-400' : ''}>
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
                  {submitAttempted && paperStatus === 'PUBLISHED' && !issueId && (
                    <p className="mt-1 text-xs text-red-600">Issue is required when status is Published.</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
                  <Select value={paperStatus} onValueChange={setPaperStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="EDITING">Editing</SelectItem>
                      <SelectItem value="READY">Ready</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Paper Type</label>
                  <Select value={paperType || 'none'} onValueChange={(value) => setPaperType(value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="REVIEW">Review Paper</SelectItem>
                      <SelectItem value="IMPLEMENTATION">Implementation Paper</SelectItem>
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
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={author.corresponding || false}
                          onChange={(event) =>
                            setDraft((prev) => {
                              const authors = [...prev.authors];
                              authors[index] = { ...authors[index], corresponding: event.target.checked };
                              return { ...prev, authors };
                            })
                          }
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-slate-600">Corresponding author</span>
                      </label>
                    </div>
                  ))
                )}
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
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border border-slate-200 bg-slate-50 p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.bodyColumnMode === 'two-column' ? 'default' : 'ghost'}
                      className={`h-8 px-3 text-xs ${draft.bodyColumnMode === 'two-column' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900'}`}
                      onClick={() => setDraft((prev) => ({ ...prev, bodyColumnMode: 'two-column' }))}
                    >
                      2 Column
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={draft.bodyColumnMode === 'single-column' ? 'default' : 'ghost'}
                      className={`h-8 px-3 text-xs ${draft.bodyColumnMode === 'single-column' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900'}`}
                      onClick={() => setDraft((prev) => ({ ...prev, bodyColumnMode: 'single-column' }))}
                    >
                      1 Column
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={addSection}>
                    <Plus className="h-4 w-4" />
                    Add section
                  </Button>
                </div>
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
                  {draft.sections.map((section, index) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <div
                        key={section.id}
                        ref={(el) => { sectionRefs.current[section.id] = el; }}
                        className={`p-6 cursor-pointer transition-colors ${isActive ? 'bg-white' : 'bg-slate-50 hover:bg-white'}`}
                        onClick={() => setActiveSectionId(section.id)}
                      >
                        {/* Section header */}
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Section {index + 1}</p>
                            <h3 className="mt-1 text-base font-semibold text-slate-900">
                              {section.heading.replace(/^\d+(\.\d+)*\.?\s*/, '') || 'Untitled'}
                            </h3>
                          </div>
                          {isActive && (
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
                                onClick={(e) => { e.stopPropagation(); setTimeout(removeActiveSection, 0); }}
                                disabled={draft.sections.length <= 1}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Active: show editor | Inactive: show preview */}
                        {isActive ? (
                          <>
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
                          </>
                        ) : (
                          <div
                            className="prose prose-sm max-w-none text-slate-600 line-clamp-3 text-xs"
                            dangerouslySetInnerHTML={{ __html: section.cleaned || '<p class="text-slate-400 italic">Empty section — click to edit</p>' }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Preview & Submit</h2>
                <p className="mt-0.5 text-xs text-slate-500">{selectedIssue ? selectedIssue.title : 'Issue can be assigned later'}</p>
              </div>

              {/* Preview / Download */}
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1" disabled={!draft.title || isPreviewingPdf || isSaving} onClick={previewPdf}>
                  <Eye className="h-4 w-4" />
                  {isPreviewingPdf ? 'Generating...' : 'Preview PDF'}
                </Button>
                <Button variant="outline" className="flex-1" disabled={!draft.title || isPreviewingPdf || isSaving} onClick={downloadPdf}>
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>

              <Button
                className="mt-4 w-full bg-green-700 hover:bg-green-800"
                disabled={!draft.title || isSaving || isPreviewingPdf}
                onClick={createPaper}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Publishing...' : 'Publish Paper'}
              </Button>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

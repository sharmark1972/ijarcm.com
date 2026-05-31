# Research Paper Studio — Code Audit

> Last updated: 2026-05-31
> Scope: DOCX upload, AI extraction, admin editor, PDF generation, publish flow

---

## System Overview

Admin uploads a DOCX research paper → AI extracts metadata + decides layout → admin reviews/edits → PDF preview → publish.

**Full flow:**
```
DOCX upload (POST /api/admin/research-papers/upload)
    ↓
storage.ts → validateResearchPaperFile() → storeResearchPaperFile() → R2
    ↓
docx-extractor.ts → extractDocumentHtmlFromBuffer() [mammoth, single HTML]
                  → extractStructuredDataFromDocx() [sections, authors, abstract]
    ↓
parser.ts → parseResearchPaperText() [title, authors, affiliation, abstract, keywords]
    ↓
gemini-extractor.ts → tryGeminiOnly() [Gemini metadata]
                    → tryZaiOnly()    [ZAI fallback]
                    → basic regex    [last fallback]
    ↓
gemini-extractor.ts → getLayoutDecisions() [AI per-section layout]
    ↓
research-paper-service.ts → buildSectionsWithLayout() [AI layout → fallback to layout-analyzer.ts]
    ↓
DB save: ResearchPaperDraft + ResearchPaperAuthor + ResearchPaperSection
    ↓
SSE done event → Admin editor (page.tsx)
    ↓
Admin reviews, edits sections → PATCH /api/admin/research-papers/[id]
    ↓
Preview PDF → POST /api/admin/research-papers/[id]/generate-preview-pdf
    ↓
Publish → POST /api/admin/research-papers/[id]/publish → final PDF → PUBLISHED status
```

---

## Database Models

**`ResearchPaperDraft`**
```
id, title, shortTitle, abstract, keywords (Json),
doi, sourceFilePath, sourceFileName, sourceFileSize,
extractedText (raw HTML), pdfPath, previewPdfPath,
status (DRAFT/EXTRACTED/EDITING/PDF_GENERATED/PUBLISHED),
issueId (FK), createdBy (FK), publishedAt
```

**`ResearchPaperAuthor`**
```
id, draftId (FK), name, email, affiliation,
authorOrder, isCorresponding
```

**`ResearchPaperSection`**
```
id, draftId (FK), heading, content (LongText HTML),
sectionOrder, isFullWidth (Boolean, default: true)
```

---

## All Files — What Each Does

### `src/lib/research-papers/types.ts`
Central type definitions for the research paper system:
- `ParsedResearchPaper` — shape of extracted data (title, abstract, keywords, authors[], sections[])
- `ResearchPaperDraftUpdateInput` — PATCH body shape for updating a draft
- `StoredResearchPaperFile` — shape returned after R2 upload (originalName, fileUrl, size, extension)

---

### `src/lib/research-papers/storage.ts`
File validation and R2 upload for source DOCX files:
- `validateResearchPaperFile(file)` — checks extension (.docx/.doc only) and size (max 25MB)
- `storeResearchPaperFile(file, buffer?)` — sanitizes filename, uploads to R2 under `research-papers/sources/{uuid}/`, returns `StoredResearchPaperFile`
- `removeStoredResearchPaperFile(filePath?)` — deletes from R2 (HTTP URL) or local `public/` (legacy path)

---

### `src/lib/research-papers/parser.ts`
Pure text parser — used internally by `docx-extractor.ts` as basic fallback when AI is unavailable:
- `parseResearchPaperText(text)` — full parse: title detection, author splitting, affiliation grouping, abstract, keywords, sections
- **Title detection:** finds first non-meta, non-affiliation line in top block; handles multi-line titles
- **Author detection:** splits on comma/semicolon/`and`/`&`; strips `(Supervisor)`, `(Guide)` etc.
- **Affiliation detection:** matches known patterns (Department, Faculty, University, India, Punjab etc.)
- **Section detection:** matches known headings (Introduction, Methodology, Results, Conclusion, References...) and numbered headings (`1. Introduction`, `2.1 Sub...`)
- **Subsections:** `2.1 Sub` merged into parent section content as `<h4>` — not a separate DB section
- **Keywords:** split on comma/semicolon/pipe, max 12

---

### `src/lib/research-papers/docx-extractor.ts`
DOCX → structured data. Entry point for upload pipeline:
- `extractDocumentHtmlFromBuffer(buffer, ext)` — runs mammoth with styleMap + image base64 encoding → returns raw HTML string
- `extractStructuredDataFromDocx(buffer, ext)` — calls above + parses HTML into structured sections:
  - Uses `<p><strong>` pattern to detect headings (NOT Word styles — real DOCX docs don't use heading styles reliably)
  - Returns `{ title, authors, affiliation, abstract, keywords, sections[], rawHtml }`
- **Note:** mammoth runs once (single extraction) — no dual extraction

---

### `src/lib/research-papers/gemini-extractor.ts`
AI metadata extraction + AI layout decisions. Two separate concerns:

**Types exported:**
- `GeminiExtractedData` — `{ title, authors[], affiliation, email, abstract, keywords, extractionMethod }`
- `SectionLayout` — `{ heading, layout: 'two-column'|'full-width', reason }`

**Metadata functions:**
- `tryGeminiOnly(plainText)` — sends `METADATA_PROMPT` to `gemini-2.5-flash-lite`, parses JSON response
- `tryZaiOnly(plainText)` — sends same prompt to ZAI (`GLM-4.7-Flash`) via OpenAI-compatible API at `https://api.zai.com/v1`
- Both return `GeminiExtractedData | null` — null means failed/quota

**Layout functions:**
- `getLayoutDecisions(sections[])` — sends `LAYOUT_PROMPT` to Gemini → ZAI fallback; returns `SectionLayout[]`
- `LAYOUT_PROMPT` rules (enforced by AI):
  1. Section has table/image → `full-width`
  2. Plain text → `two-column`
  3. Total two-column count is odd → last one becomes `full-width` (balance)
  4. Abstract, References, Bibliography, Conclusion, Acknowledgements → always `full-width`

**Keys needed in `.env`:**
```
GEMINI_API_KEY=...    # Google Gemini
ZAI_API_KEY=...       # ZAI (GLM) fallback
```

**Known issue:** Gemini quota may be exhausted; ZAI balance may need recharge → system falls to basic regex.

---

### `src/lib/research-papers/layout-analyzer.ts`
Rule-based layout fallback — used when AI (`getLayoutDecisions`) fails:
- `analyzeSectionLayout(heading, htmlContent)` → `'full-width' | 'two-column'`
- Rules:
  - Known headings (Abstract, References, Conclusion, Acknowledgements) → full-width
  - Has `<img>` tag → full-width
  - Has `<table>` tag → full-width
  - Else → two-column
- **2000-char rule REMOVED** — was incorrectly making all long sections full-width

---

### `src/lib/research-papers/table-analyzer.ts`
HTML table utility (used by layout logic):
- `countTableColumns(tableHtml)` — counts `<th>` + `<td>` in first `<tr>`
- `isWideTable(tableHtml)` → `true` if 4+ columns

---

### `src/lib/research-papers/validation.ts`
Input validation before DB writes:
- `validateDraftUpdate(input)` — title max 700 chars, DOI max 200 chars
- `validatePublishReady(draft)` — title, issueId, abstract, authors (≥1), sections (≥1), all section headings non-empty — throws error with all messages joined

---

### `src/lib/research-papers/research-paper-service.ts`
Main service layer — all DB operations go through here:
- `createResearchPaperDraftFromUpload(file, createdBy, issueId, onStep)` — full upload pipeline:
  1. `onStep('gemini')` → try Gemini metadata
  2. `onStep('zai')` → try ZAI if Gemini failed
  3. `onStep('basic')` → use `extractStructuredDataFromDocx()` if both fail
  4. `buildSectionsWithLayout()` → AI or rule-based layout per section
  5. DB create: draft + authors + sections
- `buildSectionsWithLayout(sections[])` — calls `getLayoutDecisions()`, falls back to `analyzeSectionLayout()` per section
- `getResearchPaperDraft(id)` — fetch with authors + sections + issue (ordered)
- `listResearchPaperDrafts()` — all drafts, ordered by createdAt desc
- `updateResearchPaperDraft(id, input)` — validates → authors delete+recreate → sections delete+recreate → draft update
- `deleteResearchPaperDraft(id)` — deletes source file from R2, then DB cascade delete
- `publishResearchPaperDraft(id)` — validates publish-ready → `generateResearchPaperPdf(id, 'publish')` → status PUBLISHED + publishedAt

---

### `src/app/api/admin/research-papers/upload/route.ts`
SSE streaming upload endpoint — `POST /api/admin/research-papers/upload`:
- Reads multipart form data (file + optional issueId)
- Opens `ReadableStream` → streams SSE events to frontend
- Events sent:
  - `{ event: 'status', data: { step: 'gemini'|'zai'|'basic', message } }`
  - `{ event: 'done', data: { draft, extractionMethod } }`
  - `{ event: 'error', data: { message } }`
- Calls `createResearchPaperDraftFromUpload()` with `onStep` → each step triggers SSE status event

---

### `src/app/api/admin/research-papers/route.ts`
- `GET` — list all drafts (admin only)
- `POST` — not used (upload goes to `/upload`)

### `src/app/api/admin/research-papers/[id]/route.ts`
- `GET` — fetch single draft by id (admin only)
- `PATCH` — update draft (calls `updateResearchPaperDraft()`)
- `DELETE` — delete draft + source file

### `src/app/api/admin/research-papers/[id]/generate-preview-pdf/route.ts`
- `POST` — generates preview PDF → `generateResearchPaperPdf(id, 'preview')` → returns previewPdfPath

### `src/app/api/admin/research-papers/[id]/publish/route.ts`
- `POST` — calls `publishResearchPaperDraft(id)` → final PDF → status PUBLISHED

### `src/app/api/admin/research-papers/[id]/pdf/route.ts`
- `GET` — serves/redirects to the published PDF

---

### `src/lib/research-papers/pdf-service.ts`
PDF generation via Playwright headless Chrome:
- `generateResearchPaperPdf(draftId, mode: 'preview'|'publish')` — fetches draft → builds HTML → Playwright → R2 upload → returns URL
- `buildPdfHtml(draft)` — constructs full HTML document:
  - **Header:** ISSN box + Journal name + Logo (top of every page via `@page`)
  - **Title block:** Title (bold, centered) + Authors (centered) + Affiliation (centered, italic)
  - **Page 1 float layout:** `.pdf-article-info` (38% left float) + `.pdf-abstract-panel` (62% right float)
    - Article-Info: Received/Accepted/Published dates + Issue + DOI + Pages
    - Abstract: first 148 words, italic
    - Keywords: below abstract in right column, green left-border
  - **Body sections:** each section is either `.pdf-section-full` or `.pdf-section-two-col` based on `isFullWidth`
  - **Footer:** page number via Playwright `footerTemplate`
- Helper functions: `getFirstNWords()`, `getRemainingWords()`, `cleanTitle()`, `escapeHtml()`

---

### `src/components/admin/research-papers/pdf/research-paper-pdf.css`
CSS for PDF HTML output (loaded by Playwright):
- `.pdf-section-full` — full-width section (no columns)
- `.pdf-section-two-col` — 2-column section (`column-count: 2; column-gap: 18px`)
- `.pdf-section-heading` — heading style (`color: #315985`, bold, border-bottom)
- `.pdf-first-page-section` — float layout container (clearfix)
- `.pdf-article-info` — `float: left; width: 38%`
- `.pdf-abstract-panel` — `float: right; width: 62%`
- `.pdf-keywords` — `border-left: 3px solid green`, below abstract
- `.pdf-references-section` — full-width, `border-top`
- Images: `break-inside: avoid; page-break-inside: avoid; max-width: 100%`
- Tables: `page-break-inside: avoid`

**Known CSS bugs (not yet fixed):**
- `break-inside: avoid` on `.pdf-first-page-grid` and `.pdf-abstract-panel` → pushes page 1 content to page 2 (blank first page)
- `orphans/widows/hyphens` on `.pdf-abstract-panel p` → also causes blank page push

---

### `src/components/admin/research-papers/SectionEditor.tsx`
TipTap rich text editor for individual sections:
- Props: `{ content: string, onChange: (html) => void, size?: 'small'|'medium'|'large' }`
- Extensions: `StarterKit` (strike disabled) + `Underline` (separate extension)
- `immediatelyRender: false` — required for Next.js SSR (no hydration mismatch)
- Toolbar: Bold, Italic, Underline, H2, H3, Bullet list, Ordered list
- CSS: `./section-editor.css`
- **Known issue:** TipTap duplicate underline warning — `strike: false` is set in StarterKit but underline warning persists (not yet fixed)

---

### `src/app/admin/research-papers/new/page.tsx`
Admin editor page — the main UI for creating/editing a research paper draft:
- **Upload flow:** reads DOCX file → SSE stream → shows spinner per step (Gemini/ZAI/basic) → extraction method badge on completion
- **Editor UI:**
  - Continuous scroll — all sections visible at once
  - Active section = TipTap `SectionEditor`, inactive = HTML preview (only 1 editor mounted at a time)
  - Abstract word counter (X/148 words, red if over limit)
  - Per-section layout toggle: 1-col / 2-col select
  - Section reorder (up/down buttons)
- **Save:** PATCH `/api/admin/research-papers/[id]` on every save action
- **Preview PDF:** POST `/api/admin/research-papers/[id]/generate-preview-pdf`
- **Publish:** POST `/api/admin/research-papers/[id]/publish`
- State type: `BackendDraft` (local interface) + `ResearchPaperDraft` (from `@/types/research-paper-workflow`)

---

### `src/app/admin/research-papers/page.tsx`
Admin list page — shows all research paper drafts with status badges, links to editor.

---

## SSE Upload Flow (detailed)

```
Frontend                          Server (upload/route.ts)
────────                          ──────────────────────────
POST /upload (multipart)
                                  validateResearchPaperFile()
                                  storeResearchPaperFile() → R2

event: status { step:'gemini' }   onStep('gemini')
                                  tryGeminiOnly(plainText)
                                      ↓ success → aiResult set
                                      ↓ fail (quota/error)

event: status { step:'zai' }      onStep('zai')
                                  tryZaiOnly(plainText)
                                      ↓ success → aiResult set
                                      ↓ fail (balance/error)

event: status { step:'basic' }    onStep('basic')
                                  extractStructuredDataFromDocx()

                                  buildSectionsWithLayout()
                                  DB create (draft+authors+sections)

event: done { draft, method }  ←  stream end
```

---

## PDF Layout Structure

```
Page 1:
┌──────────────────────────────────────────┐
│  ISSN │ Journal Name Box │ Logo          │  ← header
├──────────────────────────────────────────┤
│         Title (center, bold)             │
│         Authors (center)                 │
│         Affiliation (center, italic)     │
├──────────────────────────────────────────┤
│ .pdf-article-info (38%) │ .pdf-abstract-panel (62%) │
│ Received:               │ [abstract text, 148w]     │
│ Accepted:               │ Keywords: [green border]  │
│ Published:              │                           │
│ Issue:                  │                           │
│ DOI:                    │                           │
└──────────────────────────────────────────┘

Page 2+:
┌──────────────────────────────────────────┐
│ [.pdf-section-two-col] Introduction      │  ← isFullWidth=false
│ left col text... │ right col text...     │
├──────────────────────────────────────────┤
│ [.pdf-section-full] Results (has table)  │  ← isFullWidth=true
│ full-width table...                      │
├──────────────────────────────────────────┤
│ [.pdf-section-full] References           │  ← always full-width
└──────────────────────────────────────────┘
```

---

## Environment Variables

```
GEMINI_API_KEY=...              # Google Gemini AI (gemini-2.5-flash-lite)
ZAI_API_KEY=...                 # ZAI fallback (GLM-4.7-Flash)
CLOUDFLARE_ACCESS_KEY_ID=...    # R2 storage
CLOUDFLARE_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_ENDPOINT=...
CLOUDFLARE_R2_BUCKET_NAME=...
CLOUDFLARE_R2_PUBLIC_URL=...    # Public URL prefix for uploaded files
```

---

## Known Issues

1. **TipTap duplicate underline warning** — `SectionEditor.tsx` — `StarterKit` includes underline; explicit `Underline` extension causes duplicate name warning. Not yet fixed.
2. **Gemini quota** — primary key quota may be exhausted; falls to ZAI or basic.
3. **ZAI balance** — ZAI key may need recharge; falls to basic extraction.
4. **PDF blank first page** — CSS `break-inside: avoid` on `.pdf-first-page-grid` and `.pdf-abstract-panel` pushes content to page 2. Fix: remove those rules from the CSS.
5. **Abstract double-render in PDF** — when abstract > 250 words, `isTruncated = true` causes abstract to render again as body section. Fix: remove the isTruncated re-render block in `pdf-service.ts`.
6. **Table corruption in PDF** — `mapSectionsToHtml()` slices HTML at heading boundaries; tables near section boundaries get cut → plain text. Complex fix needed.
7. **`.bak` files** — `docx-extractor.ts.bak`, `research-paper-service.ts.bak` in `src/lib/research-papers/` — safe to delete.

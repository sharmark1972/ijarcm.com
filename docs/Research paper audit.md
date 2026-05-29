# Research Paper Studio — Code Audit

> Last updated: 2026-05-29
> Scope: New research-paper workflow for DOCX upload, extraction, editing, preview, and journal-style PDF generation

---

## System Goal

The goal of the new Research Paper Studio is to convert uploaded DOCX manuscripts into cleaner, publishable research papers using the journal PDF format that was finalized during this session.

### Core rule

- Draft/save/edit/preview: issue is optional
- Publish: issue is mandatory

### Non-AI first

The current build is intentionally non-AI first. The initial focus is:

- DOCX upload
- structure extraction
- author/title/abstract/heading detection
- manual correction
- PDF preview
- final publish gating

AI cleanup, humanization, shortening/expansion, and plagiarism-oriented rewriting are planned as a later layer.

---

## Main User Flow

1. Admin opens `/admin/research-papers`
2. Admin clicks `Add Paper`
3. Admin uploads a DOCX manuscript on `/admin/research-papers/new`
4. Backend stores the file and extracts text
5. Parser detects title, abstract, keywords, authors, affiliation, and section headings
6. Admin manually corrects extracted data
7. Admin saves draft
8. Admin previews the paper in the journal PDF template
9. Admin can publish only after selecting an issue

---

## Frontend Pages

### Research paper list
**File:** `src/app/admin/research-papers/page.tsx`

**What it does:** Loads real drafts from the database and shows a list of research papers with title, issue, DOI, section count, and status.

### Add / edit paper
**File:** `src/app/admin/research-papers/new/page.tsx`

**What it does:** Main editor page for upload, extraction, manual edits, draft save, and PDF preview.

### PDF template preview
**File:** `src/app/admin/research-papers/pdf-template/page.tsx`

**What it does:** Browser preview for the final journal PDF design.

---

## Backend APIs

### List drafts
**File:** `src/app/api/admin/research-papers/route.ts`

**Method:** `GET /api/admin/research-papers`

### Upload DOCX
**File:** `src/app/api/admin/research-papers/upload/route.ts`

**Method:** `POST /api/admin/research-papers/upload`

### Get / update / delete draft
**File:** `src/app/api/admin/research-papers/[id]/route.ts`

**Methods:** `GET`, `PATCH`, `DELETE`

### Generate preview PDF
**File:** `src/app/api/admin/research-papers/[id]/generate-preview-pdf/route.ts`

**Method:** `POST`

### Serve preview/final PDF
**File:** `src/app/api/admin/research-papers/[id]/pdf/route.ts`

**Method:** `GET`

### Publish
**File:** `src/app/api/admin/research-papers/[id]/publish/route.ts`

**Method:** `POST`

---

## Service Layer

**Files:**

- `src/lib/research-papers/storage.ts`
- `src/lib/research-papers/docx-extractor.ts`
- `src/lib/research-papers/parser.ts`
- `src/lib/research-papers/research-paper-service.ts`
- `src/lib/research-papers/pdf-service.ts`
- `src/lib/research-papers/validation.ts`
- `src/lib/research-papers/types.ts`

### Important packages

- `mammoth` for DOCX raw text extraction
- `playwright` for PDF rendering

---

## Database Models

### Prisma models added

- `ResearchPaperDraft`
- `ResearchPaperAuthor`
- `ResearchPaperSection`

### Status enum

- `DRAFT`
- `UPLOADED`
- `EXTRACTED`
- `EDITING`
- `READY`
- `PDF_GENERATED`
- `PUBLISHED`

### Important rules

- `issueId` is optional for draft and preview
- `issueId` is required before publish
- title, abstract, authors, and sections are stored in a dedicated research-paper draft structure

---

## Parser Notes

The parser is intentionally heuristic-based and non-AI for now.

### What it currently tries to detect

- title
- abstract
- keywords
- authors
- affiliation/address block
- section headings

### Important parser corrections already done

- false heading detection was tightened
- measurement-like lines such as `5 cm/hr` are no longer treated as headings
- authors are separated more strictly from address/affiliation lines
- abstract marker supports inline form like `Abstract:`

### Remaining principle

The parser should remain conservative:

- if something is uncertain, let the user correct it manually
- do not silently create noisy authors or noisy headings

---

## PDF Template Notes

The journal PDF design was finalized in the browser preview and is intended to be reused for the actual PDF generation.

### Final design characteristics

- journal-style A4 layout
- top masthead with ISSN + journal name + logo
- title centered
- authors and affiliation beneath title
- `Article Info` and `Abstract` split section on first page
- paper body follows after the first-page block
- footer with journal name and website

### Important known issue

At the moment, the generated PDF is still showing blank pages because the PDF generation HTML and the preview template are not yet fully aligned. The actual PDF generation must reuse the same final template structure instead of building a separate mismatched HTML string.

---

## Current Status

### Working

- admin research-paper list page is wired to the database
- upload/read flow is wired to backend APIs
- draft save flow exists
- parser has been improved for title, abstract, headings, and authors
- publish requires an issue

### Still being aligned

- PDF generator must reuse the final preview template exactly
- generated PDF still needs to be fully integrated with the finalized design
- edge cases for authors and affiliations may still require additional sample testing

---

## Useful Source Files

### Frontend
- `src/app/admin/research-papers/page.tsx`
- `src/app/admin/research-papers/new/page.tsx`
- `src/app/admin/research-papers/pdf-template/page.tsx`

### APIs
- `src/app/api/admin/research-papers/route.ts`
- `src/app/api/admin/research-papers/upload/route.ts`
- `src/app/api/admin/research-papers/[id]/route.ts`
- `src/app/api/admin/research-papers/[id]/generate-preview-pdf/route.ts`
- `src/app/api/admin/research-papers/[id]/pdf/route.ts`
- `src/app/api/admin/research-papers/[id]/publish/route.ts`

### Services
- `src/lib/research-papers/parser.ts`
- `src/lib/research-papers/research-paper-service.ts`
- `src/lib/research-papers/pdf-service.ts`
- `src/lib/research-papers/validation.ts`

### PDF UI
- `src/components/admin/research-papers/pdf/ResearchPaperPdfPreview.tsx`
- `src/components/admin/research-papers/pdf/research-paper-pdf.css`

---

## Notes for Future Work

If a new chat needs to continue this project, the next natural steps are:

1. Align `pdf-service.ts` with the finalized PDF preview template
2. Retest preview PDF generation end-to-end
3. Continue refining parser edge cases only if a real sample fails
4. Add AI cleanup later, after the non-AI workflow is stable


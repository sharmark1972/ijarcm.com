# IJARCM — DOCS Index

> This index is for AI agents. Read this file first to find relevant files without scanning the entire codebase.
> Each section lists what the file does and which source files are involved.
> Last updated: 2026-05-31

---

## How to Use This Index

1. **Start here** — find the system you need in the sections below
2. **Go to the audit file** — each system has a link to its full audit
3. **Read only the source file you need** — don't scan the whole `src/` directory
4. **After making changes** — update the relevant DOCS file

---

## Research Paper Studio

**Full details:** [Research Paper audit.md](./Research%20Paper%20audit.md)

### Files Map

| What you need | File |
|---------------|------|
| Types / interfaces | `src/lib/research-papers/types.ts` |
| File validation + R2 upload | `src/lib/research-papers/storage.ts` |
| Text parser (basic fallback) | `src/lib/research-papers/parser.ts` |
| DOCX → HTML extraction | `src/lib/research-papers/docx-extractor.ts` |
| AI metadata + layout (Gemini/ZAI) | `src/lib/research-papers/gemini-extractor.ts` |
| Rule-based layout fallback | `src/lib/research-papers/layout-analyzer.ts` |
| Table column counter | `src/lib/research-papers/table-analyzer.ts` |
| Input validation (title/DOI/publish) | `src/lib/research-papers/validation.ts` |
| Main service (all DB ops) | `src/lib/research-papers/research-paper-service.ts` |
| PDF generation (Playwright) | `src/lib/research-papers/pdf-service.ts` |
| PDF CSS | `src/components/admin/research-papers/pdf/research-paper-pdf.css` |
| TipTap section editor | `src/components/admin/research-papers/SectionEditor.tsx` |
| Admin editor page (UI) | `src/app/admin/research-papers/new/page.tsx` |
| Admin list page | `src/app/admin/research-papers/page.tsx` |
| Upload API (SSE streaming) | `src/app/api/admin/research-papers/upload/route.ts` |
| Fetch / update / delete draft | `src/app/api/admin/research-papers/[id]/route.ts` |
| Generate preview PDF | `src/app/api/admin/research-papers/[id]/generate-preview-pdf/route.ts` |
| Publish paper | `src/app/api/admin/research-papers/[id]/publish/route.ts` |
| Serve published PDF | `src/app/api/admin/research-papers/[id]/pdf/route.ts` |

### Quick Facts

- **Workflow:** DOCX upload → SSE stream → AI extract → admin edit → preview PDF → publish
- **DB models:** `ResearchPaperDraft`, `ResearchPaperAuthor`, `ResearchPaperSection`
- **Packages:** `mammoth` (DOCX), `playwright` (PDF), `@google/generative-ai` (Gemini), `aws-sdk` (R2)
- **Extraction chain:** mammoth (HTML) → Gemini metadata → ZAI fallback → basic regex fallback
- **Layout chain:** Gemini AI layout → ZAI fallback → `layout-analyzer.ts` rule-based
- **AI models:** `gemini-2.5-flash-lite` (Gemini), `GLM-4.7-Flash` (ZAI via OpenAI-compatible API)
- **SSE:** Upload streams real-time step status (gemini/zai/basic) to frontend
- **Abstract:** 148 words max — enforced in UI counter + AI prompt
- **PDF page 1:** Float layout — `.pdf-article-info` 38% left + `.pdf-abstract-panel` 62% right
- **PDF body:** Per-section column control via `isFullWidth` — `pdf-section-full` or `pdf-section-two-col`
- **Layout rules:** Table/image → full-width; plain text → 2-col; odd last 2-col → full-width; Abstract/References/Conclusion → always full-width
- **Storage:** Source DOCX files in Cloudflare R2 under `research-papers/sources/{uuid}/`
- **Known issues:** TipTap underline warning, Gemini quota, PDF blank page (CSS), abstract double-render

---

## Certificate System

**Full details:** [Code audit.md](./Code%20audit.md)

| What you need | File |
|---------------|------|
| Certificate UI/design/layout | `src/components/Certificate.tsx` |
| Certificate props/types/templates | `src/types/certificate.ts` |
| Admin generate certificate form | `src/app/admin/certificates/generate/page.tsx` |
| Admin certificates list | `src/app/admin/certificates/page.tsx` |
| Sample certificate (homepage preview) | `src/components/SampleCertificate.tsx` |
| Generate certificate API (create/list) | `src/app/api/certificates/route.ts` |
| HTML certificate for published papers | `src/app/api/papers/[id]/certificate/route.ts` |

### Quick Facts

- **Two systems:** React component (admin/preview) and HTML string (published papers)
- **Dimensions:** 1123×794px (A4 landscape at 96dpi)
- **Templates:** `classic` (gold/burgundy), `modern` (navy), `elegant` (emerald)
- **Certificate number format:** `IJARCM-{year}-{number}`
- **DB model:** `Certificate` table (Prisma)
- **Signature asset:** `public/managing-director-signature.png`
- **Admin sidebar:** Certificate must render outside `max-w-7xl` (sidebar = 256px / w-64)
- **Hybrid Conference:** Can select existing or create new conference inline during generation
- **Participation Type:** Dynamic dropdown for Conference certificates (Participation/Presentation/Both)
- **Compact Layout:** Certificate form fits in 3 rows with 2-column grid

---

## Shared Infrastructure

### Auth System

| What you need | File |
|---------------|------|
| NextAuth config (credentials provider) | `src/lib/auth.ts` |
| Auth API route | `src/app/api/auth/[...nextauth]/route.ts` |
| Register | `src/app/api/auth/register/route.ts` |
| Forgot/reset password | `src/app/api/auth/forgot-password/route.ts`, `reset-password/route.ts` |
| Session provider wrapper | `src/components/providers/SessionProvider.tsx` |

**Quick facts:**
- NextAuth with Prisma adapter + credentials (email/password)
- `bcryptjs` for password hashing
- Roles: `ADMIN`, `AUTHOR`, `REVIEWER`, `STUDENT` (from Prisma `UserRole` enum)
- Email must be verified (`isVerified`) before login allowed
- JWT encode/decode customized

---

### File Storage (R2)

| What you need | File |
|---------------|------|
| Core R2 upload/delete | `src/lib/r2-upload.ts` |
| Research paper file handling | `src/lib/research-papers/storage.ts` |

**Quick facts:**
- Cloudflare R2 via `aws-sdk` S3-compatible API (`s3ForcePathStyle: true`, `signatureVersion: v4`)
- Public URL: `CLOUDFLARE_R2_PUBLIC_URL/{folder}/{timestamp}-{filename}`
- Research paper sources: `research-papers/sources/{uuid}/{filename}`
- PDFs, covers, certificates also stored in R2

---

### Database

| What you need | File |
|---------------|------|
| Prisma client singleton | `src/lib/prisma.ts` |
| Schema + all models | `prisma/schema.prisma` |

---

### Email / SMTP

**Full details:** `SMTP_CONFIGURATION.md` in project root

| What you need | File |
|---------------|------|
| SMTP send utility | `src/lib/smtp.ts` |

---

## Other Systems (to be documented)

| System | Where to look |
|--------|---------------|
| Fees/Payment | `FEES_INDEX.md`, `FEES_SYSTEM_GUIDE.md` in project root |
| Papers / Submission | `src/app/api/papers/submit/route.ts`, `src/app/submit/page.tsx` |
| Admin papers (old system) | `src/app/admin/papers/`, `src/app/api/admin/papers/` |
| Issues management | `src/app/admin/issues/`, `src/app/api/admin/issues/` |
| Conferences | `src/app/admin/conferences/`, `src/app/api/admin/conferences/` |
| Reviews / Peer review | `src/app/api/reviews/`, `src/app/api/admin/reviews/` |
| Analytics | `src/app/admin/analytics/`, `src/app/api/admin/analytics/` |
| Announcements | `src/app/api/admin/announcements/`, `src/components/AnnouncementsDisplay.tsx` |
| Animations (festival) | `src/components/animations/`, `src/app/api/admin/animations/` |
| Chatbot | `src/lib/chatbot/` |
| SEO | `src/components/admin/SEODashboard.tsx`, `src/app/api/admin/seo/` |
| Ebooks | `src/app/admin/ebooks/`, `src/app/api/admin/ebooks/` |
| Article Generator | `src/app/article-generator/`, `src/app/api/article-generator/` |

---

## Project Root Files Reference

| File | Purpose |
|------|---------|
| `FEES_INDEX.md` | Index for fees/payment system docs |
| `FEES_SYSTEM_GUIDE.md` | Full fees system guide |
| `SMTP_CONFIGURATION.md` | Email/SMTP setup |
| `README.md` | General project readme |
| `QUICK_REFERENCE.md` | General quick reference |
| `prisma/schema.prisma` | All DB models — read this for data shapes |
| `src/DOCS/Code audit.md` | Certificate system full audit |
| `src/DOCS/Research Paper audit.md` | Research paper studio full audit |

# IJARCM - DOCS Index

> This index is for AI agents. Read this first before scanning source files.
> It maps the current working systems, the important files, and the main caveats.
> Last updated: 2026-06-04

---

## How To Use This Index

1. Start with the relevant system section below.
2. Read only the source files that are listed for that system.
3. After code changes, update this index and, if needed, `Code audit.md`.

---

## Research Paper Studio

### Current Working Flow

- DOCX is read locally in the browser from the selected file.
- Mammoth converts DOCX to HTML/structured data on the client.
- Browser sends only structured data to `/api/admin/research-papers/ai-extract` for AI enhancement.
- No DB write and no R2 write happen during extraction.
- Preview and download PDF use the temporary server PDF endpoint.
- Final submit saves the selected PDF to R2 and archives the original DOCX on submit only.
- PDF output uses the current block-based layout rules:
  - text flows in 2-column or 1-column mode depending on paper setting
  - tables and images stay full width
  - headings that start an image/table section stay full width
  - references remain 2-column unless the paper is set to 1-column
  - text in PDF is justified

### Files Map

| What you need | File |
|---|---|
| Research paper workflow types | `src/types/research-paper-workflow.ts` |
| Draft DB types and validation inputs | `src/lib/research-papers/types.ts` |
| Draft validation rules | `src/lib/research-papers/validation.ts` |
| DOCX parsing and structured extraction | `src/lib/research-papers/docx-extractor.ts` |
| AI enhancement helpers | `src/lib/research-papers/research-paper-service.ts` |
| Gemini / ZAI metadata extraction | `src/lib/research-papers/gemini-extractor.ts` |
| PDF HTML generation and Playwright render | `src/lib/research-papers/pdf-service.ts` |
| PDF CSS rules | `src/components/admin/research-papers/pdf/research-paper-pdf.css` |
| Section editor UI | `src/components/admin/research-papers/SectionEditor.tsx` |
| Admin research paper editor | `src/app/admin/research-papers/new/page.tsx` |
| Admin research paper list | `src/app/admin/research-papers/page.tsx` |
| Admin paper submit / edit target | `src/app/api/admin/papers/route.ts`, `src/app/api/admin/papers/[id]/route.ts` |
| Local extraction compatibility endpoint | `src/app/api/admin/research-papers/ai-extract/route.ts` |
| Research paper draft API | `src/app/api/admin/research-papers/route.ts`, `src/app/api/admin/research-papers/[id]/route.ts` |
| Research paper PDF preview API | `src/app/api/admin/research-papers/preview-pdf/route.ts` |
| Legacy research paper upload API | `src/app/api/admin/research-papers/upload/route.ts` |
| Publish draft API | `src/app/api/admin/research-papers/[id]/publish/route.ts` |
| Serve draft PDF / preview PDF | `src/app/api/admin/research-papers/[id]/pdf/route.ts` |

### Quick Facts

- Local-first extraction: the browser reads DOCX first, then only extracted JSON goes to AI.
- No extraction-time persistence: extraction does not save to DB or R2 anymore.
- Submit-time archival: source DOCX is uploaded to R2 only when the paper is submitted or updated in the admin paper submit flow.
- PDF preview is temporary: preview uses the server render endpoint and returns a blob; it is not saved as a permanent draft asset.
- Final paper storage: the selected PDF is stored via R2 in the admin papers submit route.
- Body column setting: paper-level `bodyColumnMode` controls `two-column` vs `single-column` body flow.
- Section-level layout toggle: `isFullWidth` still exists and is used for PDF rendering.
- PDF layout rule: text blocks are justified; tables and images remain full width; references stay 2-column by default.
- The old per-section extraction-time layout analyzer was removed from the active flow.

### AI Extraction — Prompt & Provider Details

**File:** `src/lib/research-papers/gemini-extractor.ts`

**How it works:**
- The **full extracted plain text** is sent to the AI (no character limit).
- Two providers are tried (in order based on which key is present in env):
  - **Gemini** — model `gemini-2.5-flash-lite`, env var `GEMINI_API_KEY`
  - **ZAI** — model `GLM-4.7-Flash`, API `https://api.z.ai/api/paas/v4/chat/completions`, env var `ZAI_API_KEY`
- Metadata extraction uses `METADATA_PROMPT`; section body rewriting uses `DOCUMENT_REWRITE_PROMPT` — both constants in that file.

**Fields extracted by the prompt:**

| Field | Rule |
|---|---|
| `title` | Clean title, no surrounding quotes |
| `authors` | Array of `{ name, isCorresponding }` — first author = corresponding; labels like (Supervisor) removed |
| `affiliation` | Full institutional affiliation (dept, university, location) |
| `email` | Corresponding author email, empty string if not found |
| `abstract` | **Rewritten** in AI's own words — NOT copied verbatim; max 148 words; enforced in code after parsing |
| `keywords` | Array of individual keyword strings |

**Abstract rewriting rules (in the prompt):**
- Rewrite completely — do not copy sentences verbatim
- Preserve original meaning, findings, methodology, conclusions
- Max 148 words, no filler phrases
- Clear, formal, academic English — no robotic/repetitive phrasing
- Plagiarism-free paraphrase

**Response format:** AI must return a raw JSON object only — no markdown, no explanation. Code strips any wrapping text with a regex before `JSON.parse`.

**Fallback:** If both providers fail or keys are missing, `extractionMethod` is set to `'basic'` and only the DOCX-extracted data is used.

### Known Caveats

- The legacy `/api/admin/research-papers/upload` route still exists for compatibility, but the current editor does not use it.
- The current PDF preview still depends on Playwright, so generation time is mostly server render time, not browser open time.
- `.docx` is the supported local extraction path in the current editor flow; `.doc` is treated as unsupported for automatic local extraction.

---

## Certificate System

**Full details:** [Code audit.md](./Code%20audit.md)

### Files Map

| What you need | File |
|---|---|
| Certificate React component | `src/components/Certificate.tsx` |
| Certificate types and constants | `src/types/certificate.ts` |
| Admin generate page | `src/app/admin/certificates/generate/page.tsx` |
| Admin certificates list | `src/app/admin/certificates/page.tsx` |
| Sample certificate preview | `src/components/SampleCertificate.tsx` |
| Certificate create/list API | `src/app/api/certificates/route.ts` |
| Published paper certificate HTML | `src/app/api/papers/[id]/certificate/route.ts` |

### Quick Facts

- Two parallel certificate systems still exist: React component and HTML string generator.
- The admin generate page supports conference creation inline.
- The HTML paper certificate route is separate from the React certificate system.

---

## Shared Infrastructure

### Auth

| What you need | File |
|---|---|
| NextAuth config | `src/lib/auth.ts` |
| Auth route | `src/app/api/auth/[...nextauth]/route.ts` |
| Register | `src/app/api/auth/register/route.ts` |
| Password reset flow | `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts` |
| Session provider | `src/components/providers/SessionProvider.tsx` |

### File Storage

| What you need | File |
|---|---|
| R2 upload/delete helpers | `src/lib/r2-upload.ts` |
| Research paper storage helpers | `src/lib/research-papers/storage.ts` |

### Database

| What you need | File |
|---|---|
| Prisma client singleton | `src/lib/prisma.ts` |
| All models and relations | `prisma/schema.prisma` |

### Email / SMTP

| What you need | File |
|---|---|
| SMTP helper | `src/lib/smtp.ts` |

---

## Other Systems

| System | Where to look |
|---|---|
| Fees / payment | `FEES_INDEX.md`, `FEES_SYSTEM_GUIDE.md` |
| Submission flow for public users | `src/app/submit/page.tsx`, `src/app/api/papers/submit/route.ts` |
| Admin papers (old paper management) | `src/app/admin/papers/`, `src/app/api/admin/papers/` |
| Issues management | `src/app/admin/issues/`, `src/app/api/admin/issues/` |
| Conferences | `src/app/admin/conferences/`, `src/app/api/admin/conferences/` |
| Reviews / peer review | `src/app/api/reviews/`, `src/app/api/admin/reviews/` |
| Analytics | `src/app/admin/analytics/`, `src/app/api/admin/analytics/` |
| Announcements | `src/app/api/admin/announcements/`, `src/components/AnnouncementsDisplay.tsx` |
| SEO | `src/components/admin/SEODashboard.tsx`, `src/app/api/admin/seo/` |
| Ebooks | `src/app/admin/ebooks/`, `src/app/api/admin/ebooks/` |
| Chatbot | `src/lib/chatbot/` |

---

## Project Root References

| File | Purpose |
|---|---|
| `README.md` | General project overview |
| `QUICK_REFERENCE.md` | Quick general reference |
| `FEES_INDEX.md` | Fees system doc index |
| `FEES_SYSTEM_GUIDE.md` | Fees system guide |
| `SMTP_CONFIGURATION.md` | Email / SMTP setup |
| `prisma/schema.prisma` | Database schema |
| `src/DOCS/Code audit.md` | Certificate system audit |

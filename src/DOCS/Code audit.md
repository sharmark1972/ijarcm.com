# Code Audit — IJARCM Systems

> Last updated: 2026-06-04
> Covers: AI Extraction (Research Papers), Certificate generation

---

# Research Paper AI Extraction — Code Audit

> Scope: AI-based metadata extraction during DOCX upload in admin research paper editor

## Overview

When a DOCX is uploaded in the admin research paper studio, the browser extracts text locally via Mammoth, then sends the first 3000 characters to the server at `/api/admin/research-papers/ai-extract`. The server calls one of two AI providers to extract and rewrite paper metadata.

## Key File

**`src/lib/research-papers/gemini-extractor.ts`**

Contains:
- `METADATA_PROMPT` — the single prompt used by both providers
- `tryGeminiOnly(plainText)` — calls Gemini if `GEMINI_API_KEY` is set
- `tryZaiOnly(plainText)` — calls ZAI if `ZAI_API_KEY` is set
- `parseMetadataResponse(raw)` — strips non-JSON text, parses, enforces 148-word abstract cap

## Providers

| Provider | Model | Env Var | Endpoint |
|---|---|---|---|
| Gemini | `gemini-2.5-flash-lite` | `GEMINI_API_KEY` | Google Generative AI SDK |
| ZAI | `GLM-4.7-Flash` | `ZAI_API_KEY` | `https://api.z.ai/api/paas/v4/chat/completions` |

Both providers receive the same `METADATA_PROMPT + textSample` as a single user message. Input is capped at `plainText.slice(0, 3000)`.

## The Prompt (`METADATA_PROMPT`)

Single-turn user message. Instructs the model to return **only a raw JSON object** — no markdown, no explanation.

**Fields requested:**

| Field | Notes |
|---|---|
| `title` | Remove surrounding quotes if any |
| `authors` | Array of `{ name: string, isCorresponding: boolean }` — split comma/semicolon lists, strip labels like (Supervisor) (Guide) (Co-author); first author = corresponding |
| `affiliation` | Full: dept + university + location |
| `email` | Corresponding author email; empty string if not found |
| `abstract` | Rewritten — see rules below |
| `keywords` | Array of strings |

**Abstract rewriting rules — OLD (replaced on 2026-06-04):**
1. Rewrite completely in AI's own words — do NOT copy verbatim sentences
2. Preserve original meaning, findings, methodology, conclusions
3. Max 148 words, no filler phrases
4. Clear, formal, academic English
5. Avoid robotic/repetitive/overly passive phrasing
6. Result must be plagiarism-free paraphrase

**Document + Abstract rewriting rules — NEW (active from 2026-06-04):**

These rules apply to the full document. Rule 10 is abstract-only.

1. Rewrite the entire text in human-like, natural academic English — avoid robotic, repetitive, or overly passive phrasing
2. Remove all plagiarism — do not copy sentences verbatim
3. Preserve the original meaning, context, findings, methodology, and conclusions completely
4. Keep the same word count — do not add or remove content
5. Do not modify any table content — return tables exactly as received
6. Do not change section headings
7. Do not add new information, examples, or explanations
8. Do not remove any information
9. Maintain the same structure and flow as the original
10. **Abstract only:** maximum 148 words, no filler phrases — rewrite completely in own words within this limit

**Code-side enforcement:** After parsing, `parseMetadataResponse` truncates abstract to 148 words if AI exceeded the limit.

## Response Parsing

`parseMetadataResponse` does:
1. Regex `/{[\s\S]*}/` to extract JSON block (handles thinking tokens, preamble text)
2. `JSON.parse`
3. Returns `null` if both `title` and `abstract` are empty
4. Forces `authors` and `keywords` to arrays if AI returned wrong type
5. Truncates abstract to 148 words

## Fallback Chain

```
GEMINI_API_KEY present? → tryGeminiOnly
  success → extractionMethod: 'gemini'
  fail    → tryZaiOnly

ZAI_API_KEY present? → tryZaiOnly
  success → extractionMethod: 'zai'
  fail    → extractionMethod: 'basic' (DOCX-only data)
```

## Known Issues / Notes

- If neither API key is set in `.env`, extraction silently falls back to basic (DOCX-parsed) data with no AI rewriting.
- ZAI uses OpenAI-compatible chat completions format; if ZAI changes API shape, update `data?.choices?.[0]?.message?.content` accessor in `tryZai`.
- Abstract 148-word limit is enforced both in the prompt and in code — the code truncation is the hard guarantee.

---

# Certificate System — Code Audit

> Last updated: 2026-05-25 (Updated with hybrid conference & participation type)
> Scope: Certificate generation, display, and management

> Related research-paper workflow: see [Research paper audit.md](../../docs/Research%20paper%20audit.md)

---

## System Overview

IJARCM has **two separate certificate systems** that coexist:

| System | Type | Used For |
|--------|------|----------|
| **System 1 — React** | React component (TSX) | Admin generate page, Sample preview |
| **System 2 — HTML** | Pure HTML string (server-rendered) | Published papers (opens in new tab) |

Both systems save certificate records to the same database table (`Certificate` model via Prisma).

---

## System 1 — React Certificate Component

### Main Component
**File:** `src/components/Certificate.tsx`

**What it does:** Renders a fully styled landscape A4 certificate (1123×794px) as a React component. Supports PNG download via `html2canvas`.

**Props (defined in `src/types/certificate.ts`):**
```ts
certificateNumber: string       // e.g. "IJARCM-2026-3005"
authorName: string
title: string                   // paper title or conference name
institution: string
issuedAt: string                // ISO date string
type: 'PUBLICATION' | 'PARTICIPATION' | 'REVIEW' | 'AWARD' | 'CONFERENCE'
isPreview?: boolean             // default false
showDownload?: boolean          // default true — shows "Download as Image" button
conferenceName?: string         // only for CONFERENCE type
conferenceDates?: string        // only for CONFERENCE type
topic?: string                  // optional research topic
prize?: string                  // optional honor/prize received
customDate?: string             // override issuedAt display date
template?: 'classic' | 'modern' | 'elegant'  // default 'classic'
conferenceParticipationType?: 'participation' | 'presentation' | 'both'  // default 'both'
```

**Dynamic Certificate Heading:**
The certificate heading changes based on `type` and `conferenceParticipationType`:
- CONFERENCE + participation: "CERTIFICATE OF CONFERENCE PARTICIPATION"
- CONFERENCE + presentation: "CERTIFICATE OF CONFERENCE PRESENTATION"
- CONFERENCE + both: "CERTIFICATE OF CONFERENCE PARTICIPATION AND PRESENTATION"
- PUBLICATION: "CERTIFICATE OF PUBLICATION"
- REVIEW: "CERTIFICATE OF PEER REVIEW"
- AWARD: "CERTIFICATE OF EXCELLENCE"
- PARTICIPATION: "CERTIFICATE OF PARTICIPATION"

**Templates:**
- `classic` — Royal Gold & Burgundy (default)
- `modern` — Royal Navy Blue
- `elegant` — Emerald & Gold

Each template changes: background gradient, border colors, primary/secondary/gold accent colors, header gradient, seal gradient.

**Layout (fixed dimensions):**
- Outer div: `width: 1123px`, `height: 794px`, `overflow: hidden`
- Print CSS: `@page { size: A4 landscape; margin: 0; }` — forces A4 landscape on print
- Main content wrapper: `paddingTop: 96px`, `paddingBottom: 225px`

**Border System (BCA-style):**
```
3 absolute border divs:
  - Outer:  inset 28px, 2px solid goldAccent, borderRadius 2px
  - Inner:  inset 40px, 1px solid goldAccent
  - Fine:   inset 46px, 1px solid goldAccent at 70% opacity

2 Greek-key ornament bands (SVG pattern):
  - Top:    top: 64px, left/right: 150px, height: 18px
  - Bottom: bottom: 64px, left/right: 150px, height: 18px

4 Corner flourishes (BCA SVG design, 90×90px):
  - top-left:     top: 38px, left: 38px
  - top-right:    top: 38px, right: 38px  (transform: scaleX(-1))
  - bottom-left:  bottom: 38px, left: 38px (transform: scaleY(-1))
  - bottom-right: bottom: 38px, right: 38px (transform: scale(-1,-1))
```

**Fixed bottom block (absolutely positioned):**
The footer (Date | Certificate Ref | Signature) and verification text are positioned with `position: absolute, bottom: 90px` so they never overlap borders regardless of content length.

**Download as Image:**
Uses `html2canvas` (already installed). Triggered by "Download Certificate as Image" button (shown only when `showDownload=true`). Captures at `scale: 2` for 2x quality, `width: 1123, height: 794`.

**Key constants:**
```ts
ISSN_PRINT = '2455-0116'
ISSN_ONLINE = '2395-6410'
MANAGING_DIRECTOR_SIGNATURE = '/managing-director-signature.png'  // from public/
```

---

### Sample Certificate Component
**File:** `src/components/SampleCertificate.tsx`

**What it does:** Shows a preview card on the homepage with a mini certificate design and a "View Full Certificate Sample" modal that renders the actual `Certificate` component with dummy data.

**Uses Certificate component with:**
```ts
certificateNumber: 'IJARCM-2025-SAMPLE'
authorName: 'Dr. Jane Smith'
type: 'PUBLICATION'
isPreview: true
showDownload: false
```

Modal max-width: `1220px` to accommodate the 1123px certificate with horizontal scroll.

---

### Admin Generate Page
**File:** `src/app/admin/certificates/generate/page.tsx`

**What it does:** Admin UI form to generate certificates manually. Supports both PUBLICATION and CONFERENCE types with hybrid conference selection and dynamic participation type.

**Form Layout (Compact 3-row design):**
```
Row 1: [Participation Type dropdown*] + [Recipient Name *]  (2 col)
Row 2: [Institution]                + [Certificate Date]    (2 col)
Row 3: [Topic]                      + [Prize/Award]         (2 col)
```

**Form fields:**
1. Certificate Type (PUBLICATION / CONFERENCE) — select dropdown
2. Certificate Template (classic / modern / elegant) — dropdown + 3 preview buttons
3. **Participation Type** (CONFERENCE only) — dropdown with 3 options:
   - Participation
   - Presentation
   - Participation & Presentation
4. Conference Selection (CONFERENCE only) — **HYBRID MODE:**
   - **Select Existing:** Dropdown of existing conferences + read-only details (name, dates, location, status)
   - **+ Create New:** Inline form to create new conference:
     - Conference Name*, Location (2 col)
     - Description (full)
     - Start Date & Time*, End Date & Time (2 col)
     - Status, Video URL (2 col)
5. Generate without user — checkbox
6. Select User — dropdown (if not generating without user)
7. Recipient Name* — text input
8. Institution (Optional) — text input
9. Topic (Optional) — text input
10. Prize/Award (Optional) — text input
11. Certificate Date (Optional) — date input

**Conference Hybrid Mode Flow:**
1. User toggles between "Select Existing" and "+ Create New"
2. **Select Existing:**
   - Show dropdown of conferences (fetched from `/api/admin/conferences?limit=100`)
   - On selection: display read-only card with conference details
3. **Create New:**
   - Show inline form to create conference
   - On generate: calls `POST /api/admin/conferences` first, then `POST /api/certificates`
   - Button shows "Creating Conference..." → "Generating Certificate..."

**Participation Type Behavior:**
- Always visible above Recipient Name field
- Options shown only for CERTIFICATE type = 'CONFERENCE'
- Default value: 'both'
- Dynamically updates certificate heading in Certificate component

**On submit:** 
- If Create New mode: `POST /api/admin/conferences` → `POST /api/certificates`
- If Select Existing mode: `POST /api/certificates` directly
- Shows certificate preview in scrollable pane

**Important layout note:** The certificate preview is rendered **outside** the `max-w-7xl` container to avoid the admin sidebar (256px, `w-64`) constraining the certificate width. Structure:
```jsx
</div>  {/* closes max-w-7xl */}

{showCertificate && generatedCertificate && (
  <div className="px-4 pb-8">         {/* full-width wrapper */}
    ...
    <Certificate ... />
  </div>
)}
```

**State Variables Added:**
```ts
conferenceMode: 'select' | 'create'  // Toggle between modes
newConferenceData: {
  title: string
  description: string
  startDate: string
  endDate: string
  location: string
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'
  videoUrl: string
}
isCreatingConference: boolean  // Loading state during POST
conferenceParticipationType: 'participation' | 'presentation' | 'both'
```

---

### Admin Certificates List Page
**File:** `src/app/admin/certificates/page.tsx`

**What it does:** Lists all generated certificates with search/filter. Calls `GET /api/certificates`. Admin sees all; regular users see only their own.

---

## System 2 — HTML Certificate (Papers)

### API Route
**File:** `src/app/api/papers/[id]/certificate/route.ts`

**Method:** `GET /api/papers/[id]/certificate`

**What it does:** Generates a complete standalone HTML page as a string for a PUBLISHED paper. Returns JSON with `certificateHTML` field. The frontend opens this in a new browser tab.

**Only supports:** `PUBLICATION` type (for published papers only).

**Differences from System 1:**
- Pure HTML — no React, no Tailwind
- Uses `Playfair Display` + `Libre Baskerville` Google Fonts
- Has a QR code (generated via `qrcode` npm package) pointing to `ijarcm.com/verify/{certificateNumber}`
- Has a "Legal Notice" box at bottom
- Has a dark gradient verification box at bottom
- Certificate dimensions: `width: 1200px`, `min-height: 850px` (not fixed height)
- Border system: OLD design (inner-frame + inner-frame-2, corner flourishes)
- Print: `@page { size: A4 landscape; }`, `width: 297mm`
- Signature image path: `/managing-director-signature.png` (same public asset)

**Flow:**
1. Check paper exists and is PUBLISHED
2. Get first author (by `authorOrder ASC`) as primary recipient
3. If certificate already exists for paper+author → reuse that `certificateNumber`
4. If not → generate new number (`IJARCM-{year}-{randomSuffix}`) and create DB record
5. Generate QR code as base64 data URL
6. Return full HTML string

---

## API Routes

### POST /api/certificates
**File:** `src/app/api/certificates/route.ts`

**Auth:** Admin only

**Body:**
```json
{
  "paperId": "...",           // required for non-CONFERENCE types
  "userId": "...",            // optional — if omitted, saves without user link
  "type": "PUBLICATION",      // PUBLICATION | CONFERENCE
  "conferenceName": "...",    // required for CONFERENCE
  "authorName": "...",        // used if no userId
  "institution": "...",       // used if no userId
  "topic": "...",             // optional
  "prize": "...",             // optional
  "customDate": "2026-01-15"  // optional ISO date
}
```

**Certificate number format:** `IJARCM-{year}-{4-digit-random}` (e.g. `IJARCM-2026-3005`)

**Validations:**
- Paper must be PUBLISHED (for non-CONFERENCE)
- If userId provided: user must be author or submitter of paper
- Duplicate check: if userId provided, no existing valid certificate for same paper+user+type

### GET /api/certificates
**File:** `src/app/api/certificates/route.ts`

**Auth:** Any logged-in user (admin sees all, user sees own)

**Query params:** `userId`, `paperId`, `certificateNumber`

**Returns:** Array of certificate records with joined `paper` and `user` data.

---

## Types & Constants

**File:** `src/types/certificate.ts`

- `ISSN_PRINT = '2455-0116'`
- `ISSN_ONLINE = '2395-6410'`
- `CertificateTemplate = 'classic' | 'modern' | 'elegant'`
- `CERTIFICATE_TEMPLATES` array with id, name, description for each template
- `CertificateProps` interface (full props for Certificate component)

---

## Database Model

**Table:** `Certificate` (via Prisma)

**Key fields:**
```
id                String
certificateNumber String (unique)
type              CertificateType enum
title             String
authorName        String
institution       String?
topic             String?
prize             String?
issuedAt          DateTime (default: now())
customDate        DateTime?
isValid           Boolean (default: true)
paperId           String? (FK → Paper)
userId            String? (FK → User)
```

---

## Recent Features Added

### 1. Hybrid Conference Selection (Create New Mode)
- Users can now create conferences on-the-fly while generating certificates
- Two modes: Select Existing or Create New
- Conference creation happens inline within the certificate generation form
- New conferences are immediately available in the dropdown

### 2. Dynamic Participation Type Selection
- Dropdown field for conference participation type (Participation/Presentation/Both)
- Dynamically updates certificate heading based on selection
- Positioned in same row as Recipient Name for compact layout
- Currently only shows options for CONFERENCE type; ready for extension to other types

### 3. Compacted Form Layout
- Reduced from 4+ rows to 3 rows using 2-column grid layout
- Row 1: Participation Type + Recipient Name
- Row 2: Institution + Certificate Date
- Row 3: Topic + Prize/Award

### 4. Enhanced Conference Creation Form
- Inline within "Create New" mode
- Reorganized to 4 compact rows:
  - Row 1: Conference Name + Location
  - Row 2: Description
  - Row 3: Start Date & Time + End Date & Time
  - Row 4: Status + Video URL

---

## Known Issues & Notes

1. **System 2 (HTML) has old border design** — not updated to BCA-style. Only System 1 (React) has the new design.
2. **Certificate number format differs** between systems:
   - System 1 (POST API): `IJARCM-{year}-{4-digit-number}` (e.g. `IJARCM-2026-3005`)
   - System 2 (paper route): `IJARCM-{year}-{6-char-alphanumeric}` (e.g. `IJARCM-2026-AB12CD`)
3. **Admin sidebar constraint** — admin layout has `w-64` (256px) fixed sidebar. Certificate (1123px) must be rendered outside `max-w-7xl` to display fully. Already fixed in generate page.
4. **SampleCertificate modal** needs `maxWidth: 1220px` and `overflowX: auto` to fit certificate.
5. **Signature image** is a static asset at `public/managing-director-signature.png`.
6. **Browser Compatibility** — `datetime-local` input type works in Chrome but has inconsistent behavior in Firefox. Currently using as-is; users can type time manually or use browser-specific UX.
7. **Participation Type** — currently only implemented for CONFERENCE type. Other certificate types (PUBLICATION, REVIEW, etc.) show empty placeholder when other implementations are added later.

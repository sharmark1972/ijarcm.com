# IJARCM — DOCS Index

> This index is for AI agents. Read this file first to find relevant files without scanning the entire codebase.
> Each section lists what the file does and which source files are involved.
> Last updated: 2026-05-25 with hybrid conference selection and participation type features

---

## Certificate System

**Full details:** [Code audit.md](./Code%20audit.md) — includes recent hybrid conference and participation type features

| What you need | File(s) to read |
|---------------|-----------------|
| Certificate UI/design/layout | `src/components/Certificate.tsx` |
| Certificate props/types/templates | `src/types/certificate.ts` |
| Admin generate certificate form | `src/app/admin/certificates/generate/page.tsx` |
| Admin certificates list | `src/app/admin/certificates/page.tsx` |
| Sample certificate (homepage preview) | `src/components/SampleCertificate.tsx` |
| Generate certificate API (create/list) | `src/app/api/certificates/route.ts` |
| HTML certificate for published papers | `src/app/api/papers/[id]/certificate/route.ts` |

### Certificate Quick Facts
- **Two systems:** React component (admin/preview) and HTML string (published papers)
- **Dimensions:** 1123×794px (A4 landscape at 96dpi)
- **Templates:** `classic` (gold/burgundy), `modern` (navy), `elegant` (emerald)
- **Certificate number format:** `IJARCM-{year}-{number}`
- **DB model:** `Certificate` table (Prisma)
- **Signature asset:** `public/managing-director-signature.png`
- **Admin sidebar issue:** Certificate must render outside `max-w-7xl` (sidebar = 256px w-64)
- **NEW - Hybrid Conference:** Can select existing or create new conference inline during certificate generation
- **NEW - Participation Type:** Dynamic dropdown for Conference certificates (Participation/Presentation/Both) affects certificate heading
- **NEW - Compact Layout:** Certificate form fits in 3 rows with 2-column grid

---

## Other Systems (to be documented)

> These sections will be filled as other systems are audited.

| System | Status |
|--------|--------|
| Fees/Payment | See `FEES_*.md` files in project root |
| Authentication | Not yet documented |
| Papers / Submission | Not yet documented |
| User Dashboard | Not yet documented |
| Admin Panel | Not yet documented |
| Email / SMTP | See `SMTP_CONFIGURATION.md` in project root |

---

## Project Root Files Reference

| File | Purpose |
|------|---------|
| `FEES_INDEX.md` | Index for fees/payment system docs |
| `FEES_SYSTEM_GUIDE.md` | Full fees system guide |
| `SMTP_CONFIGURATION.md` | Email/SMTP setup |
| `README.md` | General project readme |
| `QUICK_REFERENCE.md` | General quick reference |
| `DOCS/Code audit.md` | Certificate system audit (this session) |

---

## How to Use This Index

1. **Start here** — read this file to find what you need
2. **Go to the audit file** — `Code audit.md` for deep certificate system knowledge
3. **Read only the source file you need** — don't scan the whole `src/` directory
4. **After making changes** — ask the user to update the relevant DOCS file so knowledge stays current

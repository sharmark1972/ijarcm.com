import { readFile } from 'fs/promises';
import { join } from 'path';
import { chromium } from 'playwright';
import { prisma } from '@/lib/prisma';
import { deleteFromR2, uploadToR2 } from '@/lib/r2-upload';

const PDF_FOLDER_PREFIX = 'research-papers/pdfs';

export async function generateResearchPaperPdf(draftId: string, mode: 'preview' | 'final' = 'preview') {
  const draft = await prisma.researchPaperDraft.findUnique({
    where: { id: draftId },
    include: {
      authors: { orderBy: { authorOrder: 'asc' } },
      sections: { orderBy: { sectionOrder: 'asc' } },
      issue: true,
    },
  });

  if (!draft) throw new Error('Research paper draft not found.');

  const html = await buildPdfHtml(draft);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: `<div style="width:100%;font-family:'Times New Roman',serif;font-size:9px;color:#475569;padding:0 14mm;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #cbd5e1;">
        <span>International Journal of Academic Research in Commerce &amp; Management</span>
        <span>www.ijarcm.com</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`,
      margin: { top: '10mm', bottom: '18mm', left: '0', right: '0' },
    });

    const fileName = mode === 'final' ? 'research-paper.pdf' : 'research-paper-preview.pdf';
    const path = await uploadToR2(
      Buffer.from(pdf),
      fileName,
      `${PDF_FOLDER_PREFIX}/${draft.id}`,
      'application/pdf',
    );

    try {
      await prisma.researchPaperDraft.update({
        where: { id: draft.id },
        data: mode === 'final'
          ? { pdfPath: path, status: 'PDF_GENERATED' }
          : { previewPdfPath: path },
      });
    } catch (error) {
      await deleteFromR2(path);
      throw error;
    }

    return {
      path,
    };
  } finally {
    await browser.close();
  }
}

async function buildPdfHtml(draft: Awaited<ReturnType<typeof prisma.researchPaperDraft.findUnique>> & Record<string, any>) {
  const cssPath = join(process.cwd(), 'src', 'components', 'admin', 'research-papers', 'pdf', 'research-paper-pdf.css');
  const css = await readFile(cssPath, 'utf8');
  const logoBuffer = await readFile(join(process.cwd(), 'public', 'ijarcm_logo.png'));
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  const issue = draft.issue;
  const publishedDate = issue
    ? `${issue.publishDate.toLocaleString('en-US', { month: 'long' })}-${issue.year}`
    : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>${css}</style>
  <style>
    body {
      margin: 0;
      background-image: url('${buildWatermarkSvg(logoBase64)}');
      background-size: 210mm 297mm;
      background-repeat: repeat-y;
      background-position: left top;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .research-paper-sheet { box-shadow: none; }
    .pdf-preview-stage { padding: 0; }
    .pdf-content-section table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    @media print {
      body * { visibility: visible !important; }
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <main class="pdf-preview-stage">
    <article class="research-paper-sheet">
      <header class="pdf-first-header">
        <div class="pdf-masthead">
          <div class="pdf-issn">ISSN: 2455-0116</div>
          <div class="pdf-journal-title">
            <div class="pdf-journal-title-box">
              <h1>International Journal of Academic Research in Commerce &amp; Management</h1>
              <span>Available online at: https://www.ijarcm.com/</span>
            </div>
          </div>
          <div class="pdf-masthead-logos">
            <img src="${logoBase64}" class="pdf-logo" alt="IJARCM" />
          </div>
        </div>
      </header>

      <section class="pdf-paper-title">
        <h2>${escapeHtml(cleanTitle(draft.title || 'Untitled Research Paper'))}</h2>
        <div class="pdf-authors">
          <p>${escapeHtml(draft.authors.map((a: any) => a.name).join(', '))}</p>
          ${draft.authors[0]?.affiliation ? `<p>${escapeHtml(draft.authors[0].affiliation)}</p>` : ''}
          ${draft.authors[0]?.email ? `<p>${escapeHtml(draft.authors[0].email)}</p>` : ''}
        </div>
      </section>

      <!-- Article-Info + Abstract float layout -->
      <div class="pdf-first-page-section">
        <div class="pdf-first-page-columns">

          <!-- LEFT: Article-Info (float left) -->
          <aside class="pdf-article-info">
            <h3>Article-Info</h3>
            <div class="pdf-info-block">
              <p>Article History:</p>
              <span>Accepted: ${escapeHtml(draft.publishedAt ? formatDate(draft.publishedAt) : '')}</span>
              <span>Published: ${escapeHtml(publishedDate)}</span>
            </div>
            <div class="pdf-info-block">
              <p>Publication Issue:</p>
              <span>${issue ? `Volume ${escapeHtml(issue.volume)}, Issue ${escapeHtml(issue.issueNumber)}` : ''}</span>
              <span>${escapeHtml(publishedDate)}</span>
            </div>
            ${draft.doi ? `<div class="pdf-info-block"><p>DOI:</p><span>${escapeHtml(draft.doi)}</span></div>` : ''}
          </aside>

          <!-- RIGHT: Abstract max 148 words + Keywords (fixed, no full width) -->
          <section class="pdf-abstract-panel">
            <h3>Abstract</h3>
            <p>${escapeHtml(getFirstNWords(draft.abstract || '', 148))}</p>
            <div class="pdf-keywords">
              <strong>Keywords:</strong> ${escapeHtml(parseKeywords(draft.keywords).join(', '))}
            </div>
          </section>

        </div><!-- end float columns -->

      </div><!-- end pdf-first-page-section -->

      <!-- Body sections: 2 column — content flows freely -->
      <main class="pdf-content">
        ${draft.sections.map((section: any) => {
          const isReferences = /^(references|bibliography|works cited)/i.test(section.heading.trim());
          const isFullWidth = section.isFullWidth || isReferences;
          return isFullWidth
            ? `<div class="pdf-section-full${isReferences ? ' pdf-references-section' : ''}">
                <h3 class="pdf-section-heading">${escapeHtml(section.heading)}</h3>
                ${section.content || ''}
               </div>`
            : `<div class="pdf-section-two-col">
                <h3 class="pdf-section-heading">${escapeHtml(section.heading)}</h3>
                ${section.content || ''}
               </div>`;
        }).join('')}
      </main>

    </article>
  </main>
</body>
</html>`;
}

function buildWatermarkSvg(logoBase64: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="210mm" height="297mm" viewBox="0 0 210 297">
    <image href="${logoBase64}" x="70" y="113" width="70" height="70" opacity="0.07" preserveAspectRatio="xMidYMid meet"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getFirstNWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return text.trim();
  return words.slice(0, n).join(' ');
}

function getRemainingWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= n) return '';
  return words.slice(n).join(' ');
}

function cleanTitle(title: string): string {
  return title.replace(/^["'"]+|["'"]+$/g, '').trim();
}

function parseKeywords(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

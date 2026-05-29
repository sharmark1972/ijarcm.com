import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { chromium } from 'playwright';
import { prisma } from '@/lib/prisma';

const PDF_ROOT = join(process.cwd(), 'public', 'uploads', 'research-papers');

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

  const folder = join(PDF_ROOT, draft.id);
  await mkdir(folder, { recursive: true });

  const fileName = mode === 'final' ? 'research-paper.pdf' : 'research-paper-preview.pdf';
  const absolutePath = join(folder, fileName);
  const relativePath = `/uploads/research-papers/${draft.id}/${fileName}`;
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
    await writeFile(absolutePath, pdf);
  } finally {
    await browser.close();
  }

  await prisma.researchPaperDraft.update({
    where: { id: draft.id },
    data: mode === 'final'
      ? { pdfPath: relativePath, status: 'PDF_GENERATED' }
      : { previewPdfPath: relativePath },
  });

  return {
    path: relativePath,
    absolutePath,
  };
}

async function buildPdfHtml(draft: Awaited<ReturnType<typeof prisma.researchPaperDraft.findUnique>> & Record<string, any>) {
  const cssPath = join(process.cwd(), 'src', 'components', 'admin', 'research-papers', 'pdf', 'research-paper-pdf.css');
  const css = await readFile(cssPath, 'utf8');
  const logoUrl = pathToFileURL(join(process.cwd(), 'public', 'ijarcm-logo.svg')).toString();
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
    body { margin: 0; background: #fff; }
    .research-paper-sheet { box-shadow: none; }
    .pdf-preview-stage { padding: 0; }
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
            <span class="pdf-open-access">OPEN ACCESS</span>
            <img src="${logoUrl}" class="pdf-logo" alt="IJARCM" />
          </div>
        </div>
      </header>

      <section class="pdf-paper-title">
        <h2>${escapeHtml(draft.title || 'Untitled Research Paper')}</h2>
        <div class="pdf-authors">
          <p>${escapeHtml(draft.authors.map((author: any) => author.name).join(', '))}</p>
          ${draft.authors[0]?.affiliation ? `<p>${escapeHtml(draft.authors[0].affiliation)}</p>` : ''}
          ${draft.authors[0]?.email ? `<p>${escapeHtml(draft.authors[0].email)}</p>` : ''}
        </div>
      </section>

      <section class="pdf-first-page-grid">
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

        <section class="pdf-abstract-panel">
          <h3>Abstract</h3>
          <h4>Abstract</h4>
          <p>${escapeHtml(draft.abstract || '')}</p>
          <div class="pdf-keywords"><strong>Keywords:</strong> ${escapeHtml(parseKeywords(draft.keywords).join(', '))}</div>
        </section>
      </section>

      <main class="pdf-content">
        ${draft.sections.map((section: any) => `
          <section class="pdf-content-section">
            <h3>${escapeHtml(section.heading)}</h3>
            ${section.content || ''}
          </section>
        `).join('')}
      </main>

    </article>
  </main>
</body>
</html>`;
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

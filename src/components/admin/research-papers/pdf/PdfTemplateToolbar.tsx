'use client';

import Link from 'next/link';

export function PdfTemplateToolbar() {
  return (
    <div className="pdf-preview-toolbar">
      <div className="pdf-preview-toolbar-inner">
        <div>
          <h1>Research Paper PDF Template</h1>
          <p>HTML preview of the journal layout before backend PDF generation.</p>
        </div>
        <div className="pdf-preview-actions">
          <Link href="/admin/research-papers/new" className="pdf-preview-btn">
            Back to paper
          </Link>
          <a href="#without-doi" className="pdf-preview-btn">
            View without DOI
          </a>
          <button type="button" className="pdf-preview-btn primary" onClick={() => window.print()}>
            Print preview
          </button>
        </div>
      </div>
    </div>
  );
}

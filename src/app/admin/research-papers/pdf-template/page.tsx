import { PdfTemplateToolbar } from '@/components/admin/research-papers/pdf/PdfTemplateToolbar';
import { ResearchPaperPdfPreview } from '@/components/admin/research-papers/pdf/ResearchPaperPdfPreview';
import { sampleResearchPaperPdfData } from '@/components/admin/research-papers/pdf/pdfTemplateData';
import '@/components/admin/research-papers/pdf/research-paper-pdf.css';

export default function ResearchPaperPdfTemplatePage() {
  return (
    <div className="pdf-preview-page pdf-print-root">
      <PdfTemplateToolbar />

      <main className="pdf-preview-stage">
        <ResearchPaperPdfPreview data={sampleResearchPaperPdfData} />
      </main>

      <section id="without-doi" className="pdf-preview-stage pdf-no-print">
        <ResearchPaperPdfPreview data={sampleResearchPaperPdfData} hideDoi />
      </section>
    </div>
  );
}

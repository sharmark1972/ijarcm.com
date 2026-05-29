import Image from 'next/image';
import type { ResearchPaperPdfData } from './pdfTemplateData';

interface ResearchPaperPdfPreviewProps {
  data: ResearchPaperPdfData;
  hideDoi?: boolean;
}

export function ResearchPaperPdfPreview({ data, hideDoi = false }: ResearchPaperPdfPreviewProps) {
  const doi = hideDoi ? '' : data.paper.doi;

  return (
    <article className="research-paper-sheet">
      <header className="pdf-first-header">
        <div className="pdf-masthead">
          <div className="pdf-issn">
            ISSN: {data.journal.issnPrint}
          </div>
          <div className="pdf-journal-title">
            <div className="pdf-journal-title-box">
              <h1>{data.journal.name}</h1>
              <span>Available online at: https://{data.journal.website}/</span>
            </div>
          </div>
          <div className="pdf-masthead-logos">
            <span className="pdf-open-access">OPEN ACCESS</span>
            <Image
              src={data.journal.logoUrl}
              alt={data.journal.name}
              width={72}
              height={72}
              className="pdf-logo"
            />
          </div>
        </div>
      </header>

      <section className="pdf-paper-title">
        <h2>{data.paper.title}</h2>
        <div className="pdf-authors">
          <p>{data.paper.authors.map((author) => author.name).join(', ')}</p>
          {data.paper.authors[0]?.affiliation ? <p>{data.paper.authors[0].affiliation}</p> : null}
          {data.paper.authors[0]?.email ? <p>{data.paper.authors[0].email}</p> : null}
        </div>
      </section>

      <section className="pdf-first-page-grid">
        <aside className="pdf-article-info">
          <h3>Article-Info</h3>
          <div className="pdf-info-block">
            <p>Article History:</p>
            <span>Accepted: {data.paper.acceptedDate}</span>
            <span>Published: {data.paper.publishedDate}</span>
          </div>
          <div className="pdf-info-block">
            <p>Publication Issue:</p>
            <span>Volume {data.issue.volume}, Issue {data.issue.issue}</span>
            <span>{data.issue.month}-{data.issue.year}</span>
          </div>
          {doi ? (
            <div className="pdf-info-block">
              <p>DOI:</p>
              <span>{doi}</span>
            </div>
          ) : null}
        </aside>

        <section className="pdf-abstract-panel">
          <h3>Abstract</h3>
          <h4>Abstract</h4>
          <p>{data.paper.abstract}</p>
          <div className="pdf-keywords">
            <strong>Keywords:</strong> {data.paper.keywords.join(', ')}
          </div>
        </section>
      </section>

      <main className="pdf-content">
        {data.paper.sections.map((section) => (
          <section key={section.heading} className="pdf-content-section">
            <h3>{section.heading}</h3>
            <div dangerouslySetInnerHTML={{ __html: section.content }} />
          </section>
        ))}
      </main>

      <div className="pdf-running-header">
        <span>
          {data.journal.shortName} | Vol. {data.issue.volume}, Issue {data.issue.issue}, {data.issue.month} {data.issue.year}
        </span>
        <span>{data.paper.shortTitle}</span>
      </div>

      <footer className="pdf-footer">
        <span>{data.journal.name}</span>
        <span>{data.journal.website}</span>
        <span className="pdf-page-number">Page 1 of 8</span>
      </footer>
    </article>
  );
}

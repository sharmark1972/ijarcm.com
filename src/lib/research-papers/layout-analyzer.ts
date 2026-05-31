import { countTableColumns, isWideTable } from './table-analyzer';

export interface SectionAnalysis {
  heading: string;
  contentLength: number;
  hasTable: boolean;
  tableColumns?: number;
  hasImage: boolean;
  isFullWidth: boolean;
}

const FULL_WIDTH_HEADINGS = [
  'Abstract',
  'References',
  'Bibliography',
  'Conclusion',
  'Conclusions',
  'Acknowledgements',
  'Acknowledgments',
  'Appendix',
];

export function analyzeSectionLayout(
  heading: string,
  htmlContent: string
): boolean {
  // Rule 1: Known full-width headings
  if (FULL_WIDTH_HEADINGS.some((fw) => heading.toLowerCase().includes(fw.toLowerCase()))) {
    return true;
  }

  // Rule 2: Has images → full width
  if (/<img/i.test(htmlContent)) {
    return true;
  }

  // Rule 3: Has any table → full width
  if (/<table/i.test(htmlContent)) {
    return true;
  }

  // Default: 2-column
  return false;
}

function extractTableHtml(htmlContent: string): string | null {
  const tableMatch = htmlContent.match(/<table[^>]*>[\s\S]*?<\/table>/i);
  return tableMatch ? tableMatch[0] : null;
}

export function analyzeSection(
  heading: string,
  htmlContent: string
): SectionAnalysis {
  const hasTable = /<table/i.test(htmlContent);
  const hasImage = /<img/i.test(htmlContent);
  const isFullWidth = analyzeSectionLayout(heading, htmlContent);

  let tableColumns: number | undefined;
  if (hasTable) {
    const tableHtml = extractTableHtml(htmlContent);
    if (tableHtml) {
      tableColumns = countTableColumns(tableHtml);
    }
  }

  return {
    heading,
    contentLength: htmlContent.length,
    hasTable,
    tableColumns,
    hasImage,
    isFullWidth,
  };
}

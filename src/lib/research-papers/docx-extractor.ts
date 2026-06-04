import mammoth from 'mammoth';

export interface ExtractedDocumentHtml {
  html: string;
  warnings: string[];
}

export interface ExtractedStructuredData {
  title: string;
  authors: Array<{
    name: string;
    email?: string;
    affiliation?: string;
    isCorresponding?: boolean;
  }>;
  affiliation: string;
  abstract: string;
  keywords: string[];
  sections: Array<{
    heading: string;
    content: string;
  }>;
  rawHtml: string;
  warnings: string[];
}

export async function extractDocumentHtmlFromBuffer(
  buffer: Buffer | ArrayBuffer,
  extension: string,
): Promise<ExtractedDocumentHtml> {
  if (extension !== '.docx') {
    return {
      html: '',
      warnings: ['Legacy .doc files can be uploaded, but automatic extraction currently supports DOCX only.'],
    };
  }

  const result = await mammoth.convertToHtml(
    getMammothInput(buffer),
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ],
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        })),
      ),
    },
  );

  return {
    html: result.value,
    warnings: result.messages.map((m) => m.message),
  };
}

export async function extractStructuredDataFromDocx(
  buffer: Buffer | ArrayBuffer,
  extension: string,
): Promise<ExtractedStructuredData> {
  if (extension !== '.docx') {
    return emptyStructuredData(['Legacy .doc files can be uploaded, but automatic extraction currently supports DOCX only.']);
  }

  const result = await mammoth.convertToHtml(
    getMammothInput(buffer),
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='heading 1'] => h1:fresh",
        "p[style-name='heading 2'] => h2:fresh",
        "p[style-name='heading 3'] => h3:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
      ],
      convertImage: mammoth.images.imgElement((image) =>
        image.read('base64').then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        })),
      ),
    },
  );

  const html = result.value;
  const warnings = result.messages.map((m) => m.message);

  const parsed = parseHtmlDocument(html);

  return {
    ...parsed,
    rawHtml: html,
    warnings,
  };
}

function getMammothInput(buffer: Buffer | ArrayBuffer) {
  return buffer instanceof ArrayBuffer ? { arrayBuffer: buffer } : { buffer };
}

// ─── HTML Parsing ────────────────────────────────────────────────────────────

function parseHtmlDocument(html: string): Omit<ExtractedStructuredData, 'rawHtml' | 'warnings'> {
  const blocks = extractBlocks(html);

  const titleIndex = findTitleIndex(blocks);
  const authorBlocks = findAuthorBlocks(blocks, titleIndex);
  const affiliationBlocks = findAffiliationBlocks(blocks, titleIndex, authorBlocks);
  const abstractResult = findAbstract(blocks, titleIndex);
  const keywordsResult = findKeywords(blocks, titleIndex);
  const sections = findSections(blocks, html);

  const title = titleIndex >= 0 ? blocks[titleIndex].text : '';
  const authors = buildAuthors(authorBlocks, affiliationBlocks);
  const affiliation = affiliationBlocks.map((b) => b.text).join(', ');

  return {
    title,
    authors,
    affiliation,
    abstract: abstractResult,
    keywords: keywordsResult,
    sections,
  };
}

// ─── Block Extraction ─────────────────────────────────────────────────────────

interface Block {
  type: 'bold' | 'heading' | 'paragraph' | 'list' | 'table' | 'other';
  text: string;
  html: string;
  index: number;
}

function extractBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  const tagRegex = /<(p|h[1-6]|ul|ol|table)[^>]*>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = tagRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const fullHtml = match[0];
    const innerText = fullHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

    if (!innerText && !fullHtml.includes('<img') && !fullHtml.includes('<table')) continue;

    if (tag === 'table') {
      blocks.push({ type: 'table', text: innerText, html: fullHtml, index: i++ });
      continue;
    }

    if (tag === 'ul' || tag === 'ol') {
      blocks.push({ type: 'list', text: innerText, html: fullHtml, index: i++ });
      continue;
    }

    if (/^h[1-6]$/.test(tag)) {
      blocks.push({ type: 'heading', text: innerText, html: fullHtml, index: i++ });
      continue;
    }

    // p tag — check if bold
    const isBold = /^<p[^>]*>\s*<strong[^>]*>[\s\S]*?<\/strong>\s*<\/p>$/i.test(fullHtml) ||
                   /^<p[^>]*>\s*<b[^>]*>[\s\S]*?<\/b>\s*<\/p>$/i.test(fullHtml);

    blocks.push({ type: isBold ? 'bold' : 'paragraph', text: innerText, html: fullHtml, index: i++ });
  }

  return blocks;
}

// ─── Title Detection ──────────────────────────────────────────────────────────

function findTitleIndex(blocks: Block[]): number {
  // First h1 tag = title
  const h1Index = blocks.findIndex((b) => b.html.startsWith('<h1'));
  if (h1Index >= 0) return h1Index;

  // First bold paragraph that is long enough = title
  for (let i = 0; i < Math.min(blocks.length, 5); i++) {
    const b = blocks[i];
    if (b.type === 'bold' && b.text.length > 15) return i;
  }

  return 0;
}

// ─── Author Detection ─────────────────────────────────────────────────────────

const AFFILIATION_KEYWORDS = [
  /^department/i, /^faculty/i, /^school/i, /^college/i,
  /^university/i, /^institute/i, /^centre/i, /^center/i,
  /^professor/i, /^associate professor/i, /^assistant professor/i,
  /^research/i,
];

const LOCATION_KEYWORDS = [
  /\bindia\b/i, /\bpunjab\b/i, /\bharyana\b/i, /\bdelhi\b/i,
  /\bmaharashtra\b/i, /\bdistt?\b/i, /\bpin\s*code\b/i,
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const SECTION_HEADING_PATTERNS = [
  /^\d+(\.\d+)*\.?\s+[A-Za-z]/,
  /^abstract$/i,
  /^keywords?$/i,
  /^introduction$/i,
  /^literature review$/i,
  /^methodology$/i,
  /^research methodology$/i,
  /^materials? and methods?$/i,
  /^results?$/i,
  /^findings?$/i,
  /^discussion$/i,
  /^conclusions?$/i,
  /^references?$/i,
  /^bibliography$/i,
  /^acknowledgements?$/i,
];

function isAffiliationBlock(b: Block): boolean {
  if (AFFILIATION_KEYWORDS.some((p) => p.test(b.text))) return true;
  if (LOCATION_KEYWORDS.some((p) => p.test(b.text))) return true;
  if (EMAIL_REGEX.test(b.text)) { EMAIL_REGEX.lastIndex = 0; return true; }
  if (/e-?mail\s*:/i.test(b.text)) return true;
  return false;
}

function isSectionHeading(text: string): boolean {
  return SECTION_HEADING_PATTERNS.some((p) => p.test(text.trim()));
}

function isAbstractMarker(text: string): boolean {
  return /^abstract\s*[:：]?/i.test(text.trim());
}

function isKeywordsMarker(text: string): boolean {
  return /^keywords?\s*[:：]?/i.test(text.trim());
}

function findAuthorBlocks(blocks: Block[], titleIndex: number): Block[] {
  const authors: Block[] = [];
  const start = titleIndex + 1;
  const searchLimit = Math.min(start + 8, blocks.length);

  for (let i = start; i < searchLimit; i++) {
    const b = blocks[i];
    if (b.type !== 'bold') break;
    if (isAffiliationBlock(b)) break;
    if (isSectionHeading(b.text)) break;
    if (isAbstractMarker(b.text)) break;
    if (isKeywordsMarker(b.text)) break;
    authors.push(b);
  }

  return authors;
}

function findAffiliationBlocks(blocks: Block[], titleIndex: number, authorBlocks: Block[]): Block[] {
  const affiliations: Block[] = [];
  const start = titleIndex + 1 + authorBlocks.length;
  const searchLimit = Math.min(start + 8, blocks.length);

  for (let i = start; i < searchLimit; i++) {
    const b = blocks[i];
    if (b.type === 'paragraph' && !isAffiliationBlock(b)) break;
    if (isSectionHeading(b.text)) break;
    if (isAbstractMarker(b.text)) break;
    if (isKeywordsMarker(b.text)) break;
    if (b.type === 'bold' || b.type === 'paragraph') {
      if (isAffiliationBlock(b) || EMAIL_REGEX.test(b.text)) {
        EMAIL_REGEX.lastIndex = 0;
        affiliations.push(b);
      } else if (affiliations.length > 0) {
        // continuation line after affiliation started
        affiliations.push(b);
      }
    } else {
      break;
    }
  }

  return affiliations;
}

function buildAuthors(
  authorBlocks: Block[],
  affiliationBlocks: Block[],
): ExtractedStructuredData['authors'] {
  const affiliationText = affiliationBlocks.map((b) => b.text).join(', ');
  const emails = affiliationText.match(EMAIL_REGEX) || [];
  EMAIL_REGEX.lastIndex = 0;
  const cleanAffiliation = affiliationText.replace(EMAIL_REGEX, '').replace(/,\s*,/g, ',').trim();
  EMAIL_REGEX.lastIndex = 0;

  const names: string[] = [];
  for (const block of authorBlocks) {
    // Split on comma or semicolon — but NOT on comma inside "Dr." or "Prof."
    // Strategy: split on comma/semicolon, then rejoin tokens starting with Dr/Prof with next token
    const rawParts = block.text.split(/[,;&]|\band\b/i).map((p) => p.trim()).filter(Boolean);

    const merged: string[] = [];
    for (let i = 0; i < rawParts.length; i++) {
      const part = rawParts[i];
      // If part is just a title prefix like "Dr." or "Prof." — merge with next
      if (/^(dr|prof|mr|mrs|ms|er)\.?$/i.test(part) && i + 1 < rawParts.length) {
        merged.push(part + ' ' + rawParts[i + 1]);
        i++; // skip next
      } else {
        merged.push(part);
      }
    }

    for (const part of merged) {
      const clean = part
        .replace(/\(supervisor\)/i, '')
        .replace(/\(corresponding\)/i, '')
        .replace(/\(co-author\)/i, '')
        .trim();
      if (clean.length > 2 && clean.length < 80 && /[a-z]/i.test(clean)) {
        names.push(clean);
      }
    }
  }

  return names.map((name, i) => ({
    name,
    email: emails[i] || undefined,
    affiliation: cleanAffiliation || undefined,
    isCorresponding: i === 0,
  }));
}

// ─── Abstract Detection ───────────────────────────────────────────────────────

function findAbstract(blocks: Block[], titleIndex: number): string {
  const start = titleIndex + 1;

  for (let i = start; i < blocks.length; i++) {
    const b = blocks[i];

    // "Abstract:" inline in bold block
    if (isAbstractMarker(b.text)) {
      const inline = b.text.replace(/^abstract\s*[:：]?\s*/i, '').trim();
      const parts: string[] = inline ? [inline] : [];

      // collect following paragraph blocks until keywords or section heading
      for (let j = i + 1; j < blocks.length; j++) {
        const next = blocks[j];
        if (isKeywordsMarker(next.text)) break;
        if (isSectionHeading(next.text) && !isAbstractMarker(next.text)) break;
        if (next.type === 'table' || next.type === 'list') break;
        parts.push(next.text);
      }

      return parts.join(' ').trim();
    }
  }

  return '';
}

// ─── Keywords Detection ───────────────────────────────────────────────────────

function findKeywords(blocks: Block[], titleIndex: number): string[] {
  const start = titleIndex + 1;

  for (let i = start; i < blocks.length; i++) {
    const b = blocks[i];

    if (isKeywordsMarker(b.text)) {
      const inline = b.text.replace(/^keywords?\s*[:：]?\s*/i, '').trim();
      if (inline) return parseKeywordString(inline);

      const next = blocks[i + 1];
      if (next) return parseKeywordString(next.text);
    }
  }

  return [];
}

function parseKeywordString(value: string): string[] {
  return value.split(/[,;|]/).map((k) => k.trim()).filter(Boolean).slice(0, 12);
}

// ─── Sections Detection ───────────────────────────────────────────────────────

function findSections(
  blocks: Block[],
  fullHtml: string,
): Array<{ heading: string; content: string }> {
  const sectionStartIndexes: number[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];

    // h2/h3/h4 heading tag
    if (b.type === 'heading' && !b.html.startsWith('<h1')) {
      sectionStartIndexes.push(i);
      continue;
    }

    // bold paragraph that matches section heading pattern
    if (b.type === 'bold' && isSectionHeading(b.text) && !isAbstractMarker(b.text) && !isKeywordsMarker(b.text)) {
      sectionStartIndexes.push(i);
    }
  }

  if (sectionStartIndexes.length === 0) {
    // Fallback: return full HTML as single section
    return [{ heading: 'Manuscript Text', content: fullHtml }];
  }

  const sections: Array<{ heading: string; content: string }> = [];

  for (let s = 0; s < sectionStartIndexes.length; s++) {
    const startIdx = sectionStartIndexes[s];
    const endIdx = sectionStartIndexes[s + 1] ?? blocks.length;

    const headingBlock = blocks[startIdx];
    const heading = headingBlock.text.replace(/^\d+(\.\d+)*\.?\s*/, '').trim();

    const contentBlocks = blocks.slice(startIdx + 1, endIdx);
    const content = contentBlocks.map((b) => b.html).join('\n');

    sections.push({ heading, content });
  }

  return sections;
}

function emptyStructuredData(warnings: string[]): ExtractedStructuredData {
  return {
    title: '',
    authors: [],
    affiliation: '',
    abstract: '',
    keywords: [],
    sections: [],
    rawHtml: '',
    warnings,
  };
}

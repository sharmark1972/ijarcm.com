import type { ParsedResearchPaper } from './types';

const ABSTRACT_MARKER = /^abstract\b\s*[:：-]?\s*/i;
const KEYWORDS_MARKER = /^keywords?\b\s*[:：-]?\s*/i;

const HEADING_PATTERNS = [
  /^abstract$/i,
  /^keywords?$/i,
  /^introduction$/i,
  /^literature review$/i,
  /^review of literature$/i,
  /^materials? and methods?$/i,
  /^methodology$/i,
  /^research methodology$/i,
  /^data analysis$/i,
  /^results?$/i,
  /^findings?$/i,
  /^discussion$/i,
  /^conclusions?$/i,
  /^references?$/i,
  /^bibliography$/i,
  /^\d+(\.\d+)*\.?\s+[A-Za-z][A-Za-z0-9 ,:&()/.-]{2,}$/i,
];

const META_PATTERNS = [
  /^issn\b/i,
  /^available online\b/i,
  /^volume\b/i,
  /^issue\b/i,
  /^published\b/i,
  /^accepted\b/i,
  /^received\b/i,
  /^e-mail\b/i,
  /^email\b/i,
];

const AFFILIATION_PATTERNS = [
  /^department\b/i,
  /^faculty\b/i,
  /^school\b/i,
  /^college\b/i,
  /^university\b/i,
  /^institute\b/i,
  /^research\b/i,
  /^centre\b/i,
  /^center\b/i,
  /^author\b/i,
  /^corresponding\b/i,
  /^professor\b/i,
  /^associate professor\b/i,
  /^assistant professor\b/i,
  /^department of\b/i,
];

const LOCATION_PATTERNS = [
  /\bindia\b/i,
  /\bpunjab\b/i,
  /\bharyana\b/i,
  /\bdelhi\b/i,
  /\bmaharashtra\b/i,
  /\bstate\b/i,
  /\bcity\b/i,
  /\bdistrict\b/i,
  /\bdistt\b/i,
  /\bpostal\b/i,
  /\bpin\s*code\b/i,
  /\bpo\s*box\b/i,
  /\bvillage\b/i,
  /\btown\b/i,
  /\broad\b/i,
];

const MEASUREMENT_PATTERNS = [
  /\bcm\s*\/\s*hr\b/i,
  /\bmm\s*\/\s*hr\b/i,
  /\bkg\b/i,
  /\bg\b/i,
  /\bmg\b/i,
  /\bml\b/i,
  /\bl\b/i,
  /\bha\b/i,
  /\bkm\b/i,
  /\bmin\b/i,
  /\bsec\b/i,
  /\bs\b/i,
  /\b%/i,
  /\bppm\b/i,
];

export function parseResearchPaperText(text: string): ParsedResearchPaper {
  const lines = text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return emptyParsedPaper();
  }

  const abstractMarkerIndex = findLineIndex(lines, isAbstractMarker);
  const keywordsMarkerIndex = findLineIndex(lines, isKeywordsMarker);
  const sectionHeadingIndexes = findSectionHeadingIndexes(lines);
  const firstSectionHeadingIndex = sectionHeadingIndexes[0] ?? lines.length;

  const contentBoundaryIndex = minIndex([
    abstractMarkerIndex,
    keywordsMarkerIndex,
    firstSectionHeadingIndex,
    lines.length,
  ]);

  const title = detectTitle(lines, contentBoundaryIndex);
  const titleIndex = title ? lines.findIndex((line) => line === title) : -1;
  const topMatter = detectTopMatter(lines, titleIndex, contentBoundaryIndex);
  const abstract = detectAbstract(
    lines,
    abstractMarkerIndex,
    keywordsMarkerIndex,
    firstSectionHeadingIndex,
    topMatter.endIndex,
  );
  const keywords = detectKeywords(lines, keywordsMarkerIndex, abstractMarkerIndex, firstSectionHeadingIndex);
  const sections = buildSections(lines, sectionHeadingIndexes);

  return {
    title,
    abstract,
    keywords,
    affiliation: topMatter.affiliation || undefined,
    authors: topMatter.authors,
    sections: sections.length > 0 ? sections : [{ heading: 'Manuscript Text', content: text.trim() }],
  };
}

function emptyParsedPaper(): ParsedResearchPaper {
  return {
    title: '',
    abstract: '',
    keywords: [],
    authors: [],
    sections: [{ heading: 'Manuscript Text', content: '' }],
  };
}

function findLineIndex(lines: string[], predicate: (line: string) => boolean) {
  return lines.findIndex(predicate);
}

function findSectionHeadingIndexes(lines: string[]) {
  return lines.reduce<number[]>((indexes, line, index) => {
    if (isSectionHeading(line)) indexes.push(index);
    return indexes;
  }, []);
}

function buildSections(lines: string[], headingIndexes: number[]) {
  return headingIndexes.map((headingIndex, position) => {
    const nextHeadingIndex = headingIndexes[position + 1] ?? lines.length;
    return {
      heading: lines[headingIndex],
      content: lines.slice(headingIndex + 1, nextHeadingIndex).join('\n\n').trim(),
    };
  });
}

function isAbstractMarker(line: string) {
  return ABSTRACT_MARKER.test(line.trim());
}

function isKeywordsMarker(line: string) {
  return KEYWORDS_MARKER.test(line.trim());
}

function isSectionHeading(line: string) {
  const clean = line.trim();
  if (clean.length > 120) return false;
  if (isAbstractMarker(clean) || isKeywordsMarker(clean)) return false;
  if (clean.endsWith('.') && !/^\d+(\.\d+)*\.?\s+/.test(clean)) return false;
  if (MEASUREMENT_PATTERNS.some((pattern) => pattern.test(clean))) return false;

  return HEADING_PATTERNS.some((pattern) => pattern.test(clean));
}

function normalizeHeading(heading: string) {
  return heading
    .replace(/^\d+(\.\d+)*\.?\s*/, '')
    .trim()
    .toLowerCase();
}

function detectTitle(lines: string[], contentBoundaryIndex: number) {
  const topBlock = lines.slice(0, contentBoundaryIndex);
  const candidates = topBlock.filter((line) => isLikelyTitleLine(line));

  if (candidates.length > 0) {
    return candidates[0];
  }

  return topBlock[0] || lines[0] || '';
}

function isLikelyTitleLine(line: string) {
  const clean = line.trim();
  if (!clean) return false;
  if (META_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (AFFILIATION_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (isAbstractMarker(clean) || isKeywordsMarker(clean)) return false;
  if (isSectionHeading(clean)) return false;
  if (clean.length < 8) return false;
  if (clean.length > 220) return false;
  return /[a-z]/i.test(clean);
}

function detectTopMatter(lines: string[], titleIndex: number, contentBoundaryIndex: number) {
  const searchStart = titleIndex >= 0 ? titleIndex + 1 : 0;
  const topMatterLines = lines.slice(searchStart, contentBoundaryIndex);
  const authors: Array<{ name: string; isCorresponding?: boolean }> = [];
  const affiliationLines: string[] = [];
  let lastRelevantIndex = searchStart - 1;
  let seenAuthor = false;
  let seenAffiliation = false;

  for (let offset = 0; offset < topMatterLines.length; offset += 1) {
    const line = topMatterLines[offset];
    const absoluteIndex = searchStart + offset;

    if (isAbstractMarker(line) || isKeywordsMarker(line) || isSectionHeading(line)) {
      break;
    }

    if (isLikelyAffiliationLine(line)) {
      seenAffiliation = true;
      affiliationLines.push(line);
      lastRelevantIndex = absoluteIndex;
      continue;
    }

    if (isLikelyAuthorLine(line)) {
      seenAuthor = true;
      splitAuthorLine(line)
        .map((name) => name.trim())
        .filter((name) => isLikelyPersonName(name))
        .forEach((name, index, array) => {
          authors.push({
            name,
            isCorresponding: authors.length === 0 && index === 0,
          });
        });
      lastRelevantIndex = absoluteIndex;
      continue;
    }

    if (seenAuthor && !seenAffiliation) {
      if (isLikelyAffiliationLine(line, true)) {
        affiliationLines.push(line);
        seenAffiliation = true;
        lastRelevantIndex = absoluteIndex;
        continue;
      }
      break;
    }

    if (seenAffiliation) {
      if (isLikelyAffiliationLine(line, true)) {
        affiliationLines.push(line);
        lastRelevantIndex = absoluteIndex;
        continue;
      }
      break;
    }
  }

  return {
    authors: dedupeByName(authors),
    affiliation: affiliationLines.join(', ').trim(),
    endIndex: Number.isFinite(lastRelevantIndex) ? lastRelevantIndex + 1 : searchStart,
  };
}

function isLikelyAuthorLine(line: string) {
  const clean = line.trim();
  if (!clean) return false;
  if (META_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (AFFILIATION_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (LOCATION_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (isAbstractMarker(clean) || isKeywordsMarker(clean)) return false;
  if (isSectionHeading(clean)) return false;
  if (clean.length > 180) return false;
  if (/[0-9]/.test(clean) && !/\bDr\.?\b/i.test(clean)) return false;
  return /[a-z]/i.test(clean);
}

function isLikelyAffiliationLine(line: string, allowLoose = false) {
  const clean = line.trim();
  if (!clean) return false;
  if (META_PATTERNS.some((pattern) => pattern.test(clean))) return true;
  if (AFFILIATION_PATTERNS.some((pattern) => pattern.test(clean))) return true;
  if (LOCATION_PATTERNS.some((pattern) => pattern.test(clean))) return true;
  if (/\bemail\b|\be-mail\b/i.test(clean)) return true;
  if (/^\d+[\s,.-]/.test(clean)) return false;
  if (allowLoose && clean.length <= 140 && /,/.test(clean) && !/[.?!]$/.test(clean)) return true;
  return false;
}

function isLikelyPersonName(name: string) {
  const clean = name.trim();
  if (!clean) return false;
  if (LOCATION_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (AFFILIATION_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (clean.length > 80) return false;
  if (clean.length < 3) return false;
  if (clean.split(/\s+/).length > 6) return false;
  return /[A-Za-z]/.test(clean);
}

function splitAuthorLine(line: string) {
  return line
    .split(/\s*(?:,|;| and | & )\s*/i)
    .map((part) => part.replace(/\s*\((?:supervisor|corresponding)\)\s*$/i, '').trim())
    .filter(Boolean);
}

function dedupeByName(authors: Array<{ name: string; isCorresponding?: boolean }>) {
  const seen = new Set<string>();
  return authors.filter((author) => {
    const key = author.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function detectAbstract(
  lines: string[],
  abstractMarkerIndex: number,
  keywordsMarkerIndex: number,
  firstSectionHeadingIndex: number,
  authorEndIndex: number,
) {
  const stopIndex = minIndex([
    keywordsMarkerIndex,
    firstSectionHeadingIndex,
    lines.length,
  ]);

  if (abstractMarkerIndex >= 0) {
    const inlineAbstract = lines[abstractMarkerIndex].replace(ABSTRACT_MARKER, '').trim();
    const trailingLines = lines.slice(abstractMarkerIndex + 1, stopIndex).filter((line) => !isKeywordsMarker(line));
    return [inlineAbstract, ...trailingLines].filter(Boolean).join(' ').trim();
  }

  const fallbackStart = Math.min(authorEndIndex + 1, lines.length);
  const fallbackLines = lines.slice(fallbackStart, stopIndex).filter((line) => {
    if (isKeywordsMarker(line)) return false;
    if (isSectionHeading(line)) return false;
    if (META_PATTERNS.some((pattern) => pattern.test(line))) return false;
    return true;
  });

  return fallbackLines.join(' ').trim();
}

function detectKeywords(
  lines: string[],
  keywordsMarkerIndex: number,
  abstractMarkerIndex: number,
  firstSectionHeadingIndex: number,
) {
  if (keywordsMarkerIndex >= 0) {
    const inlineKeywords = lines[keywordsMarkerIndex].replace(KEYWORDS_MARKER, '').trim();
    if (inlineKeywords) {
      return parseKeywords(inlineKeywords);
    }

    const stopIndex = minIndex([firstSectionHeadingIndex, lines.length]);
    const nextLine = lines[keywordsMarkerIndex + 1];
    const followingLine = lines.slice(keywordsMarkerIndex + 1, stopIndex).join(' ').trim();
    return parseKeywords(nextLine || followingLine);
  }

  if (abstractMarkerIndex >= 0) {
    const probeLines = lines.slice(abstractMarkerIndex + 1, firstSectionHeadingIndex);
    const candidate = probeLines.find((line) => /,/.test(line) || /;/.test(line) || /\|/.test(line));
    if (candidate) return parseKeywords(candidate);
  }

  return [];
}

function parseKeywords(value: string) {
  return value
    .split(/[,;|]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function minIndex(values: number[]) {
  const filtered = values.filter((value) => Number.isFinite(value) && value >= 0);
  if (filtered.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...filtered);
}

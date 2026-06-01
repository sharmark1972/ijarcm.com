import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiExtractedData {
  title: string;
  authors: Array<{
    name: string;
    isCorresponding: boolean;
  }>;
  affiliation: string;
  email: string;
  abstract: string;
  keywords: string[];
  extractionMethod: 'gemini' | 'zai' | 'basic';
}

export interface SectionLayout {
  heading: string;
  layout: 'two-column' | 'full-width';
  reason: string;
}

// ─── Metadata Extraction Prompt ───────────────────────────────────────────────

const METADATA_PROMPT = `You are a research paper metadata extractor.

Extract the following fields from the research paper text below and return ONLY a valid JSON object. No explanation, no markdown, just pure JSON.

Fields to extract:
- title: The paper title, clean without quotes
- authors: Array of author objects with "name" (string) and "isCorresponding" (boolean, first author is corresponding)
- affiliation: Full institutional affiliation (department, university, location)
- email: Corresponding author email if found, else empty string
- abstract: Full abstract text, maximum 148 words
- keywords: Array of keywords

Rules:
- title must be clean — remove surrounding quotes if any
- authors must be individual names — split comma/semicolon separated names properly
- Remove labels like (Supervisor), (Co-author), (Guide) from author names
- abstract must be the actual abstract, not introduction
- keywords must be individual items in an array
- If a field is not found, use empty string or empty array

Return ONLY this JSON structure:
{
  "title": "",
  "authors": [{ "name": "", "isCorresponding": true }],
  "affiliation": "",
  "email": "",
  "abstract": "",
  "keywords": []
}

Research paper text:
`;

// ─── Layout Decision Prompt ────────────────────────────────────────────────────

const LAYOUT_PROMPT = `You are a PDF layout manager for a research journal.

Analyze the sections below and decide the layout for each section in the PDF.

Layout Rules:
1. If a section contains a table or image → use "full-width"
2. If a section is plain text only → use "two-column"
3. If total two-column sections count is odd, the last one must be "full-width" (so columns balance evenly)
4. Abstract, References, Bibliography, Conclusion, Acknowledgements → always "full-width"

Return ONLY a valid JSON array. No explanation, no markdown.

Format:
[
  { "heading": "Section heading", "layout": "two-column", "reason": "plain text only" },
  { "heading": "Section heading", "layout": "full-width", "reason": "contains table" }
]

Sections to analyze:
`;

// ─── Public Functions ──────────────────────────────────────────────────────────

export async function tryGeminiOnly(plainText: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return tryGemini(apiKey, plainText.slice(0, 3000));
}

export async function tryZaiOnly(plainText: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return null;
  return tryZai(apiKey, plainText.slice(0, 3000));
}

export async function getLayoutDecisions(
  sections: Array<{ heading: string; content: string }>
): Promise<SectionLayout[] | null> {
  // Build section summary for AI — heading + first 200 chars of content
  const sectionSummary = sections.map((s, i) => {
    const hasTable = /<table/i.test(s.content);
    const hasImage = /<img/i.test(s.content);
    const preview = s.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
    return `Section ${i + 1}: "${s.heading}"
Content preview: ${preview}
Has table: ${hasTable}
Has image: ${hasImage}`;
  }).join('\n\n');

  // Try Gemini first
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const result = await tryLayoutGemini(geminiKey, sectionSummary);
    if (result) return result;
  }

  // Fallback to ZAI
  const zaiKey = process.env.ZAI_API_KEY;
  if (zaiKey) {
    const result = await tryLayoutZai(zaiKey, sectionSummary);
    if (result) return result;
  }

  return null;
}

// ─── Internal Functions ────────────────────────────────────────────────────────

async function tryGemini(apiKey: string, textSample: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(METADATA_PROMPT + textSample);
    return parseMetadataResponse(result.response.text());
  } catch (error) {
    console.warn('Gemini failed:', (error as Error).message);
    return null;
  }
}

async function tryZai(apiKey: string, textSample: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.7-Flash',
        messages: [{ role: 'user', content: METADATA_PROMPT + textSample }],
      }),
    });

    if (!response.ok) {
      console.warn('ZAI failed:', response.status);
      return null;
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content || '';
    return parseMetadataResponse(text);
  } catch (error) {
    console.warn('ZAI failed:', (error as Error).message);
    return null;
  }
}

async function tryLayoutGemini(apiKey: string, sectionSummary: string): Promise<SectionLayout[] | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(LAYOUT_PROMPT + sectionSummary);
    return parseLayoutResponse(result.response.text());
  } catch (error) {
    console.warn('Gemini layout failed:', (error as Error).message);
    return null;
  }
}

async function tryLayoutZai(apiKey: string, sectionSummary: string): Promise<SectionLayout[] | null> {
  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.7-Flash',
        messages: [{ role: 'user', content: LAYOUT_PROMPT + sectionSummary }],
      }),
    });

    if (!response.ok) {
      console.warn('ZAI layout failed:', response.status);
      return null;
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content || '';
    return parseLayoutResponse(text);
  } catch (error) {
    console.warn('ZAI layout failed:', (error as Error).message);
    return null;
  }
}

// ─── Response Parsers ──────────────────────────────────────────────────────────

function parseMetadataResponse(raw: string): Omit<GeminiExtractedData, 'extractionMethod'> | null {
  try {
    // Extract JSON object from response (handles thinking blocks, extra text etc.)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const cleaned = jsonMatch[0].trim();
    const parsed = JSON.parse(cleaned) as GeminiExtractedData;

    if (!parsed.title && !parsed.abstract) return null;

    if (!Array.isArray(parsed.authors)) parsed.authors = [];
    if (!Array.isArray(parsed.keywords)) parsed.keywords = [];

    if (parsed.abstract) {
      const words = parsed.abstract.trim().split(/\s+/);
      if (words.length > 148) {
        parsed.abstract = words.slice(0, 148).join(' ');
      }
    }

    return parsed;
  } catch {
    return null;
  }
}

function parseLayoutResponse(raw: string): SectionLayout[] | null {
  try {
    // Extract JSON array from response (handles thinking blocks, extra text etc.)
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) return null;

    return parsed.map((item: any) => ({
      heading: item.heading || '',
      layout: item.layout === 'two-column' ? 'two-column' : 'full-width',
      reason: item.reason || '',
    }));
  } catch {
    return null;
  }
}

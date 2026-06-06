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

// ─── Metadata Extraction Prompt ───────────────────────────────────────────────

const METADATA_PROMPT = `You are a research paper metadata extractor.

Extract the following fields from the research paper text below and return ONLY a valid JSON object. No explanation, no markdown, just pure JSON.

Fields to extract:
- title: The paper title, clean without quotes
- authors: Array of author objects with "name" (string) and "isCorresponding" (boolean, first author is corresponding)
- affiliation: Full institutional affiliation (department, university, location)
- email: Corresponding author email if found, else empty string
- abstract: Rewritten abstract (see rewriting rules below)
- keywords: Array of keywords

Abstract rewriting rules:
- Rewrite the abstract completely in your own words — do NOT copy sentences verbatim from the paper
- Preserve the original meaning, research findings, methodology, and conclusions fully
- Maximum 148 words, no filler phrases
- Write in clear, formal, academic English that sounds naturally human
- Avoid robotic, repetitive, or overly passive phrasing
- Paraphrase naturally so the result is plagiarism-free

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

// ─── Document Rewrite Prompt ───────────────────────────────────────────────────

const DOCUMENT_REWRITE_PROMPT = `You are a research paper editor. Rewrite the following research paper section text according to these rules:

1. Rewrite the entire text in human-like, natural academic English — avoid robotic, repetitive, or overly passive phrasing
2. Remove all plagiarism — do not copy sentences verbatim
3. Preserve the original meaning, context, findings, methodology, and conclusions completely
4. Keep the same word count — do not add or remove content
5. Do not modify any table content — return tables exactly as received
6. Do not change section headings — use them exactly as-is, do not shorten, rephrase, or alter them in any way
7. Do not add new information, examples, or explanations
8. Do not remove any information
9. Maintain the same structure and flow as the original
10. If the section is a References or Bibliography section — return it completely unchanged, word for word, exactly as received

Return ONLY the rewritten text. No explanation, no comments, no markdown formatting.

Section text:
`;

// ─── Public Functions ──────────────────────────────────────────────────────────

export async function tryGeminiOnly(plainText: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return tryGemini(apiKey, plainText);
}

export async function tryZaiOnly(plainText: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) return null;
  return tryZai(apiKey, plainText);
}

export async function rewriteSectionContent(content: string): Promise<string | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const result = await rewriteWithGemini(geminiKey, content);
    if (result) return result;
  }
  const zaiKey = process.env.ZAI_API_KEY;
  if (zaiKey) {
    const result = await rewriteWithZai(zaiKey, content);
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

// ─── Document Rewrite Internal Functions ──────────────────────────────────────

async function rewriteWithGemini(apiKey: string, content: string): Promise<string | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const result = await model.generateContent(DOCUMENT_REWRITE_PROMPT + content);
    const text = result.response.text().trim();
    return text || null;
  } catch (error) {
    console.warn('Gemini rewrite failed:', (error as Error).message);
    return null;
  }
}

async function rewriteWithZai(apiKey: string, content: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.z.ai/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'GLM-4.7-Flash',
        messages: [{ role: 'user', content: DOCUMENT_REWRITE_PROMPT + content }],
      }),
    });

    if (!response.ok) {
      console.warn('ZAI rewrite failed:', response.status);
      return null;
    }

    const data = await response.json() as any;
    const text = (data?.choices?.[0]?.message?.content || '').trim();
    return text || null;
  } catch (error) {
    console.warn('ZAI rewrite failed:', (error as Error).message);
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

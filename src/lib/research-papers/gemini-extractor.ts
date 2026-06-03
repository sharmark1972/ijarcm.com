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
- abstract: Rewritten abstract, maximum 148 words (see rewriting rules below)
- keywords: Array of keywords

Abstract rewriting rules:
- Rewrite the abstract completely in your own words — do NOT copy sentences verbatim from the paper
- Preserve the original meaning, research findings, methodology, and conclusions fully
- Keep it concise: maximum 148 words, no filler phrases
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

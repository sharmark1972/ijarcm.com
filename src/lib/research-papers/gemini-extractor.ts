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

const EXTRACTION_PROMPT = `You are a research paper metadata extractor.

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

// Called individually from frontend step-by-step flow
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

async function tryGemini(apiKey: string, textSample: string): Promise<Omit<GeminiExtractedData, 'extractionMethod'> | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(EXTRACTION_PROMPT + textSample);
    return parseAiResponse(result.response.text());
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
        model: 'glm-5.1',
        messages: [{ role: 'user', content: EXTRACTION_PROMPT + textSample }],
      }),
    });

    if (!response.ok) {
      console.warn('ZAI failed:', response.status);
      return null;
    }

    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content || '';
    return parseAiResponse(text);
  } catch (error) {
    console.warn('ZAI failed:', (error as Error).message);
    return null;
  }
}

function parseAiResponse(raw: string): Omit<GeminiExtractedData, 'extractionMethod'> | null {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

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

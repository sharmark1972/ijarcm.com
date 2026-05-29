import { readFile } from 'fs/promises';
import mammoth from 'mammoth';

export interface ExtractedDocumentText {
  text: string;
  warnings: string[];
}

export async function extractDocumentText(filePath: string, extension: string): Promise<ExtractedDocumentText> {
  if (extension !== '.docx') {
    return {
      text: '',
      warnings: ['Legacy .doc files can be uploaded, but automatic extraction currently supports DOCX only.'],
    };
  }

  const buffer = await readFile(filePath);
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: normalizeExtractedText(result.value),
    warnings: result.messages.map((message) => message.message),
  };
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

import { readFile } from 'fs/promises';
import mammoth from 'mammoth';

export interface ExtractedDocumentText {
  text: string;
  warnings: string[];
}

export interface ExtractedDocumentHtml {
  html: string;
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

export async function extractDocumentHtml(filePath: string, extension: string): Promise<ExtractedDocumentHtml> {
  if (extension !== '.docx') {
    return {
      html: '',
      warnings: ['Legacy .doc files can be uploaded, but automatic extraction currently supports DOCX only.'],
    };
  }

  const buffer = await readFile(filePath);
  const result = await mammoth.convertToHtml(
    { buffer },
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

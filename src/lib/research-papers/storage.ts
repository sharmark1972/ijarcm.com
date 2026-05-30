import { unlink } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { uploadToR2, deleteFromR2 } from '../r2-upload';
import type { StoredResearchPaperFile } from './types';

const ALLOWED_EXTENSIONS = new Set(['.docx', '.doc']);
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const extension = extname(fileName).toLowerCase();
  const baseName = fileName
    .replace(extension, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 80);

  return `${baseName || 'manuscript'}${extension}`;
}

function getContentTypeFromExtension(extension: string) {
  switch (extension) {
    case '.doc':
      return 'application/msword';
    case '.docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

export function validateResearchPaperFile(file: File) {
  const extension = extname(file.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Only DOC and DOCX files are supported.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size must be less than 25MB.');
  }

  return extension;
}

export async function storeResearchPaperFile(file: File, buffer?: Buffer): Promise<StoredResearchPaperFile> {
  const extension = validateResearchPaperFile(file);
  const uploadId = randomUUID();
  const safeName = sanitizeFileName(file.name);
  const fileBuffer = buffer ?? Buffer.from(await file.arrayBuffer());
  const fileUrl = await uploadToR2(
    fileBuffer,
    safeName,
    `research-papers/sources/${uploadId}`,
    file.type || getContentTypeFromExtension(extension),
  );

  return {
    originalName: file.name,
    fileUrl,
    size: file.size,
    extension,
  };
}

export async function removeStoredResearchPaperFile(filePath?: string | null) {
  if (!filePath) return;

  if (/^https?:\/\//i.test(filePath)) {
    try {
      await deleteFromR2(filePath);
    } catch {
      // Missing files should not block draft deletion.
    }
    return;
  }

  const normalized = filePath.replace(/^\/+/, '');
  if (!normalized.startsWith('uploads/research-papers/')) return;

  try {
    await unlink(join(process.cwd(), 'public', normalized));
  } catch {
    // Missing files should not block draft deletion.
  }
}

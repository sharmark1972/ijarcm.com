import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import type { StoredResearchPaperFile } from './types';

const UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads', 'research-papers');
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

export async function storeResearchPaperFile(file: File): Promise<StoredResearchPaperFile> {
  const extension = validateResearchPaperFile(file);
  const uploadId = randomUUID();
  const folder = join(UPLOAD_ROOT, uploadId);
  await mkdir(folder, { recursive: true });

  const safeName = sanitizeFileName(file.name);
  const absolutePath = join(folder, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    originalName: file.name,
    relativePath: `/uploads/research-papers/${uploadId}/${safeName}`,
    absolutePath,
    size: file.size,
    extension,
  };
}

export async function removeStoredResearchPaperFile(relativePath?: string | null) {
  if (!relativePath) return;
  const normalized = relativePath.replace(/^\/+/, '');
  if (!normalized.startsWith('uploads/research-papers/')) return;

  try {
    await unlink(join(process.cwd(), 'public', normalized));
  } catch {
    // Missing files should not block draft deletion.
  }
}

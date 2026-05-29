import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export function isRemoteFilePath(filePath: string | null | undefined): filePath is string {
  return !!filePath && /^https?:\/\//i.test(filePath);
}

export function getFileNameFromPath(filePath: string, fallback = 'document'): string {
  try {
    if (isRemoteFilePath(filePath)) {
      const url = new URL(filePath);
      return url.pathname.split('/').pop() || fallback;
    }
  } catch {
    // Fall through to path parsing.
  }

  return filePath.split('/').pop() || fallback;
}

export function getContentTypeFromPath(filePath: string): string {
  const fileName = getFileNameFromPath(filePath);
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  switch (fileExtension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export function resolveLocalPublicFilePath(filePath: string): string {
  if (filePath.startsWith('/uploads/') || filePath.startsWith('/')) {
    return join(process.cwd(), 'public', filePath);
  }

  return join(process.cwd(), filePath);
}

export async function buildStoredFileResponse(
  filePath: string,
  options: {
    filename?: string;
    disposition?: 'inline' | 'attachment';
    cacheControl?: string;
    extraHeaders?: Record<string, string>;
  } = {}
): Promise<NextResponse> {
  const filename = options.filename || getFileNameFromPath(filePath);
  const contentType = getContentTypeFromPath(filePath);
  const disposition = options.disposition || 'attachment';
  const cacheControl = options.cacheControl || 'private, no-cache, no-store, must-revalidate';

  let body: Uint8Array;

  if (isRemoteFilePath(filePath)) {
    const upstream = await fetch(filePath);
    if (!upstream.ok) {
      throw new Error(`Remote file unavailable: ${upstream.status}`);
    }
    body = new Uint8Array(await upstream.arrayBuffer());
  } else {
    const localPath = resolveLocalPublicFilePath(filePath);
    await stat(localPath);
    body = new Uint8Array(await readFile(localPath));
  }

  return new NextResponse(Buffer.from(body), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': cacheControl,
      ...options.extraHeaders,
    },
  });
}

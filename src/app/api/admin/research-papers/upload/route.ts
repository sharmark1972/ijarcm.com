import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createResearchPaperDraftFromUpload, ExtractionMode } from '@/lib/research-papers/research-paper-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'ADMIN') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const issueId = formData.get('issueId');
  const extractionMode = (formData.get('extractionMode') as ExtractionMode) || 'auto';

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'File is required' }), { status: 400 });
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const { extractedData, extractionMethod } = await createResearchPaperDraftFromUpload(
          file,
          (step) => {
            const messages = {
              gemini: 'Extracting with Gemini AI...',
              zai: 'Trying ZAI AI...',
              basic: 'Using basic extraction...',
            };
            send('status', { step, message: messages[step] });
          },
          extractionMode
        );

        send('done', { extractedData, extractionMethod });
      } catch (error) {
        send('error', { error: error instanceof Error ? error.message : 'Extraction failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

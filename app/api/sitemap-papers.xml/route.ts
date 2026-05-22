import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijarcm.com';
    
    // Fetch all published papers with their PDFs
    const papers = await prisma.paper.findMany({
      where: {
        status: 'PUBLISHED',
        filePath: {
          not: ''
        }
      },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        filePath: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Build XML sitemap for PDFs
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${papers.map(paper => {
  const lastmod = paper.publishedAt?.toISOString() || new Date().toISOString();
  return `  <url>
    <loc>${baseUrl}/api/papers/${paper.id}/pdf/public</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" type="application/pdf" href="${baseUrl}/api/papers/${paper.id}/pdf/public" xmlns:xhtml="http://www.w3.org/1999/xhtml"/>
    <xhtml:link rel="canonical" href="${baseUrl}/papers/${paper.id}" xmlns:xhtml="http://www.w3.org/1999/xhtml"/>
  </url>`;
}).join('\n')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'X-Robots-Tag': 'index, follow'
      }
    });
  } catch (error) {
    console.error('Error generating PDF sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
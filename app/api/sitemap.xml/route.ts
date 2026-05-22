import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijarcm.com';
    
    // Static pages with their priorities and change frequencies
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/papers', priority: '0.9', changefreq: 'daily' },
      { url: '/conferences', priority: '0.8', changefreq: 'weekly' },
      { url: '/archives', priority: '0.9', changefreq: 'weekly' }, // Increased priority for archives
      { url: '/editorial-board', priority: '0.6', changefreq: 'monthly' },
      { url: '/submission-guidelines', priority: '0.7', changefreq: 'monthly' },
      { url: '/peer-review-process', priority: '0.6', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms-of-service', priority: '0.3', changefreq: 'yearly' },
      { url: '/auth/login', priority: '0.4', changefreq: 'monthly' },
      { url: '/auth/register', priority: '0.4', changefreq: 'monthly' },
      { url: '/submit', priority: '0.8', changefreq: 'monthly' },
      { url: '/library', priority: '0.7', changefreq: 'weekly' }
    ];

    // Fetch dynamic content
    const papers = await prisma.paper.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        publishedAt: true
      }
    });

    // Fetch archives/issues
    const archives = await prisma.archive.findMany({
      select: {
        id: true,
        publishedAt: true,
        updatedAt: true,
        volume: true,
        issue: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Fetch authors for individual author pages
    const authors = await prisma.paperAuthor.findMany({
      distinct: ['userId'],
      select: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Build XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${staticPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
${papers.map(paper => `  <url>
     <loc>${baseUrl}/papers/${paper.id}</loc>
     <lastmod>${(paper.publishedAt || new Date()).toISOString()}</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.8</priority>
   </url>`).join('\n')}
${archives.map(archive => `  <url>
     <loc>${baseUrl}/issues/${archive.id}</loc>
     <lastmod>${(archive.updatedAt || archive.publishedAt || new Date()).toISOString()}</lastmod>
     <changefreq>weekly</changefreq>
     <priority>0.9</priority>
   </url>`).join('\n')}
${authors.map(author => `  <url>
     <loc>${baseUrl}/authors/${author.user.firstName}-${author.user.lastName}</loc>
     <lastmod>${new Date().toISOString()}</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.6</priority>
   </url>`).join('\n')}

</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600' // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
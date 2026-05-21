import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Fetch latest 50 published papers
    const papers = await prisma.paper.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        abstract: true,
        publishedAt: true,
        submittedAt: true,
        paperAuthors: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            },
            authorOrder: true
          },
          orderBy: {
            authorOrder: 'asc'
          }
        },
        keywords: true,
        category: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 50
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijrcam.com';
    const buildDate = new Date().toUTCString();

    const rssItems = papers.map(paper => {
      const authors = paper.paperAuthors.map(a => `${a.user.firstName} ${a.user.lastName}`).join(', ');
      const pubDate = paper.publishedAt ? new Date(paper.publishedAt).toUTCString() : new Date(paper.submittedAt).toUTCString();
      const paperUrl = `${baseUrl}/papers/${paper.id}`;
      
      return `
    <item>
      <title><![CDATA[${paper.title}]]></title>
      <description><![CDATA[${paper.abstract || 'No abstract available'}]]></description>
      <link>${paperUrl}</link>
      <guid isPermaLink="true">${paperUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${authors}]]></author>
      ${paper.keywords ? `<category><![CDATA[${paper.keywords}]]></category>` : ''}
      ${paper.category ? `<category><![CDATA[${paper.category}]]></category>` : ''}
      <dc:creator><![CDATA[${authors}]]></dc:creator>
      <dc:type>Text</dc:type>
      <dc:format>text/html</dc:format>
      <dc:language>en</dc:language>
    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:prism="http://prismstandard.org/namespaces/basic/2.0/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IJARCM - Latest Research Papers</title>
    <description>Latest research papers published in the International Journal of Academic Research in Commerce and Management (IJARCM)</description>
    <link>${baseUrl}/papers</link>
    <atom:link href="${baseUrl}/rss/papers" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>1440</ttl>
    <generator>IJARCM RSS Generator</generator>
    <managingEditor>editor@ijarcm.com (IJARCM Editorial Team)</managingEditor>
    <webMaster>webmaster@ijarcm.com (IJARCM Web Team)</webMaster>
    <category>Academic Research</category>
    <category>Computer Science</category>
    <category>Management</category>
    <image>
      <url>${baseUrl}/ijarcm-logo.svg</url>
      <title>IJARCM</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <copyright>Copyright © ${new Date().getFullYear()} IJARCM. All rights reserved.</copyright>
    <docs>https://www.rssboard.org/rss-specification</docs>${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rssXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'X-Robots-Tag': 'noindex',
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

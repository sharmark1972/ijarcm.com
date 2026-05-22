import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijarcm.com';
    
    // Fetch latest published papers
    const papers = await prisma.paper.findMany({
      where: {
        status: 'PUBLISHED'
      },
      include: {
        paperAuthors: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 50 // Limit to latest 50 papers
    });

    const rssItems = papers.map(paper => {
      const authors = paper.paperAuthors.map(author => `${author.user.firstName} ${author.user.lastName}`).join(', ');
      const pubDate = paper.publishedAt ? new Date(paper.publishedAt).toUTCString() : new Date().toUTCString();
      
      return `
    <item>
      <title><![CDATA[${paper.title}]]></title>
      <description><![CDATA[${paper.abstract || 'No abstract available'}]]></description>
      <link>${baseUrl}/papers/${paper.id}</link>
      <guid isPermaLink="true">${baseUrl}/papers/${paper.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <author><![CDATA[${authors}]]></author>
      <category><![CDATA[Research Paper]]></category>
      ${paper.keywords ? `<category><![CDATA[${paper.keywords}]]></category>` : ''}

    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>IJARCM - Latest Research Papers</title>
    <description>Latest research papers published in the International Journal of Academic Research in Commerce and Management (IJARCM)</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/rss/papers.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>1440</ttl>
    <generator>IJARCM RSS Generator</generator>
    <managingEditor>editor@ijarcm.com (IJARCM Editorial Board)</managingEditor>
    <webMaster>webmaster@ijarcm.com (IJARCM Web Team)</webMaster>
    <category>Academic Research</category>
    <category>Computer Applications</category>
    <category>Management</category>
    <category>Technology</category>
    <image>
      <url>${baseUrl}/images/ijarcm-logo.svg</url>
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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
        'X-Robots-Tag': 'index, follow'
      }
    });
  } catch (error) {
    console.error('Error generating RSS feed for papers:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Set dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour
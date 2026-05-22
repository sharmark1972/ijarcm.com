import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijarcm.com';
    
    // Fetch latest announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 25 // Limit to latest 25 announcements
    });

    const rssItems = announcements.map(announcement => {
      const pubDate = new Date(announcement.createdAt).toUTCString();
      const priority = announcement.priority || 'NORMAL';
      
      return `
    <item>
      <title><![CDATA[${announcement.title}]]></title>
      <description><![CDATA[${announcement.content}]]></description>
      <link>${baseUrl}/announcements/${announcement.id}</link>
      <guid isPermaLink="true">${baseUrl}/announcements/${announcement.id}</guid>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${announcement.type || 'Announcement'}]]></category>
      <category><![CDATA[Priority: ${priority}]]></category>
      ${announcement.targetAudience ? `<category><![CDATA[${announcement.targetAudience}]]></category>` : ''}
    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>IJARCM - Latest Announcements</title>
    <description>Latest announcements and news from the International Journal of Academic Research in Commerce and Management (IJARCM)</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/rss/announcements.xml" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <ttl>720</ttl>
    <generator>IJARCM RSS Generator</generator>
    <managingEditor>editor@ijarcm.com (IJARCM Editorial Board)</managingEditor>
    <webMaster>webmaster@ijarcm.com (IJARCM Web Team)</webMaster>
    <category>Academic News</category>
    <category>Journal Announcements</category>
    <category>Research Updates</category>
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
        'Cache-Control': 'public, max-age=1800, s-maxage=1800', // Cache for 30 minutes
        'X-Robots-Tag': 'index, follow'
      }
    });
  } catch (error) {
    console.error('Error generating RSS feed for announcements:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Set dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 1800; // Revalidate every 30 minutes
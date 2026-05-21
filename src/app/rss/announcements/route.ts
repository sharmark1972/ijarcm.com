import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Fetch latest 25 published announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        isPublished: true,
        publishedAt: {
          lte: new Date()
        }
      },
      select: {
        id: true,
        title: true,
        content: true,
        publishedAt: true,
        updatedAt: true,
        targetAudience: true,
        priority: true,
        expiresAt: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 25
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ijrcam.com';
    const buildDate = new Date().toUTCString();

    const rssItems = announcements.map(announcement => {
      const pubDate = announcement.publishedAt ? new Date(announcement.publishedAt).toUTCString() : new Date(announcement.updatedAt).toUTCString();
      const announcementUrl = `${baseUrl}/announcements/${announcement.id}`;
      
      // Extract first 200 characters for description
      const description = announcement.content 
        ? announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : '')
        : 'No content available';
      
      return `
    <item>
      <title><![CDATA[${announcement.title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>${announcementUrl}</link>
      <guid isPermaLink="true">${announcementUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>editor@ijarcm.com (IJARCM Editorial Team)</author>
      ${announcement.targetAudience ? `<category><![CDATA[${announcement.targetAudience}]]></category>` : ''}
      ${announcement.priority ? `<category><![CDATA[Priority: ${announcement.priority}]]></category>` : ''}
      <dc:creator>IJARCM Editorial Team</dc:creator>
      <dc:type>Text</dc:type>
      <dc:format>text/html</dc:format>
      <dc:language>en</dc:language>
      ${announcement.expiresAt ? `<expiryDate>${new Date(announcement.expiresAt).toUTCString()}</expiryDate>` : ''}
    </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>IJARCM - Latest Announcements</title>
    <description>Latest announcements and news from the International Journal of Academic Research in Commerce and Management (IJARCM)</description>
    <link>${baseUrl}/announcements</link>
    <atom:link href="${baseUrl}/rss/announcements" rel="self" type="application/rss+xml" />
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>720</ttl>
    <generator>IJARCM RSS Generator</generator>
    <managingEditor>editor@ijarcm.com (IJARCM Editorial Team)</managingEditor>
    <webMaster>webmaster@ijarcm.com (IJARCM Web Team)</webMaster>
    <category>Academic News</category>
    <category>Journal Announcements</category>
    <category>Research Updates</category>
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
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
        'X-Robots-Tag': 'noindex',
        'Vary': 'Accept-Encoding'
      }
    });

  } catch (error) {
    console.error('Error generating announcements RSS feed:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

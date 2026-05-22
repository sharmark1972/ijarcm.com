import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { content, title, author, volume, issue } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const doc = new jsPDF({
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Journal constants
    const JOURNAL_NAME = "International Journal of Research in Computer Application & Management";
    const ISSN_PRINT = "2455-0116";
    const ISSN_ONLINE = "2395-6410";
    const SITE_URL = "www.ijrcam.com";

    // Helper function to add header to each page
    const addHeader = (pageNumber: number) => {
      if (pageNumber === 1) return; // Skip header on title page
      
      doc.setFontSize(9);
      doc.setFont('times', 'italic');
      doc.setTextColor(60, 60, 60);
      
      const headerText = volume && issue 
        ? `Volume ${volume}, Issue ${issue}` 
        : 'IJRCAM Journal';
      
      doc.text(headerText, pageWidth / 2, 10, { align: 'center' });
      
      // Add a line below header
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    };

    // Helper function to add footer to each page
    const addFooter = (pageNumber: number) => {
      const footerY = pageHeight - 10;
      
      doc.setFontSize(7.5);
      doc.setFont('times', 'normal');
      doc.setTextColor(80, 80, 80);
      
      // Left side: Journal name (abbreviated for space)
      doc.text('IJRCAM', margin, footerY);
      
      // Center: ISSN
      const issnText = `ISSN (Print): ${ISSN_PRINT} | ISSN (Online): ${ISSN_ONLINE}`;
      doc.text(issnText, pageWidth / 2, footerY, { align: 'center' });
      
      // Right side: Website and page number
      const websiteText = `${SITE_URL} | Page ${pageNumber}`;
      doc.text(websiteText, pageWidth - margin, footerY, { align: 'right' });
      
      // Add a line above footer
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.2);
      doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    };

    let currentPage = 1;
    let sectionCounter = 0;

    // Helper function to add text with word wrap
    const addWrappedText = (
      text: string,
      fontSize: number,
      isBold: boolean = false,
      color: [number, number, number] = [0, 0, 0],
      indent: number = 0
    ) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont('times', 'bold');
      } else {
        doc.setFont('times', 'normal');
      }
      doc.setTextColor(color[0], color[1], color[2]);

      const lines = doc.splitTextToSize(text, contentWidth - indent);
      
      // Check if we need a new page
      if (yPosition + lines.length * (fontSize * 0.5) > pageHeight - 20) { // Reserve space for footer
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        addFooter(currentPage);
        yPosition = 18; // Start below header
      }

      lines.forEach((line: string) => {
        doc.text(line, margin + indent, yPosition);
        yPosition += fontSize * 0.5;
      });

      yPosition += 3; // Add some spacing after text
    };

    // Helper function to add a section header (Scopus style)
    const addSectionHeader = (text: string, numbered: boolean = true) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        currentPage++;
        addHeader(currentPage);
        addFooter(currentPage);
        yPosition = 18;
      }
      
      yPosition += 5;
      
      // Add section number if needed
      let displayText = text.toUpperCase();
      if (numbered && !text.toLowerCase().includes('abstract') && 
          !text.toLowerCase().includes('keywords') &&
          !text.toLowerCase().includes('references')) {
        sectionCounter++;
        displayText = `${sectionCounter}. ${displayText}`;
      }
      
      doc.setFontSize(12);
      doc.setFont('times', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(displayText, margin, yPosition);
      yPosition += 2;
      
      // Add single underline (Scopus style)
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;
    };

    // Helper function to add a subsection header
    const addSubsectionHeader = (text: string) => {
      yPosition += 3;
      addWrappedText(text.toUpperCase(), 10, true, [0, 0, 0]);
      yPosition += 3;
    };

    // Title Page (Scopus style)
    
    // Add journal header on title page
    doc.setFontSize(11);
    doc.setFont('times', 'bold');
    doc.setTextColor(0, 0, 100);
    doc.text(JOURNAL_NAME, pageWidth / 2, 20, { align: 'center' });
    
    // Add ISSN below journal name
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(60, 60, 60);
    const issnLine = `ISSN (Print): ${ISSN_PRINT} | ISSN (Online): ${ISSN_ONLINE}`;
    doc.text(issnLine, pageWidth / 2, 26, { align: 'center' });
    
    // Add volume and issue if provided
    if (volume && issue) {
      doc.setFontSize(10);
      doc.setFont('times', 'italic');
      doc.text(`Volume ${volume}, Issue ${issue}`, pageWidth / 2, 32, { align: 'center' });
    }
    
    // Add decorative line
    doc.setDrawColor(0, 0, 100);
    doc.setLineWidth(0.5);
    doc.line(30, 36, pageWidth - 30, 36);
    
    // Article title
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    
    const titleLines = doc.splitTextToSize((title || 'Article').toUpperCase(), contentWidth - 20);
    const titleHeight = titleLines.length * 10;
    const titleY = 60;
    
    titleLines.forEach((line: string, index: number) => {
      doc.text(line, pageWidth / 2, titleY + index * 10, { align: 'center' });
    });

    // Author (italic, Scopus style)
    if (author) {
      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      doc.text(author, pageWidth / 2, titleY + titleHeight + 20, { align: 'center' });
    }

    // Date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(currentDate, pageWidth / 2, titleY + titleHeight + 30, { align: 'center' });

    // Add journal info box at bottom of title page
    const boxY = pageHeight - 50;
    doc.setDrawColor(0, 0, 100);
    doc.setLineWidth(0.3);
    doc.rect(margin, boxY, contentWidth, 30);
    
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Published by:', margin + 5, boxY + 6);
    doc.setFont('times', 'bold');
    doc.text(JOURNAL_NAME, margin + 5, boxY + 11);
    doc.setFont('times', 'normal');
    doc.text(`Website: ${SITE_URL}`, margin + 5, boxY + 16);
    doc.text(`ISSN (Print): ${ISSN_PRINT} | ISSN (Online): ${ISSN_ONLINE}`, margin + 5, boxY + 21);
    if (volume && issue) {
      doc.text(`Volume ${volume}, Issue ${issue}`, margin + 5, boxY + 26);
    }

    // Add footer to title page
    addFooter(currentPage);

    // Add new page for content
    doc.addPage();
    currentPage++;
    addHeader(currentPage);
    addFooter(currentPage);
    yPosition = 18; // Start below header

    // Parse and render the HTML content
    const htmlContent = content;

    // Extract sections from HTML
    const sections = parseHtmlSections(htmlContent);

    sections.forEach((section) => {
      if (section.type === 'header') {
        // Don't number Abstract, Keywords, and References
        const shouldNumber = !section.text.toLowerCase().includes('abstract') && 
                            !section.text.toLowerCase().includes('keywords') &&
                            !section.text.toLowerCase().includes('references');
        addSectionHeader(section.text, shouldNumber);
      } else if (section.type === 'subheader') {
        addSubsectionHeader(section.text);
      } else if (section.type === 'paragraph') {
        addWrappedText(section.text, 11, false, [0, 0, 0], 0); // Justified paragraph with 11pt font
      } else if (section.type === 'abstract') {
        // Abstract header (uppercase, Scopus style)
        yPosition += 5;
        doc.setFontSize(11);
        doc.setFont('times', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('ABSTRACT', margin, yPosition);
        yPosition += 6;
        
        // Abstract content - italicized and justified
        doc.setFont('times', 'italic');
        doc.setFontSize(10);
        const abstractLines = doc.splitTextToSize(section.text, contentWidth - 10);
        abstractLines.forEach((line: string) => {
          if (yPosition > pageHeight - 25) {
            doc.addPage();
            currentPage++;
            addHeader(currentPage);
            addFooter(currentPage);
            yPosition = 18;
          }
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      } else if (section.type === 'keywords') {
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('Keywords: ', margin, yPosition);
        doc.setFont('times', 'italic');
        const keywordText = section.text.replace('Keywords:', '').trim();
        const keywordLines = doc.splitTextToSize(keywordText, contentWidth - 25);
        keywordLines.forEach((line: string, idx: number) => {
          if (idx === 0) {
            doc.text(line, margin + 25, yPosition);
          } else {
            yPosition += 5;
            doc.text(line, margin + 25, yPosition);
          }
        });
        yPosition += 8;
      } else if (section.type === 'reference') {
        addWrappedText(section.text, 9, false, [0, 0, 0], 5);
      }
    });

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(title || 'article').replace(/\s+/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

interface Section {
  type: 'header' | 'subheader' | 'paragraph' | 'abstract' | 'keywords' | 'reference';
  text: string;
}

function parseHtmlSections(html: string): Section[] {
  const sections: Section[] = [];

  // Remove HTML tags and extract content
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  
  if (tempDiv) {
    tempDiv.innerHTML = html;
    
    // Get all text nodes and structure
    const elements = tempDiv.querySelectorAll('h1, h2, h3, p, div, strong');
    
    elements.forEach((el) => {
      const text = el.textContent?.trim() || '';
      if (!text) return;

      const tagName = el.tagName.toLowerCase();
      
      if (tagName === 'h1' || tagName === 'h2') {
        sections.push({ type: 'header', text });
      } else if (tagName === 'h3') {
        sections.push({ type: 'subheader', text });
      } else if (el.textContent?.includes('Abstract')) {
        // Extract abstract content
        const abstractText = el.textContent?.replace('Abstract', '').trim() || '';
        if (abstractText) {
          sections.push({ type: 'abstract', text: abstractText });
        }
      } else if (el.textContent?.includes('Keywords:')) {
        sections.push({ type: 'keywords', text });
      } else if (el.textContent?.includes('References')) {
        // Skip the header, references will be added separately
      } else if (el.parentElement?.textContent?.includes('References')) {
        sections.push({ type: 'reference', text });
      } else {
        sections.push({ type: 'paragraph', text });
      }
    });
  } else {
    // Fallback for server-side rendering
    // Simple regex-based parsing
    const headerMatch = html.match(/<h[12][^>]*>(.*?)<\/h[12]>/g);
    const paragraphMatch = html.match(/<p[^>]*>(.*?)<\/p>/g);
    
    if (headerMatch) {
      headerMatch.forEach(h => {
        const text = h.replace(/<[^>]*>/g, '').trim();
        if (text) sections.push({ type: 'header', text });
      });
    }
    
    if (paragraphMatch) {
      paragraphMatch.forEach(p => {
        const text = p.replace(/<[^>]*>/g, '').trim();
        if (text && !text.includes('Abstract') && !text.includes('Keywords:')) {
          sections.push({ type: 'paragraph', text });
        }
      });
    }
  }

  return sections;
}

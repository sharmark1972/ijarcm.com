import { NextRequest, NextResponse } from 'next/server';

interface ArticleFormData {
  title: string;
  author: string;
  material: string;
  site: string;
  keywords: string;
  abstract: string;
  introduction: string;
  methodology: string;
  results: string;
  discussion: string;
  conclusion: string;
  references: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ArticleFormData = await request.json();

    // Generate article content based on the provided data
    const articleContent = generateArticleContent(data);

    return NextResponse.json({ content: articleContent });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}

function generateArticleContent(data: ArticleFormData): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Build the article HTML in Scopus-level format
  let html = `
    <div style="font-family: 'Times New Roman', Times, serif; line-height: 1.8; color: #000;">
      <!-- Title Page Header -->
      <div style="text-align: center; margin-bottom: 50px; padding-bottom: 30px; border-bottom: 3px double #000;">
        <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; letter-spacing: 1px;">
          ${escapeHtml(data.title)}
        </h1>
        ${data.author ? `
        <p style="font-size: 14px; color: #000; font-style: italic; margin-bottom: 5px;">
          ${escapeHtml(data.author)}
        </p>
        ` : ''}
        <p style="font-size: 11px; color: #333; margin-top: 15px;">${currentDate}</p>
      </div>

      <!-- Abstract -->
      ${data.abstract ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 12px; color: #000; text-transform: uppercase;">
          Abstract
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.abstract)}
        </p>
      </div>
      ` : ''}

      <!-- Keywords -->
      ${data.keywords ? `
      <div style="margin-bottom: 35px;">
        <p style="font-size: 11px; color: #000;">
          <strong style="text-transform: uppercase;">Keywords:</strong> ${escapeHtml(data.keywords)}
        </p>
      </div>
      ` : ''}

      <!-- Material and Site Context -->
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          1. Material and Site Context
        </h2>
        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #000; text-transform: uppercase;">
            1.1 Material
          </h3>
          <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
            ${escapeHtml(data.material)}
          </p>
        </div>
        <div>
          <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #000; text-transform: uppercase;">
            1.2 Site
          </h3>
          <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
            ${escapeHtml(data.site)}
          </p>
        </div>
      </div>

      <!-- Introduction -->
      ${data.introduction ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          2. Introduction
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.introduction)}
        </p>
      </div>
      ` : ''}

      <!-- Methodology -->
      ${data.methodology ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          3. Methodology
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.methodology)}
        </p>
      </div>
      ` : ''}

      <!-- Results -->
      ${data.results ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          4. Results
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.results)}
        </p>
      </div>
      ` : ''}

      <!-- Discussion -->
      ${data.discussion ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          5. Discussion
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.discussion)}
        </p>
      </div>
      ` : ''}

      <!-- Conclusion -->
      ${data.conclusion ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          6. Conclusion
        </h2>
        <p style="font-size: 11px; text-align: justify; text-indent: 20px; line-height: 1.7;">
          ${escapeHtml(data.conclusion)}
        </p>
      </div>
      ` : ''}

      <!-- References -->
      ${data.references ? `
      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #000; text-transform: uppercase; border-bottom: 2px solid #000; padding-bottom: 8px;">
          7. References
        </h2>
        <div style="font-size: 10px; color: #000; line-height: 1.6;">
          ${data.references.split('\n').filter(ref => ref.trim()).map((ref, index) =>
            `<p style="margin-bottom: 10px; padding-left: 25px; text-indent: -25px;">[${index + 1}] ${escapeHtml(ref)}</p>`
          ).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;

  return html;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

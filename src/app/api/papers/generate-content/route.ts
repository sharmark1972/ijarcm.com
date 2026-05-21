import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Z.AI API Configuration
const ZAI_API_KEY = '48d0f19809a7421e9ab32c116b499f0a.L1qF6IHyGGs61iDj';
const ZAI_ENDPOINT = 'https://api.z.ai/api/paas/v4/chat/completions';
const ZAI_MODEL = 'glm-4.6v-flash';

interface GenerateContentRequest {
  section: 'introduction' | 'literatureReview' | 'methodology' | 'results' | 'discussion' | 'conclusion' | 'references';
  title: string;
  abstract: string;
  keywords: string;
  category: string;
  wordCount: number;
  existingContent?: string;
}

interface ZAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ZAIRequest {
  model: string;
  messages: ZAIMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ZAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

// Generate prompt based on section type
function generatePrompt(
  section: string,
  title: string,
  abstract: string,
  keywords: string,
  category: string,
  wordCount: number,
  existingContent?: string
): string {
  const wordCountInstruction = `Write approximately ${wordCount} words for this section.`;
  
  const baseContext = `
Paper Title: ${title}
Abstract: ${abstract}
Keywords: ${keywords}
Category: ${category}
`;

  const sectionPrompts: Record<string, string> = {
    introduction: `Write a comprehensive introduction section for an academic paper.

${baseContext}

${wordCountInstruction}

The introduction should:
- Provide background information on the research topic
- State the research problem or gap
- Present the research objectives or questions
- Outline the significance of the study
- Provide a brief overview of the paper structure

Write in formal academic style with proper citations where appropriate.`,

    literatureReview: `Write a comprehensive literature review section for an academic paper.

${baseContext}

${wordCountInstruction}

The literature review should:
- Review relevant theoretical frameworks
- Summarize key previous studies and findings
- Identify research gaps in the existing literature
- Develop hypotheses based on the literature review
- Connect the literature to the current study

Write in formal academic style with proper citations where appropriate.`,

    methodology: `Write a detailed methodology section for an academic paper.

${baseContext}

${wordCountInstruction}

The methodology section should:
- Describe the research design and approach
- Explain the data collection methods
- Detail the sample or population studied
- Describe the analytical methods used
- Address ethical considerations if applicable
- Justify the chosen methods

Write in formal academic style with clear, precise language.`,

    results: `Write a comprehensive results section for an academic paper.

${baseContext}

${wordCountInstruction}

The results section should:
- Present the research findings clearly and objectively
- Include appropriate statistical analyses
- Use tables and figures descriptions where relevant
- Report data accurately without interpretation
- Organize results logically

Write in formal academic style with clear presentation of findings.`,

    discussion: `Write a comprehensive discussion section for an academic paper.

${baseContext}

${wordCountInstruction}

The discussion section should:
- Interpret the results in context of the research questions
- Compare findings with previous studies
- Explain the implications of the results
- Acknowledge limitations of the study
- Suggest directions for future research
- Connect back to the introduction and literature review

Write in formal academic style with thoughtful analysis.`,

    conclusion: `Write a strong conclusion section for an academic paper.

${baseContext}

${wordCountInstruction}

The conclusion should:
- Summarize the main findings of the study
- Restate the research questions and answers
- Highlight the theoretical and practical contributions
- Discuss the broader implications
- Provide final thoughts on the significance of the work

Write in formal academic style with a strong, memorable closing.`,

    references: `Generate a list of relevant academic references for this paper.

${baseContext}

${wordCountInstruction}

Generate approximately ${Math.ceil(wordCount / 50)} relevant academic references that:
- Are recent (preferably from the last 5-10 years)
- Cover the key topics in the paper
- Include seminal works in the field
- Use standard academic citation format (APA style)
- Include a mix of journal articles, books, and conference papers

Format each reference as:
Author(s). (Year). Title. Journal Name, Volume(Issue), pages. DOI if available.`
  };

  let prompt = sectionPrompts[section] || sectionPrompts.introduction;
  
  if (existingContent && existingContent.trim()) {
    prompt += `

EXISTING CONTENT TO IMPROVE/EXPAND:
${existingContent}

Please improve and expand upon the existing content while maintaining the core ideas and structure. Make it more comprehensive and detailed to meet the word count requirement.`;
  }

  return prompt;
}

// POST - Generate content for a specific section using Z.AI API (for new papers)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateContentRequest = await request.json();

    // Validate required fields
    if (!body.section || !body.title || !body.abstract || !body.keywords || !body.category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate the prompt
    const prompt = generatePrompt(
      body.section,
      body.title,
      body.abstract,
      body.keywords,
      body.category,
      body.wordCount,
      body.existingContent
    );

    // Prepare Z.AI API request
    const zaiRequest: ZAIRequest = {
      model: ZAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert academic writer and researcher. You write high-quality, well-structured academic content for research papers. Your writing is formal, precise, and follows academic conventions. You provide proper citations and references where appropriate.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: Math.min(body.wordCount * 2, 8000) // Estimate tokens needed
    };

    // Call Z.AI API
    const response = await fetch(ZAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZAI_API_KEY}`
      },
      body: JSON.stringify(zaiRequest)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Z.AI API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate content from AI service' },
        { status: 500 }
      );
    }

    const zaiResponse: ZAIResponse = await response.json();

    if (zaiResponse.error) {
      console.error('Z.AI API returned error:', zaiResponse.error);
      return NextResponse.json(
        { error: zaiResponse.error.message || 'AI service error' },
        { status: 500 }
      );
    }

    const generatedContent = zaiResponse.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      section: body.section
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

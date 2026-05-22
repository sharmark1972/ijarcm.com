import { NextRequest, NextResponse } from 'next/server';

// AI detection patterns
const AI_PATTERNS = [
  /\b(in conclusion|to summarize|furthermore|moreover|additionally|consequently|therefore|thus|hence)\b/gi,
  /\b(it is important to note that|it is worth mentioning that|it should be noted that)\b/gi,
  /\b(significantly|substantially|considerably|remarkably|notably|particularly|especially)\b/gi,
  /\b(plays a crucial role|serves as|acts as|functions as|operates as)\b/gi,
  /\b(comprehensive|extensive|thorough|in-depth|detailed|elaborate)\b/gi,
  /\b(utilize|leverage|harness|capitalize on|facilitate|enable|empower)\b/gi,
  /\b(optimize|enhance|improve|boost|elevate|upgrade)\b/gi,
  /\b(innovative|cutting-edge|state-of-the-art|groundbreaking|revolutionary)\b/gi,
  /\b(seamless|streamlined|efficient|effective|productive)\b/gi,
  /\b(robust|scalable|flexible|adaptable|versatile)\b/gi,
];

// Generate AI transparency disclaimer
function generateTransparencyDisclaimer(aiScore: number, wordCount: number): string {
  const disclaimer: string[] = [];
  
  disclaimer.push('This content was created with the assistance of AI writing tools.');
  
  if (aiScore > 50) {
    disclaimer.push('AI assistance was used for content generation and refinement.');
  } else if (aiScore > 25) {
    disclaimer.push('AI assistance was used for grammar checking and style suggestions.');
  } else {
    disclaimer.push('AI assistance was used for basic proofreading.');
  }
  
  disclaimer.push(`Total word count: ${wordCount}`);
  disclaimer.push(`Estimated AI contribution: ${Math.round(aiScore)}%`);
  
  return disclaimer.join(' ');
}

// Calculate AI likelihood score
function calculateAILikelihood(text: string): number {
  let score = 0;
  AI_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      score += (matches.length * 10);
    }
  });
  
  // Check for sentence uniformity (AI tends to have uniform sentence lengths)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 5) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
    
    // Low variance suggests AI-generated content
    if (variance < 25) {
      score += 15;
    } else if (variance < 50) {
      score += 10;
    } else if (variance < 75) {
      score += 5;
    }
  }
  
  // Check for vocabulary diversity
  const words = text.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversityRatio = uniqueWords.size / words.length;
  
  // High diversity suggests human writing
  if (diversityRatio < 0.3) {
    score += 20;
  } else if (diversityRatio < 0.4) {
    score += 15;
  } else if (diversityRatio < 0.5) {
    score += 10;
  }
  
  // Check for perfect grammar (suspiciously perfect)
  const commonErrors = [
    /\b(their|there|they're)\s+(are|is|was|were)\b/gi,
    /\b(your|you're)\s+(welcome|turn|fault)\b/gi,
    /\b(effect|affect)\s+(the|a|an)\b/gi,
    /\b(loose)\s+(the|a|an)\b/gi,
  ];
  
  let errorCount = 0;
  commonErrors.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      errorCount += matches.length;
    }
  });
  
  // No common errors might indicate AI
  if (errorCount === 0 && words.length > 100) {
    score += 10;
  }
  
  // Normalize score
  return Math.min(Math.round(score), 100);
}

// Generate content suggestions
function generateContentSuggestions(text: string, aiScore: number): Array<{
  type: 'transparency' | 'improvement' | 'warning';
  message: string;
}> {
  const suggestions: Array<{type: 'transparency' | 'improvement' | 'warning', message: string}> = [];
  
  // AI transparency suggestions
  if (aiScore > 50) {
    suggestions.push({
      type: 'transparency',
      message: 'Consider disclosing AI assistance to maintain transparency with your audience.',
    });
    suggestions.push({
      type: 'transparency',
      message: 'Add a note about AI contribution to your content.',
    });
  } else if (aiScore > 25) {
    suggestions.push({
      type: 'transparency',
      message: 'You may want to mention AI assistance for minor edits.',
    });
  }
  
  // Content improvement suggestions
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const avgLength = sentences.length > 0
    ? (sentences as string[]).reduce((sum: number, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0;
  
  if (avgLength > 25) {
    suggestions.push({
      type: 'improvement',
      message: 'Consider breaking long sentences for better readability.',
    });
  }
  
  if (avgLength < 10 && sentences.length > 0) {
    suggestions.push({
      type: 'improvement',
      message: 'Consider combining short sentences for better flow.',
    });
  }
  
  // Check for personal voice
  const firstPerson = text.match(/\b(I|my|we|our)\b/gi);
  if (!firstPerson || firstPerson.length < 2) {
    suggestions.push({
      type: 'improvement',
      message: 'Adding personal perspective can make content more engaging.',
    });
  }
  
  // Warning about over-reliance on AI
  if (aiScore > 70) {
    suggestions.push({
      type: 'warning',
      message: 'High AI content detected. Consider adding more personal insights and examples.',
    });
  }
  
  return suggestions;
}

// Generate transparency badge HTML
function generateTransparencyBadge(aiScore: number): string {
  let color = 'green';
  let label = 'Low AI Content';
  
  if (aiScore > 30) {
    color = 'blue';
    label = 'Moderate AI Content';
  }
  if (aiScore > 60) {
    color = 'yellow';
    label = 'Significant AI Content';
  }
  if (aiScore > 80) {
    color = 'orange';
    label = 'High AI Content';
  }
  
  return `<span style="background-color: ${color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${label}</span>`;
}

// Generate attribution text
function generateAttributionText(aiScore: number, wordCount: number): string {
  const date = new Date().toLocaleDateString();
  
  if (aiScore < 25) {
    return `Content created with minimal AI assistance (${Math.round(aiScore)}% AI contribution). Last updated: ${date}.`;
  } else if (aiScore < 50) {
    return `Content created with moderate AI assistance (${Math.round(aiScore)}% AI contribution). Last updated: ${date}.`;
  } else if (aiScore < 75) {
    return `Content created with significant AI assistance (${Math.round(aiScore)}% AI contribution). Last updated: ${date}.`;
  } else {
    return `Content primarily generated with AI assistance (${Math.round(aiScore)}% AI contribution). Last updated: ${date}.`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, includeBadge = true, includeDisclaimer = true } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide text to analyze.' },
        { status: 400 }
      );
    }
    
    if (text.length < 50) {
      return NextResponse.json(
        { error: 'Text too short. Minimum 50 characters required.' },
        { status: 400 }
      );
    }
    
    if (text.length > 50000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      );
    }
    
    // Calculate AI likelihood
    const aiScore = calculateAILikelihood(text);
    const wordCount = text.split(/\s+/).filter(w => w.trim().length > 0).length;
    
    // Generate transparency elements
    const disclaimer = includeDisclaimer ? generateTransparencyDisclaimer(aiScore, wordCount) : null;
    const badge = includeBadge ? generateTransparencyBadge(aiScore) : null;
    const attribution = generateAttributionText(aiScore, wordCount);
    const suggestions = generateContentSuggestions(text, aiScore);
    
    // Determine transparency level
    let transparencyLevel: 'low' | 'moderate' | 'high' | 'very-high';
    if (aiScore < 25) transparencyLevel = 'low';
    else if (aiScore < 50) transparencyLevel = 'moderate';
    else if (aiScore < 75) transparencyLevel = 'high';
    else transparencyLevel = 'very-high';
    
    return NextResponse.json({
      aiScore,
      transparencyLevel,
      wordCount,
      characterCount: text.length,
      transparencyElements: {
        disclaimer,
        badge,
        attribution,
      },
      suggestions,
      guidelines: {
        disclose: 'Always disclose AI assistance to maintain trust with your audience.',
        verify: 'Verify AI-generated content for accuracy and factual correctness.',
        personalize: 'Add personal insights, examples, and experiences to AI-generated content.',
        cite: 'If using AI for research, cite your sources appropriately.',
        review: 'Review and edit AI-generated content to match your voice and style.',
      },
    });
  } catch (error) {
    console.error('AI content editor error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content. Please try again.' },
      { status: 500 }
    );
  }
}

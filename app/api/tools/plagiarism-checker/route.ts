import { NextRequest, NextResponse } from 'next/server';

// Common phrases and patterns that might indicate potential plagiarism
const COMMON_PHRASES = [
  'in conclusion',
  'to summarize',
  'in summary',
  'it is important to note that',
  'it is worth mentioning that',
  'it should be noted that',
  'it must be emphasized that',
  'in today\'s world',
  'in modern society',
  'in the contemporary era',
  'in the current landscape',
  'plays a crucial role',
  'serves as',
  'acts as',
  'functions as',
  'comprehensive',
  'extensive',
  'thorough',
  'in-depth',
  'utilize',
  'leverage',
  'harness',
  'capitalize on',
  'facilitate',
  'enable',
  'empower',
  'optimize',
  'enhance',
  'improve',
  'innovative',
  'cutting-edge',
  'state-of-the-art',
  'groundbreaking',
  'revolutionary',
  'seamless',
  'streamlined',
  'efficient',
  'effective',
  'robust',
  'scalable',
  'flexible',
  'adaptable',
  'versatile',
  'implement',
  'deploy',
  'integrate',
  'incorporate',
  'demonstrate',
  'showcase',
  'highlight',
  'emphasize',
  'align with',
  'in accordance with',
  'consistent with',
  'in line with',
  'regarding',
  'concerning',
  'with respect to',
  'in relation to',
  'primarily',
  'mainly',
  'chiefly',
  'predominantly',
  'largely',
  'essential',
  'fundamental',
  'critical',
  'vital',
  'paramount',
  'as well as',
  'along with',
  'in addition to',
  'coupled with',
];

// Check for repeated word sequences (n-grams)
function checkNGrams(text: string, n: number = 3): Array<{phrase: string, count: number, position: number}> {
  const words = text.toLowerCase().split(/\s+/);
  const ngrams: Record<string, {count: number, positions: number[]}> = {};
  
  for (let i = 0; i <= words.length - n; i++) {
    const ngram = words.slice(i, i + n).join(' ');
    if (ngram.length < 10) continue; // Skip very short n-grams
    
    if (!ngrams[ngram]) {
      ngrams[ngram] = { count: 0, positions: [] };
    }
    ngrams[ngram].count++;
    ngrams[ngram].positions.push(i);
  }
  
  // Find repeated n-grams
  const results: Array<{phrase: string, count: number, position: number}> = [];
  for (const [phrase, data] of Object.entries(ngrams)) {
    if (data.count > 1) {
      results.push({
        phrase,
        count: data.count,
        position: data.positions[0],
      });
    }
  }
  
  return results.sort((a, b) => b.count - a.count);
}

// Check for common academic phrases
function checkCommonPhrases(text: string): Array<{phrase: string, position: number, type: 'warning' | 'info'}> {
  const results: Array<{phrase: string, position: number, type: 'warning' | 'info'}> = [];
  
  COMMON_PHRASES.forEach(phrase => {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        phrase: match[0],
        position: match.index,
        type: 'warning',
      });
    }
  });
  
  return results;
}

// Check for sentence similarity
function checkSentenceSimilarity(text: string): Array<{sentence: string, similarity: number, position: number}> {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const results: Array<{sentence: string, similarity: number, position: number}> = [];
  
  for (let i = 0; i < sentences.length; i++) {
    for (let j = i + 1; j < sentences.length; j++) {
      const similarity = calculateSimilarity(sentences[i], sentences[j]);
      if (similarity > 0.7) {
        results.push({
          sentence: sentences[i].trim().substring(0, 50),
          similarity: Math.round(similarity * 100),
          position: text.indexOf(sentences[i]),
        });
        break;
      }
    }
  }
  
  return results;
}

// Calculate similarity between two strings (simplified Jaccard similarity)
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// Check for potential AI-generated content patterns
function checkAIPatterns(text: string): Array<{pattern: string, position: number, type: 'warning'}> {
  const results: Array<{pattern: string, position: number, type: 'warning'}> = [];
  
  const aiPatterns = [
    { pattern: /\b(demonstrated|illustrated|shown|revealed|indicated)\s+that\b/gi, label: 'Academic transition phrase' },
    { pattern: /\b(significantly|substantially|considerably|remarkably|notably)\b/gi, label: 'Intensifier' },
    { pattern: /\b(comprehensive|extensive|thorough|in-depth)\s+(analysis|study|research|examination)\b/gi, label: 'Formal academic phrase' },
    { pattern: /\b(plays a crucial role|serves as|functions as|acts as)\b/gi, label: 'Common academic expression' },
    { pattern: /\b(in order to|in order for|in an effort to)\b/gi, label: 'Wordy phrase' },
    { pattern: /\b(with regard to|with respect to|in relation to)\b/gi, label: 'Formal phrase' },
    { pattern: /\b(the purpose of this study|the aim of this research|this study aims to)\b/gi, label: 'Academic introduction' },
    { pattern: /\b(results indicate that|findings suggest that|data shows that)\b/gi, label: 'Academic reporting phrase' },
  ];
  
  aiPatterns.forEach(({ pattern, label }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      results.push({
        pattern: label,
        position: match.index,
        type: 'warning',
      });
    }
  });
  
  return results;
}

// Calculate overall plagiarism risk score
function calculatePlagiarismScore(
  ngramMatches: Array<{phrase: string, count: number}>,
  commonPhrases: Array<{phrase: string}>,
  similarSentences: Array<{similarity: number}>,
  aiPatterns: Array<{pattern: string}>
): number {
  let score = 0;
  
  // Score based on repeated n-grams
  const totalRepeatedNGrams = ngramMatches.reduce((sum, m) => sum + m.count - 1, 0);
  score += Math.min(totalRepeatedNGrams * 3, 30);
  
  // Score based on common phrases
  score += Math.min(commonPhrases.length * 2, 20);
  
  // Score based on similar sentences
  const avgSimilarity = similarSentences.length > 0
    ? similarSentences.reduce((sum, s) => sum + s.similarity, 0) / similarSentences.length
    : 0;
  score += Math.min(avgSimilarity * 0.3, 25);
  
  // Score based on AI patterns
  score += Math.min(aiPatterns.length * 2, 15);
  
  return Math.min(Math.round(score), 100);
}

// Get risk level
function getRiskLevel(score: number): {level: string, color: string, description: string} {
  if (score < 20) {
    return {
      level: 'Low Risk',
      color: 'green',
      description: 'Your text appears to be original with minimal similarity to common patterns.',
    };
  } else if (score < 40) {
    return {
      level: 'Moderate Risk',
      color: 'yellow',
      description: 'Some common phrases or patterns detected. Consider reviewing for originality.',
    };
  } else if (score < 60) {
    return {
      level: 'Medium Risk',
      color: 'orange',
      description: 'Significant similarity to common patterns detected. Review recommended.',
    };
  } else {
    return {
      level: 'High Risk',
      color: 'red',
      description: 'High similarity to common patterns detected. Thorough review required.',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide text to check.' },
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
    
    // Run all checks
    const ngramMatches = checkNGrams(text, 4);
    const commonPhrases = checkCommonPhrases(text);
    const similarSentences = checkSentenceSimilarity(text);
    const aiPatterns = checkAIPatterns(text);
    
    // Calculate overall score
    const plagiarismScore = calculatePlagiarismScore(
      ngramMatches,
      commonPhrases,
      similarSentences,
      aiPatterns
    );
    
    const riskAssessment = getRiskLevel(plagiarismScore);
    
    return NextResponse.json({
      score: plagiarismScore,
      risk: riskAssessment,
      details: {
        repeatedPhrases: ngramMatches.slice(0, 10).map(m => ({
          phrase: m.phrase,
          count: m.count,
          position: m.position,
        })),
        commonPhrases: commonPhrases.slice(0, 10).map(p => ({
          phrase: p.phrase,
          position: p.position,
        })),
        similarSentences: similarSentences.slice(0, 5).map(s => ({
          sentence: s.sentence,
          similarity: s.similarity,
          position: s.position,
        })),
        aiPatterns: aiPatterns.slice(0, 10).map(p => ({
          pattern: p.pattern,
          position: p.position,
        })),
      },
      summary: {
        totalRepeatedPhrases: ngramMatches.length,
        totalCommonPhrases: commonPhrases.length,
        totalSimilarSentences: similarSentences.length,
        totalAIPatterns: aiPatterns.length,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
      },
    });
  } catch (error) {
    console.error('Plagiarism checker error:', error);
    return NextResponse.json(
      { error: 'Failed to check plagiarism. Please try again.' },
      { status: 500 }
    );
  }
}

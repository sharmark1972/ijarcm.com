import { NextRequest, NextResponse } from 'next/server';

// Common grammar and style issues
const GRAMMAR_RULES = [
  {
    pattern: /\b(a|an)\s+([aeiou][a-z]+)\b/gi,
    message: 'Article usage',
    suggestion: (match: string) => {
      const [, , word] = match.split(' ');
      return `an ${word}`;
    },
    type: 'error' as const,
  },
  {
    pattern: /\b(a|an)\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi,
    message: 'Article usage',
    suggestion: (match: string) => {
      const [, , word] = match.split(' ');
      return `a ${word}`;
    },
    type: 'error' as const,
  },
  {
    pattern: /\b(its|it's)\s+(own|way|time|life|name|place)\b/gi,
    message: 'Possessive vs contraction',
    suggestion: (match: string) => match.replace(/it's/gi, 'its'),
    type: 'error' as const,
  },
  {
    pattern: /\b(there|their|they're)\s+(are|is|was|were)\b/gi,
    message: 'Homophone confusion',
    suggestion: (match: string) => {
      if (match.match(/there\s+(are|is|was|were)/i)) return match;
      if (match.match(/their\s+(are|is|was|were)/i)) return match.replace(/their/gi, "there");
      if (match.match(/they're\s+(are|is|was|were)/i)) return match.replace(/they're/gi, "there");
      return match;
    },
    type: 'error' as const,
  },
  {
    pattern: /\b(your|you're)\s+(welcome|turn|fault|problem|solution)\b/gi,
    message: 'Possessive vs contraction',
    suggestion: (match: string) => match.replace(/you're/gi, 'your'),
    type: 'error' as const,
  },
  {
    pattern: /\b(effect|affect)\s+(the|a|an|this|that|these|those)\b/gi,
    message: 'Effect vs Affect',
    suggestion: (match: string) => match.replace(/affect\s+(the|a|an|this|that|these|those)/gi, 'effect $1'),
    type: 'warning' as const,
  },
  {
    pattern: /\b(who|whom)\s+(did|does|do|has|have|had)\b/gi,
    message: 'Who vs Whom',
    suggestion: (match: string) => match.replace(/whom\s+(did|does|do|has|have|had)/gi, 'who $1'),
    type: 'warning' as const,
  },
  {
    pattern: /\b(complement|compliment)\s+(the|a|an|this|that|these|those|each|every)\b/gi,
    message: 'Complement vs Compliment',
    suggestion: (match: string) => match.replace(/compliment\s+(the|a|an|this|that|these|those|each|every)/gi, 'complement $1'),
    type: 'warning' as const,
  },
  {
    pattern: /\b(accept|except)\s+(the|a|an|this|that|these|those|for|to)\b/gi,
    message: 'Accept vs Except',
    suggestion: (match: string) => match.replace(/except\s+(the|a|an|this|that|these|those|for|to)/gi, 'accept $1'),
    type: 'warning' as const,
  },
  {
    pattern: /\b(alot|alot)\b/gi,
    message: 'Spelling',
    suggestion: 'a lot',
    type: 'error' as const,
  },
  {
    pattern: /\b(definately|definately)\b/gi,
    message: 'Spelling',
    suggestion: 'definitely',
    type: 'error' as const,
  },
  {
    pattern: /\b(occured|occured)\b/gi,
    message: 'Spelling',
    suggestion: 'occurred',
    type: 'error' as const,
  },
  {
    pattern: /\b(seperate)\b/gi,
    message: 'Spelling',
    suggestion: 'separate',
    type: 'error' as const,
  },
  {
    pattern: /\b(recieve)\b/gi,
    message: 'Spelling',
    suggestion: 'receive',
    type: 'error' as const,
  },
  {
    pattern: /\b(privelege)\b/gi,
    message: 'Spelling',
    suggestion: 'privilege',
    type: 'error' as const,
  },
  {
    pattern: /\b(untill)\b/gi,
    message: 'Spelling',
    suggestion: 'until',
    type: 'error' as const,
  },
  {
    pattern: /\b(loose)\s+(the|a|an|this|that|these|those|your|my|his|her|their|our)\b/gi,
    message: 'Loose vs Lose',
    suggestion: (match: string) => match.replace(/loose\s+(the|a|an|this|that|these|those|your|my|his|her|their|our)/gi, 'lose $1'),
    type: 'error' as const,
  },
  {
    pattern: /\b(then)\s+(I|you|he|she|it|we|they)\s+(will|would|can|could|should|must|may|might)\b/gi,
    message: 'Then vs Than',
    suggestion: (match: string) => match.replace(/then/gi, 'than'),
    type: 'error' as const,
  },
  {
    pattern: /\b(very|really|extremely|absolutely)\s+(very|really|extremely|absolutely)\b/gi,
    message: 'Redundant intensifier',
    suggestion: (match: string) => match.split(' ').slice(0, 2).join(' '),
    type: 'style' as const,
  },
  {
    pattern: /\b(basically|essentially|fundamentally)\s+(basically|essentially|fundamentally)\b/gi,
    message: 'Redundant qualifier',
    suggestion: (match: string) => match.split(' ').slice(0, 2).join(' '),
    type: 'style' as const,
  },
  {
    pattern: /\b(at this point in time)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'now',
    type: 'style' as const,
  },
  {
    pattern: /\b(in order to)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'to',
    type: 'style' as const,
  },
  {
    pattern: /\b(due to the fact that)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'because',
    type: 'style' as const,
  },
  {
    pattern: /\b(in the event that)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'if',
    type: 'style' as const,
  },
  {
    pattern: /\b(for the purpose of)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'for',
    type: 'style' as const,
  },
  {
    pattern: /\b(with regard to)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'about',
    type: 'style' as const,
  },
  {
    pattern: /\b(in the nature of)\b/gi,
    message: 'Wordy phrase',
    suggestion: 'like',
    type: 'style' as const,
  },
  {
    pattern: /\b(past history)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'history',
    type: 'style' as const,
  },
  {
    pattern: /\b(future plans)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'plans',
    type: 'style' as const,
  },
  {
    pattern: /\b(true facts)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'facts',
    type: 'style' as const,
  },
  {
    pattern: /\b(final outcome)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'outcome',
    type: 'style' as const,
  },
  {
    pattern: /\b(completely finished)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'finished',
    type: 'style' as const,
  },
  {
    pattern: /\b(absolutely essential)\b/gi,
    message: 'Redundant phrase',
    suggestion: 'essential',
    type: 'style' as const,
  },
];

// Passive voice detection
const PASSIVE_VOICE_PATTERNS = [
  /\b(is|are|was|were|be|been|being)\s+(\w+ed)\b/gi,
  /\b(is|are|was|were|be|been|being)\s+(written|spoken|said|done|made|taken|given|seen|heard|found|kept|left|put|set|shown|told|thought|brought|cut|drawn|driven|eaten|felt|forgotten|got|held|hit|hurt|known|laid|led|let|lost|meant|met|paid|read|run|sold|sent|shut|slept|stood|stuck|taught|thrown|understood|won)\b/gi,
];

// Check for sentence length issues
function checkSentenceLength(text: string): Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> {
  const issues: Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  sentences.forEach((sentence) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    const position = text.indexOf(sentence);
    
    if (wordCount > 40) {
      issues.push({
        message: 'Very long sentence',
        suggestion: 'Consider breaking this into shorter sentences for better readability',
        type: 'style',
        position,
        original: sentence.trim().substring(0, 30),
      });
    } else if (wordCount > 30) {
      issues.push({
        message: 'Long sentence',
        suggestion: 'This sentence is quite long. Consider splitting it.',
        type: 'warning',
        position,
        original: sentence.trim().substring(0, 30),
      });
    } else if (wordCount < 5 && wordCount > 0) {
      issues.push({
        message: 'Very short sentence',
        suggestion: 'Consider combining with adjacent sentences for better flow',
        type: 'style',
        position,
        original: sentence.trim().substring(0, 30),
      });
    }
  });
  
  return issues;
}

// Check for passive voice
function checkPassiveVoice(text: string): Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> {
  const issues: Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> = [];
  
  PASSIVE_VOICE_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      issues.push({
        message: 'Possible passive voice',
        suggestion: 'Consider using active voice for stronger, clearer writing',
        type: 'style',
        position: match.index,
        original: match[0],
      });
    }
  });
  
  return issues;
}

// Check for repeated words
function checkRepeatedWords(text: string): Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> {
  const issues: Array<{message: string, suggestion: string, type: 'error' | 'warning' | 'style', position: number, original: string}> = [];
  const words = text.split(/\s+/);
  
  for (let i = 1; i < words.length; i++) {
    if (words[i].toLowerCase() === words[i-1].toLowerCase() && words[i].length > 2) {
      const position = text.indexOf(words[i-1] + ' ' + words[i]);
      issues.push({
        message: 'Repeated word',
        suggestion: `Remove the duplicate "${words[i]}"`,
        type: 'error',
        position,
        original: `${words[i-1]} ${words[i]}`,
      });
    }
  }
  
  return issues;
}

// Calculate readability score (Flesch Reading Ease)
function calculateReadabilityScore(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Count syllables in a word
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  
  return matches ? matches.length : 1;
}

// Get readability level
function getReadabilityLevel(score: number): string {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (Graduate)';
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
    
    if (text.length > 50000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      );
    }
    
    const issues: Array<{
      message: string;
      suggestion: string;
      type: 'error' | 'warning' | 'style';
      position: number;
      original: string;
    }> = [];
    
    // Check grammar rules
    GRAMMAR_RULES.forEach(rule => {
      let match;
      const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        const suggestion = typeof rule.suggestion === 'function' 
          ? rule.suggestion(match[0]) 
          : rule.suggestion;
        
        issues.push({
          message: rule.message,
          suggestion,
          type: rule.type,
          position: match.index,
          original: match[0],
        });
      }
    });
    
    // Check sentence length
    const lengthIssues = checkSentenceLength(text);
    issues.push(...lengthIssues);
    
    // Check passive voice
    const passiveIssues = checkPassiveVoice(text);
    issues.push(...passiveIssues);
    
    // Check repeated words
    const repeatedIssues = checkRepeatedWords(text);
    issues.push(...repeatedIssues);
    
    // Calculate readability score
    const readabilityScore = calculateReadabilityScore(text);
    const readabilityLevel = getReadabilityLevel(readabilityScore);
    
    // Count issues by type
    const errorCount = issues.filter(i => i.type === 'error').length;
    const warningCount = issues.filter(i => i.type === 'warning').length;
    const styleCount = issues.filter(i => i.type === 'style').length;
    
    return NextResponse.json({
      issues: issues.sort((a, b) => a.position - b.position),
      summary: {
        total: issues.length,
        errors: errorCount,
        warnings: warningCount,
        style: styleCount,
      },
      readability: {
        score: readabilityScore,
        level: readabilityLevel,
      },
    });
  } catch (error) {
    console.error('Grammar checker error:', error);
    return NextResponse.json(
      { error: 'Failed to check grammar. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Count syllables in a word
function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  
  return matches ? matches.length : 1;
}

// Calculate Flesch Reading Ease Score
function calculateFleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Calculate Flesch-Kincaid Grade Level
function calculateFleschKincaidGrade(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => count + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  const grade = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}

// Calculate Gunning Fog Index
function calculateGunningFogIndex(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  
  // Count complex words (3+ syllables)
  const complexWords = words.filter(word => countSyllables(word) >= 3);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgSentenceLength = words.length / sentences.length;
  const percentComplexWords = (complexWords.length / words.length) * 100;
  
  const fogIndex = 0.4 * (avgSentenceLength + percentComplexWords);
  return Math.max(0, Math.round(fogIndex * 10) / 10);
}

// Calculate Coleman-Liau Index
function calculateColemanLiauIndex(text: string): number {
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const characters = text.replace(/\s/g, '').length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (words.length === 0 || sentences.length === 0) return 0;
  
  const avgCharactersPer100Words = (characters / words.length) * 100;
  const avgSentencesPer100Words = (sentences.length / words.length) * 100;
  
  const index = (0.0588 * avgCharactersPer100Words) - (0.296 * avgSentencesPer100Words) - 15.8;
  return Math.max(0, Math.round(index * 10) / 10);
}

// Calculate Automated Readability Index (ARI)
function calculateARI(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const characters = words.join('').length;
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgCharactersPerWord = characters / words.length;
  const avgWordsPerSentence = words.length / sentences.length;
  
  const ari = (4.71 * avgCharactersPerWord) + (0.5 * avgWordsPerSentence) - 21.43;
  return Math.max(0, Math.round(ari * 10) / 10);
}

// Calculate SMOG Index
function calculateSMOGIndex(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  
  // Count polysyllabic words (3+ syllables)
  const polysyllabicWords = words.filter(word => countSyllables(word) >= 3);
  
  if (sentences.length === 0) return 0;
  
  const smog = 1.043 * Math.sqrt(polysyllabicWords.length * (30 / sentences.length)) + 3.1291;
  return Math.max(0, Math.round(smog * 10) / 10);
}

// Get reading level description
function getReadingLevel(score: number, metric: string): {level: string, description: string, color: string} {
  switch (metric) {
    case 'flesch':
      if (score >= 90) return { level: 'Very Easy', description: '5th grade', color: 'green' };
      if (score >= 80) return { level: 'Easy', description: '6th grade', color: 'green' };
      if (score >= 70) return { level: 'Fairly Easy', description: '7th grade', color: 'blue' };
      if (score >= 60) return { level: 'Standard', description: '8th-9th grade', color: 'blue' };
      if (score >= 50) return { level: 'Fairly Difficult', description: '10th-12th grade', color: 'yellow' };
      if (score >= 30) return { level: 'Difficult', description: 'College', color: 'orange' };
      return { level: 'Very Difficult', description: 'Graduate', color: 'red' };
      
    case 'grade':
      if (score <= 6) return { level: 'Elementary', description: 'Easy to read', color: 'green' };
      if (score <= 8) return { level: 'Middle School', description: 'Generally accessible', color: 'blue' };
      if (score <= 10) return { level: 'High School', description: 'Moderate difficulty', color: 'yellow' };
      if (score <= 12) return { level: 'College', description: 'Some complexity', color: 'orange' };
      return { level: 'Graduate', description: 'Academic level', color: 'red' };
      
    default:
      if (score <= 8) return { level: 'Easy', description: 'Accessible to most readers', color: 'green' };
      if (score <= 12) return { level: 'Moderate', description: 'Some complexity', color: 'yellow' };
      return { level: 'Difficult', description: 'Academic or specialized content', color: 'orange' };
  }
}

// Analyze sentence structure
function analyzeSentenceStructure(text: string): {
  avgLength: number;
  min: number;
  max: number;
  distribution: {short: number, medium: number, long: number, veryLong: number};
} {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) {
    return { avgLength: 0, min: 0, max: 0, distribution: {short: 0, medium: 0, long: 0, veryLong: 0} };
  }
  
  const lengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  
  const distribution = {
    short: lengths.filter(l => l < 10).length,
    medium: lengths.filter(l => l >= 10 && l < 20).length,
    long: lengths.filter(l => l >= 20 && l < 30).length,
    veryLong: lengths.filter(l => l >= 30).length,
  };
  
  return { avgLength: Math.round(avgLength * 10) / 10, min, max, distribution };
}

// Analyze word complexity
function analyzeWordComplexity(text: string): {
  avgSyllables: number;
  simpleWords: number;
  moderateWords: number;
  complexWords: number;
  veryComplexWords: number;
} {
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  if (words.length === 0) {
    return {
      avgSyllables: 0,
      simpleWords: 0,
      moderateWords: 0,
      complexWords: 0,
      veryComplexWords: 0,
    };
  }
  
  const syllableCounts = words.map(word => countSyllables(word));
  const avgSyllables = syllableCounts.reduce((a, b) => a + b, 0) / words.length;
  
  return {
    avgSyllables: Math.round(avgSyllables * 10) / 10,
    simpleWords: syllableCounts.filter(s => s <= 2).length,
    moderateWords: syllableCounts.filter(s => s === 3).length,
    complexWords: syllableCounts.filter(s => s >= 4 && s <= 5).length,
    veryComplexWords: syllableCounts.filter(s => s >= 6).length,
  };
}

// Get readability suggestions
function getReadabilitySuggestions(scores: {
  flesch: number;
  grade: number;
  fog: number;
}): Array<{type: 'improvement' | 'warning' | 'info', message: string}> {
  const suggestions: Array<{type: 'improvement' | 'warning' | 'info', message: string}> = [];
  
  if (scores.flesch < 50) {
    suggestions.push({
      type: 'improvement',
      message: 'Consider simplifying your text to improve readability. Use shorter sentences and simpler words.',
    });
  }
  
  if (scores.grade > 12) {
    suggestions.push({
      type: 'warning',
      message: 'Your text requires college-level reading. Consider explaining complex concepts more simply.',
    });
  }
  
  if (scores.fog > 12) {
    suggestions.push({
      type: 'improvement',
      message: 'The Gunning Fog Index indicates complex writing. Try reducing the number of complex words.',
    });
  }
  
  if (scores.flesch > 90) {
    suggestions.push({
      type: 'info',
      message: 'Your text is very easy to read. This is good for general audiences but may lack depth for academic readers.',
    });
  }
  
  return suggestions;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
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
    
    // Calculate all readability scores
    const fleschScore = calculateFleschReadingEase(text);
    const fleschKincaidGrade = calculateFleschKincaidGrade(text);
    const gunningFogIndex = calculateGunningFogIndex(text);
    const colemanLiauIndex = calculateColemanLiauIndex(text);
    const ariScore = calculateARI(text);
    const smogIndex = calculateSMOGIndex(text);
    
    // Analyze structure
    const sentenceAnalysis = analyzeSentenceStructure(text);
    const wordComplexity = analyzeWordComplexity(text);
    
    // Get reading levels
    const fleschLevel = getReadingLevel(fleschScore, 'flesch');
    
    // Get suggestions
    const suggestions = getReadabilitySuggestions({
      flesch: fleschScore,
      grade: fleschKincaidGrade,
      fog: gunningFogIndex,
    });
    
    // Calculate overall readability
    const avgGradeLevel = (fleschKincaidGrade + gunningFogIndex + colemanLiauIndex + ariScore + smogIndex) / 5;
    const overallLevel = getReadingLevel(avgGradeLevel, 'grade');
    
    return NextResponse.json({
      overall: {
        score: fleschScore,
        level: overallLevel,
        averageGrade: Math.round(avgGradeLevel * 10) / 10,
      },
      metrics: {
        fleschReadingEase: {
          score: fleschScore,
          level: fleschLevel,
        },
        fleschKincaidGrade: {
          score: fleschKincaidGrade,
          level: getReadingLevel(fleschKincaidGrade, 'grade'),
        },
        gunningFogIndex: {
          score: gunningFogIndex,
          level: getReadingLevel(gunningFogIndex, 'grade'),
        },
        colemanLiauIndex: {
          score: colemanLiauIndex,
          level: getReadingLevel(colemanLiauIndex, 'grade'),
        },
        automatedReadabilityIndex: {
          score: ariScore,
          level: getReadingLevel(ariScore, 'grade'),
        },
        smogIndex: {
          score: smogIndex,
          level: getReadingLevel(smogIndex, 'grade'),
        },
      },
      analysis: {
        sentences: sentenceAnalysis,
        words: wordComplexity,
      },
      statistics: {
        characterCount: text.length,
        wordCount: text.split(/\s+/).filter(w => w.trim().length > 0).length,
        sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        paragraphCount: text.split(/\n\n+/).filter(p => p.trim().length > 0).length,
      },
      suggestions,
    });
  } catch (error) {
    console.error('Readability analyzer error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze readability. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

// Suggestion categories
type SuggestionCategory = 'clarity' | 'conciseness' | 'tone' | 'vocabulary' | 'structure' | 'engagement';

interface WritingSuggestion {
  category: SuggestionCategory;
  type: 'improvement' | 'warning' | 'suggestion';
  message: string;
  position: number;
  original: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high';
}

// Common weak words to replace
const WEAK_WORDS: Record<string, string[]> = {
  'very': ['extremely', 'highly', 'remarkably', 'exceptionally'],
  'really': ['genuinely', 'truly', 'certainly', 'undoubtedly'],
  'things': ['items', 'elements', 'aspects', 'factors', 'components'],
  'stuff': ['materials', 'items', 'elements', 'content', 'substances'],
  'good': ['excellent', 'outstanding', 'superior', 'exceptional', 'remarkable'],
  'bad': ['poor', 'inadequate', 'substandard', 'deficient', 'unsatisfactory'],
  'big': ['substantial', 'significant', 'considerable', 'extensive', 'considerable'],
  'small': ['minor', 'limited', 'modest', 'insignificant', 'minimal'],
  'nice': ['pleasant', 'delightful', 'agreeable', 'enjoyable', 'satisfactory'],
  'important': ['crucial', 'vital', 'essential', 'significant', 'critical'],
  'a lot': ['considerably', 'substantially', 'significantly', 'extensively'],
  'kind of': ['somewhat', 'rather', 'relatively', 'moderately'],
  'sort of': ['somewhat', 'rather', 'relatively', 'moderately'],
  'basically': ['fundamentally', 'essentially', 'primarily', 'chiefly'],
  'actually': ['in fact', 'indeed', 'certainly', 'truly'],
  'just': ['simply', 'merely', 'solely', 'only'],
};

// Wordy phrases to simplify
const WORDY_PHRASES: Record<string, string> = {
  'in order to': 'to',
  'due to the fact that': 'because',
  'in the event that': 'if',
  'for the purpose of': 'for',
  'at this point in time': 'now',
  'in the near future': 'soon',
  'a large number of': 'many',
  'a significant number of': 'many',
  'a considerable number of': 'many',
  'in a timely manner': 'promptly',
  'on a weekly basis': 'weekly',
  'on a daily basis': 'daily',
  'on a monthly basis': 'monthly',
  'with regard to': 'about',
  'in relation to': 'regarding',
  'in the case of': 'if',
  'for the reason that': 'because',
  'in spite of the fact that': 'although',
  'despite the fact that': 'although',
  'until such time as': 'until',
  'at the present time': 'now',
  'at this time': 'now',
  'in this day and age': 'today',
  'in the final analysis': 'ultimately',
  'for all intents and purposes': 'practically',
  'as a matter of fact': 'in fact',
  'by virtue of the fact that': 'because',
  'in light of the fact that': 'because',
  'taking into consideration': 'considering',
  'make an effort to': 'try',
  'give consideration to': 'consider',
  'take into consideration': 'consider',
  'come to a conclusion': 'conclude',
  'reach a conclusion': 'conclude',
  'put an end to': 'end',
  'bring to a conclusion': 'conclude',
  'have a tendency to': 'tend',
  'is able to': 'can',
  'is capable of': 'can',
  'has the ability to': 'can',
  'it is important to note that': 'note that',
  'it is worth mentioning that': 'notably',
  'it should be noted that': 'note',
};

// Passive voice indicators
const PASSIVE_INDICATORS = [
  'is done',
  'was done',
  'were done',
  'been done',
  'is made',
  'was made',
  'were made',
  'been made',
  'is written',
  'was written',
  'were written',
  'been written',
  'is said',
  'was said',
  'were said',
  'been said',
  'is found',
  'was found',
  'were found',
  'been found',
];

// Check for weak words
function checkWeakWords(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  
  for (const [weakWord, alternatives] of Object.entries(WEAK_WORDS)) {
    const regex = new RegExp(`\\b${weakWord}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      suggestions.push({
        category: 'vocabulary',
        type: 'improvement',
        message: `"${weakWord}" is a weak word. Consider using stronger alternatives.`,
        position: match.index,
        original: match[0],
        suggestion: alternatives[Math.floor(Math.random() * alternatives.length)],
        severity: 'medium',
      });
    }
  }
  
  return suggestions;
}

// Check for wordy phrases
function checkWordyPhrases(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  
  for (const [phrase, replacement] of Object.entries(WORDY_PHRASES)) {
    const regex = new RegExp(phrase, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      suggestions.push({
        category: 'conciseness',
        type: 'improvement',
        message: `"${phrase}" can be simplified to "${replacement}".`,
        position: match.index,
        original: match[0],
        suggestion: replacement,
        severity: 'low',
      });
    }
  }
  
  return suggestions;
}

// Check for passive voice
function checkPassiveVoice(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  
  PASSIVE_INDICATORS.forEach(indicator => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      suggestions.push({
        category: 'clarity',
        type: 'suggestion',
        message: 'Passive voice detected. Consider using active voice for stronger, clearer writing.',
        position: match.index,
        original: match[0],
        severity: 'medium',
      });
    }
  });
  
  return suggestions;
}

// Check for sentence length
function checkSentenceLength(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  sentences.forEach((sentence) => {
    const wordCount = sentence.trim().split(/\s+/).length;
    const position = text.indexOf(sentence);
    
    if (wordCount > 40) {
      suggestions.push({
        category: 'structure',
        type: 'warning',
        message: `This sentence is ${wordCount} words long. Consider breaking it into shorter sentences for better readability.`,
        position,
        original: sentence.trim().substring(0, 30) + '...',
        severity: 'high',
      });
    } else if (wordCount > 30) {
      suggestions.push({
        category: 'structure',
        type: 'suggestion',
        message: `This sentence is ${wordCount} words long. Consider splitting it for better flow.`,
        position,
        original: sentence.trim().substring(0, 30) + '...',
        severity: 'medium',
      });
    }
  });
  
  return suggestions;
}

// Check for repetitive sentence starts
function checkRepetitiveStarts(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  const startWords: Record<string, number[]> = {};
  sentences.forEach((sentence, index) => {
    const words = sentence.trim().split(/\s+/);
    if (words.length > 0) {
      const startWord = words[0].toLowerCase();
      if (!startWords[startWord]) {
        startWords[startWord] = [];
      }
      startWords[startWord].push(index);
    }
  });
  
  for (const [word, positions] of Object.entries(startWords)) {
    if (positions.length > 3) {
      positions.forEach(position => {
        const sentence = sentences[position];
        suggestions.push({
          category: 'engagement',
          type: 'suggestion',
          message: `"${word}" is used frequently to start sentences. Vary your sentence structure.`,
          position: text.indexOf(sentence),
          original: sentence.trim().substring(0, 20) + '...',
          severity: 'low',
        });
      });
    }
  }
  
  return suggestions;
}

// Check for filler words
function checkFillerWords(text: string): WritingSuggestion[] {
  const fillerWords = [
    'basically', 'actually', 'really', 'very', 'just', 'like', 'um', 'uh',
    'literally', 'totally', 'absolutely', 'definitely', 'honestly', 'honestly',
  ];
  
  const suggestions: WritingSuggestion[] = [];
  
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    let match;
    let count = 0;
    while ((match = regex.exec(text)) !== null) {
      count++;
      if (count <= 3) { // Limit suggestions for each word
        suggestions.push({
          category: 'conciseness',
          type: 'suggestion',
          message: `"${word}" is a filler word. Consider removing it for more concise writing.`,
          position: match.index,
          original: match[0],
          severity: 'low',
        });
      }
    }
  });
  
  return suggestions;
}

// Check for vague language
function checkVagueLanguage(text: string): WritingSuggestion[] {
  const vaguePhrases = [
    'a lot of people', 'many people', 'some people',
    'a lot of things', 'many things', 'some things',
    'a lot of ways', 'many ways', 'some ways',
    'kind of', 'sort of', 'type of',
    'a certain', 'some kind of', 'some sort of',
  ];
  
  const suggestions: WritingSuggestion[] = [];
  
  vaguePhrases.forEach(phrase => {
    const regex = new RegExp(phrase, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      suggestions.push({
        category: 'clarity',
        type: 'warning',
        message: `"${phrase}" is vague. Be more specific for clearer communication.`,
        position: match.index,
        original: match[0],
        severity: 'medium',
      });
    }
  });
  
  return suggestions;
}

// Check for tone issues
function checkTone(text: string): WritingSuggestion[] {
  const suggestions: WritingSuggestion[] = [];
  
  // Check for overly casual language
  const casualPatterns = [
    { pattern: /\bgonna\b/gi, message: '"gonna" is informal. Use "going to" instead.' },
    { pattern: /\bwanna\b/gi, message: '"wanna" is informal. Use "want to" instead.' },
    { pattern: /\bgotta\b/gi, message: '"gotta" is informal. Use "got to" instead.' },
    { pattern: /\bkinda\b/gi, message: '"kinda" is informal. Use "kind of" instead.' },
    { pattern: /\bsorta\b/gi, message: '"sorta" is informal. Use "sort of" instead.' },
  ];
  
  casualPatterns.forEach(({ pattern, message }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      suggestions.push({
        category: 'tone',
        type: 'warning',
        message,
        position: match.index,
        original: match[0],
        severity: 'medium',
      });
    }
  });
  
  // Check for hedging language
  const hedgePatterns = [
    { pattern: /\b(I think|I feel|I believe|I suppose)\b/gi, message: 'Consider stating your point more confidently.' },
    { pattern: /\b(maybe|perhaps|possibly|probably)\b/gi, message: 'Hedging language detected. Consider being more definitive.' },
  ];
  
  hedgePatterns.forEach(({ pattern, message }) => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      suggestions.push({
        category: 'tone',
        type: 'suggestion',
        message,
        position: match.index,
        original: match[0],
        severity: 'low',
      });
    }
  });
  
  return suggestions;
}

// Calculate overall score
function calculateOverallScore(suggestions: WritingSuggestion[]): number {
  if (suggestions.length === 0) return 100;
  
  let penalty = 0;
  suggestions.forEach(s => {
    switch (s.severity) {
      case 'high': penalty += 10; break;
      case 'medium': penalty += 5; break;
      case 'low': penalty += 2; break;
    }
  });
  
  return Math.max(0, 100 - penalty);
}

// Get score level
function getScoreLevel(score: number): {level: string, color: string, description: string} {
  if (score >= 90) {
    return { level: 'Excellent', color: 'green', description: 'Your writing is clear and effective.' };
  } else if (score >= 75) {
    return { level: 'Good', color: 'blue', description: 'Your writing is generally strong with minor improvements possible.' };
  } else if (score >= 60) {
    return { level: 'Fair', color: 'yellow', description: 'Your writing has some areas for improvement.' };
  } else {
    return { level: 'Needs Improvement', color: 'red', description: 'Significant improvements recommended.' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, categories } = await request.json();
    
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
    
    const suggestions: WritingSuggestion[] = [];
    
    // Run selected checks or all checks
    const checks = categories || ['clarity', 'conciseness', 'tone', 'vocabulary', 'structure', 'engagement'];
    
    if (checks.includes('vocabulary')) {
      suggestions.push(...checkWeakWords(text));
    }
    
    if (checks.includes('conciseness')) {
      suggestions.push(...checkWordyPhrases(text));
      suggestions.push(...checkFillerWords(text));
    }
    
    if (checks.includes('clarity')) {
      suggestions.push(...checkPassiveVoice(text));
      suggestions.push(...checkVagueLanguage(text));
    }
    
    if (checks.includes('structure')) {
      suggestions.push(...checkSentenceLength(text));
    }
    
    if (checks.includes('engagement')) {
      suggestions.push(...checkRepetitiveStarts(text));
    }
    
    if (checks.includes('tone')) {
      suggestions.push(...checkTone(text));
    }
    
    // Sort by position
    suggestions.sort((a, b) => a.position - b.position);
    
    // Calculate overall score
    const overallScore = calculateOverallScore(suggestions);
    const scoreLevel = getScoreLevel(overallScore);
    
    // Group suggestions by category
    const byCategory: Record<SuggestionCategory, WritingSuggestion[]> = {
      clarity: [],
      conciseness: [],
      tone: [],
      vocabulary: [],
      structure: [],
      engagement: [],
    };
    
    suggestions.forEach(s => {
      byCategory[s.category].push(s);
    });
    
    return NextResponse.json({
      overall: {
        score: overallScore,
        level: scoreLevel,
      },
      suggestions: suggestions.slice(0, 50), // Limit to 50 suggestions
      byCategory: {
        clarity: byCategory.clarity.slice(0, 10),
        conciseness: byCategory.conciseness.slice(0, 10),
        tone: byCategory.tone.slice(0, 10),
        vocabulary: byCategory.vocabulary.slice(0, 10),
        structure: byCategory.structure.slice(0, 10),
        engagement: byCategory.engagement.slice(0, 10),
      },
      summary: {
        total: suggestions.length,
        bySeverity: {
          high: suggestions.filter(s => s.severity === 'high').length,
          medium: suggestions.filter(s => s.severity === 'medium').length,
          low: suggestions.filter(s => s.severity === 'low').length,
        },
        byType: {
          improvement: suggestions.filter(s => s.type === 'improvement').length,
          warning: suggestions.filter(s => s.type === 'warning').length,
          suggestion: suggestions.filter(s => s.type === 'suggestion').length,
        },
      },
    });
  } catch (error) {
    console.error('Writing suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions. Please try again.' },
      { status: 500 }
    );
  }
}

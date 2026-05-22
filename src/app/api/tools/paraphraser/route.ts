import { NextRequest, NextResponse } from 'next/server';

// Synonym database for paraphrasing
const SYNONYM_DATABASE: Record<string, string[]> = {
  // Verbs
  'improve': ['enhance', 'boost', 'elevate', 'upgrade', 'refine', 'better', 'advance', 'strengthen'],
  'increase': ['boost', 'raise', 'enhance', 'expand', 'grow', 'amplify', 'elevate', 'augment'],
  'decrease': ['reduce', 'lower', 'decrease', 'diminish', 'lessen', 'cut', 'decrease', 'shrink'],
  'create': ['make', 'build', 'develop', 'produce', 'generate', 'construct', 'form', 'establish'],
  'make': ['create', 'build', 'develop', 'produce', 'generate', 'construct', 'form', 'establish'],
  'use': ['utilize', 'employ', 'apply', 'leverage', 'harness', 'exploit', 'wield', 'exercise'],
  'help': ['assist', 'aid', 'support', 'facilitate', 'enable', 'empower', 'benefit', 'serve'],
  'show': ['demonstrate', 'display', 'reveal', 'illustrate', 'exhibit', 'present', 'indicate', 'manifest'],
  'find': ['discover', 'locate', 'identify', 'detect', 'uncover', 'reveal', 'determine', 'ascertain'],
  'think': ['believe', 'consider', 'suppose', 'assume', 'reckon', 'feel', 'perceive', 'regard'],
  'say': ['state', 'mention', 'express', 'declare', 'assert', 'claim', 'remark', 'communicate'],
  'get': ['obtain', 'acquire', 'receive', 'gain', 'secure', 'attain', 'achieve', 'procure'],
  'give': ['provide', 'offer', 'supply', 'deliver', 'grant', 'present', 'contribute', 'bestow'],
  'take': ['acquire', 'obtain', 'seize', 'capture', 'grasp', 'assume', 'adopt', 'undertake'],
  'need': ['require', 'demand', 'necessitate', 'call for', 'entail', 'involve', 'warrant', 'involve'],
  'want': ['desire', 'seek', 'wish', 'aspire', 'crave', 'long for', 'yearn', 'pursue'],
  'know': ['understand', 'comprehend', 'grasp', 'perceive', 'recognize', 'realize', 'appreciate', 'acknowledge'],
  'understand': ['comprehend', 'grasp', 'perceive', 'appreciate', 'recognize', 'realize', 'fathom', 'discern'],
  'change': ['alter', 'modify', 'transform', 'adjust', 'adapt', 'revise', 'amend', 'vary'],
  'keep': ['maintain', 'retain', 'preserve', 'sustain', 'uphold', 'continue', 'persist', 'endure'],
  'start': ['begin', 'commence', 'initiate', 'launch', 'embark', 'set out', 'inaugurate', 'kick off'],
  'begin': ['start', 'commence', 'initiate', 'launch', 'embark', 'set out', 'inaugurate', 'kick off'],
  'end': ['finish', 'conclude', 'complete', 'terminate', 'cease', 'stop', 'conclude', 'wind up'],
  'finish': ['complete', 'conclude', 'terminate', 'finalize', 'accomplish', 'achieve', 'fulfill', 'execute'],
  'look': ['examine', 'observe', 'inspect', 'survey', 'scrutinize', 'study', 'analyze', 'review'],
  'see': ['observe', 'notice', 'perceive', 'detect', 'spot', 'identify', 'recognize', 'discern'],
  
  // Adjectives
  'good': ['excellent', 'great', 'fine', 'superior', 'quality', 'outstanding', 'exceptional', 'remarkable'],
  'bad': ['poor', 'inferior', 'substandard', 'deficient', 'inadequate', 'unsatisfactory', 'flawed', 'faulty'],
  'big': ['large', 'huge', 'massive', 'enormous', 'substantial', 'considerable', 'significant', 'major'],
  'small': ['tiny', 'little', 'minor', 'petite', 'compact', 'diminutive', 'minute', 'slight'],
  'important': ['significant', 'crucial', 'vital', 'essential', 'critical', 'key', 'major', 'notable'],
  'different': ['distinct', 'various', 'diverse', 'separate', 'contrasting', 'contrasting', 'disparate', 'unlike'],
  'same': ['identical', 'similar', 'alike', 'equivalent', 'matching', 'corresponding', 'resembling', 'comparable'],
  'easy': ['simple', 'effortless', 'straightforward', 'uncomplicated', 'painless', 'trouble-free', 'seamless', 'smooth'],
  'hard': ['difficult', 'challenging', 'tough', 'demanding', 'arduous', 'strenuous', 'complex', 'complicated'],
  'new': ['fresh', 'novel', 'recent', 'modern', 'contemporary', 'current', 'latest', 'up-to-date'],
  'old': ['ancient', 'aged', 'antique', 'vintage', 'traditional', 'historic', 'outdated', 'obsolete'],
  'fast': ['quick', 'rapid', 'swift', 'speedy', 'brisk', 'hasty', 'expeditious', 'accelerated'],
  'slow': ['sluggish', 'leisurely', 'gradual', 'unhurried', 'measured', 'deliberate', 'unhurried', 'plodding'],
  'clear': ['obvious', 'evident', 'apparent', 'plain', 'transparent', 'lucid', 'unambiguous', 'distinct'],
  'many': ['numerous', 'multiple', 'various', 'countless', 'myriad', 'plentiful', 'abundant', 'substantial'],
  'few': ['scarce', 'limited', 'sparse', 'infrequent', 'rare', 'scant', 'meager', 'insufficient'],
  
  // Nouns
  'problem': ['issue', 'challenge', 'difficulty', 'obstacle', 'hurdle', 'complication', 'concern', 'matter'],
  'solution': ['answer', 'resolution', 'remedy', 'fix', 'approach', 'method', 'strategy', 'tactic'],
  'result': ['outcome', 'consequence', 'effect', 'impact', 'conclusion', 'finding', 'product', 'achievement'],
  'way': ['method', 'approach', 'technique', 'strategy', 'means', 'manner', 'mode', 'style'],
  'thing': ['item', 'object', 'entity', 'element', 'component', 'aspect', 'feature', 'factor'],
  'people': ['individuals', 'persons', 'folks', 'humans', 'citizens', 'residents', 'population', 'community'],
  'person': ['individual', 'human being', 'someone', 'somebody', 'citizen', 'resident', 'member', 'participant'],
  'time': ['period', 'duration', 'era', 'epoch', 'age', 'span', 'interval', 'occasion'],
  'information': ['data', 'details', 'facts', 'knowledge', 'insights', 'intelligence', 'material', 'content'],
  'work': ['job', 'task', 'assignment', 'project', 'undertaking', 'endeavor', 'operation', 'activity'],
  'idea': ['concept', 'notion', 'thought', 'suggestion', 'proposal', 'theory', 'hypothesis', 'viewpoint'],
  'example': ['instance', 'case', 'illustration', 'demonstration', 'sample', 'specimen', 'model', 'representation'],
  'part': ['component', 'element', 'section', 'segment', 'portion', 'piece', 'fragment', 'division'],
  'group': ['team', 'collection', 'assembly', 'gathering', 'cluster', 'batch', 'set', 'category'],
  'point': ['aspect', 'feature', 'element', 'factor', 'matter', 'issue', 'consideration', 'detail'],
  'case': ['situation', 'scenario', 'instance', 'circumstance', 'event', 'occurrence', 'example', 'matter'],
  
  // Adverbs
  'very': ['extremely', 'highly', 'remarkably', 'incredibly', 'exceptionally', 'particularly', 'especially', 'notably'],
  'really': ['truly', 'genuinely', 'actually', 'certainly', 'undoubtedly', 'indeed', 'absolutely', 'definitely'],
  'also': ['additionally', 'furthermore', 'moreover', 'besides', 'too', 'as well', 'likewise', 'similarly'],
  'always': ['consistently', 'invariably', 'perpetually', 'eternally', 'forever', 'constantly', 'continuously', 'unfailingly'],
  'never': ['not ever', 'at no time', 'under no circumstances', 'on no occasion', 'rarely', 'seldom', 'hardly ever', 'scarcely'],
  'often': ['frequently', 'regularly', 'commonly', 'repeatedly', 'habitually', 'customarily', 'typically', 'usually'],
  'sometimes': ['occasionally', 'periodically', 'intermittently', 'sporadically', 'at times', 'now and then', 'from time to time', 'infrequently'],
  'quickly': ['rapidly', 'swiftly', 'speedily', 'briskly', 'hastily', 'promptly', 'expeditiously', 'hurriedly'],
  'slowly': ['gradually', 'leisurely', 'unhurriedly', 'deliberately', 'steadily', 'measuredly', 'cautiously', 'gingerly'],
  'carefully': ['cautiously', 'meticulously', 'thoroughly', 'attentively', 'diligently', 'conscientiously', 'scrupulously', 'prudently'],
  'probably': ['likely', 'presumably', 'presumably', 'doubtless', 'in all likelihood', 'most likely', 'in all probability', 'apparently'],
  'actually': ['in fact', 'in reality', 'truly', 'genuinely', 'really', 'indeed', 'certainly', 'undeniably'],
};

// Sentence structure variations
const SENTENCE_PATTERNS = [
  {
    pattern: /\b(I|You|We|They)\s+(am|is|are|was|were)\s+going to\s+(\w+)/gi,
    replacements: ['$1 will $3', '$1 is about to $3', '$1 intends to $3'],
  },
  {
    pattern: /\b(I|You|We|They)\s+have to\s+(\w+)/gi,
    replacements: ['$1 must $2', '$1 need to $2', '$1 are required to $2'],
  },
  {
    pattern: /\b(I|You|We|They)\s+can\s+(\w+)/gi,
    replacements: ['$1 is able to $2', '$1 has the ability to $2', '$1 could $2'],
  },
  {
    pattern: /\b(It|This|That)\s+is\s+(\w+)/gi,
    replacements: ['$1 represents $2', '$1 constitutes $2', '$1 serves as $2'],
  },
];

// Paraphrase intensity levels
type ParaphraseIntensity = 'light' | 'medium' | 'strong';

// Replace words with synonyms
function replaceWithSynonyms(text: string, intensity: ParaphraseIntensity): string {
  const words = text.split(/(\s+|[.,!?;:"'()])/);
  const replacementChance = intensity === 'light' ? 0.2 : intensity === 'medium' ? 0.4 : 0.6;
  
  return words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
    if (SYNONYM_DATABASE[cleanWord] && Math.random() < replacementChance) {
      const synonyms = SYNONYM_DATABASE[cleanWord];
      const synonym = synonyms[Math.floor(Math.random() * synonyms.length)];
      // Preserve capitalization
      if (word[0] === word[0].toUpperCase()) {
        return synonym.charAt(0).toUpperCase() + synonym.slice(1);
      }
      return synonym;
    }
    return word;
  }).join('');
}

// Vary sentence structure
function varySentenceStructure(text: string, intensity: ParaphraseIntensity): string {
  let result = text;
  
  if (intensity === 'light') return result;
  
  SENTENCE_PATTERNS.forEach(({ pattern, replacements }) => {
    const matches = result.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      if (Math.random() < (intensity === 'medium' ? 0.3 : 0.5)) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        result = result.replace(match[0], replacement);
      }
    }
  });
  
  return result;
}

// Change sentence order within paragraphs
function changeSentenceOrder(text: string, intensity: ParaphraseIntensity): string {
  if (intensity === 'light') return text;
  
  const paragraphs = text.split(/\n\n+/);
  const reorderChance = intensity === 'medium' ? 0.2 : 0.4;
  
  return paragraphs.map(paragraph => {
    if (Math.random() > reorderChance) return paragraph;
    
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 2) return paragraph;
    
    // Swap adjacent sentences occasionally
    for (let i = 0; i < sentences.length - 1; i++) {
      if (Math.random() < 0.3) {
        [sentences[i], sentences[i + 1]] = [sentences[i + 1], sentences[i]];
      }
    }
    
    return sentences.join(' ');
  }).join('\n\n');
}

// Add transitional phrases
function addTransitions(text: string, intensity: ParaphraseIntensity): string {
  if (intensity === 'light') return text;
  
  const transitions = [
    'Additionally,', 'Furthermore,', 'Moreover,', 'In addition,', 'Also,',
    'However,', 'Nevertheless,', 'Nonetheless,', 'On the other hand,',
    'Therefore,', 'Thus,', 'Consequently,', 'As a result,', 'Hence,',
    'For instance,', 'For example,', 'To illustrate,', 'Specifically,',
    'In conclusion,', 'To summarize,', 'In summary,', 'Ultimately,',
  ];
  
  const sentences = text.split(/([.!?]+)/);
  const transitionChance = intensity === 'medium' ? 0.15 : 0.25;
  
  let result = '';
  for (let i = 0; i < sentences.length; i++) {
    result += sentences[i];
    if (i < sentences.length - 2 && Math.random() < transitionChance) {
      const transition = transitions[Math.floor(Math.random() * transitions.length)];
      result += ' ' + transition;
    }
  }
  
  return result;
}

// Calculate paraphrase quality score
function calculateQualityScore(original: string, paraphrased: string, intensity: ParaphraseIntensity): number {
  let score = 70; // Base score
  
  // Check for word changes
  const originalWords = original.toLowerCase().split(/\s+/);
  const paraphrasedWords = paraphrased.toLowerCase().split(/\s+/);
  const changedWords = originalWords.filter(word => !paraphrasedWords.includes(word));
  score += Math.min(changedWords.length * 2, 15);
  
  // Check for structure changes
  if (intensity === 'medium') score += 5;
  if (intensity === 'strong') score += 10;
  
  // Check length similarity
  const lengthDiff = Math.abs(original.length - paraphrased.length) / original.length;
  if (lengthDiff < 0.2) score += 5;
  
  return Math.min(Math.round(score), 95);
}

export async function POST(request: NextRequest) {
  try {
    const { text, intensity = 'medium' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide text to paraphrase.' },
        { status: 400 }
      );
    }
    
    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }
    
    const validIntensities: ParaphraseIntensity[] = ['light', 'medium', 'strong'];
    if (!validIntensities.includes(intensity)) {
      return NextResponse.json(
        { error: 'Invalid intensity. Use light, medium, or strong.' },
        { status: 400 }
      );
    }
    
    // Apply paraphrasing transformations
    let paraphrased = text;
    
    // Step 1: Replace with synonyms
    paraphrased = replaceWithSynonyms(paraphrased, intensity);
    
    // Step 2: Vary sentence structure
    paraphrased = varySentenceStructure(paraphrased, intensity);
    
    // Step 3: Change sentence order (for strong intensity)
    if (intensity === 'strong') {
      paraphrased = changeSentenceOrder(paraphrased, intensity);
    }
    
    // Step 4: Add transitions (for medium and strong intensity)
    if (intensity !== 'light') {
      paraphrased = addTransitions(paraphrased, intensity);
    }
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(text, paraphrased, intensity);
    
    return NextResponse.json({
      paraphrasedText: paraphrased,
      qualityScore,
      intensity,
      metadata: {
        originalLength: text.length,
        paraphrasedLength: paraphrased.length,
        wordCount: paraphrased.split(/\s+/).length,
      },
    });
  } catch (error) {
    console.error('Paraphraser error:', error);
    return NextResponse.json(
      { error: 'Failed to paraphrase text. Please try again.' },
      { status: 500 }
    );
  }
}

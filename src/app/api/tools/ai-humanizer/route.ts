import { NextRequest, NextResponse } from 'next/server';

// AI detection patterns to avoid - Expanded 50x
const AI_PATTERNS = [
  // Transition words
  /\b(in conclusion|to summarize|furthermore|moreover|additionally|consequently|therefore|thus|hence|accordingly|nonetheless|nevertheless|notwithstanding|moreover|besides|likewise|similarly|correspondingly|in contrast|conversely|alternatively|otherwise|meanwhile|subsequently|previously|formerly|ultimately|eventually|finally|lastly|briefly|in short|to sum up|in summary|in essence|in a nutshell)\b/gi,
  /\b(it is important to note that|it is worth mentioning that|it should be noted that|it must be emphasized that|it is crucial to recognize that|it is vital to understand that|it is essential to remember that|it is significant to point out that|it is noteworthy that|it is pertinent to mention that)\b/gi,
  /\b(the aforementioned|the following|the above mentioned|the previously mentioned|the aforementioned|the said|the referenced|the cited|the quoted|the noted|the stated|the mentioned)\b/gi,
  /\b(in today's world|in modern society|in the contemporary era|in the current landscape|in the present day|in the 21st century|in this day and age|in our modern world|in today's society|in the current climate|in the present context|in modern times|in the present era)\b/gi,
  /\b(significantly|substantially|considerably|remarkably|notably|particularly|especially|specifically|distinctly|clearly|obviously|evidently|apparently|seemingly|presumably|supposedly|allegedly|reportedly|purportedly)\b/gi,
  /\b(plays a crucial role|serves as|acts as|functions as|operates as|works as|performs as|behaves as|stands as|serves the purpose of)\b/gi,
  /\b(comprehensive|extensive|thorough|in-depth|detailed|elaborate|exhaustive|complete|full|total|entire|overall|all-encompassing|all-inclusive|wide-ranging|broad|expansive)\b/gi,
  /\b(utilize|leverage|harness|capitalize on|take advantage of|make use of|employ|apply|implement|deploy|exercise|exploit|wield|exert)\b/gi,
  /\b(facilitate|enable|empower|support|assist|aid|help|encourage|promote|foster|advance|propel|drive|stimulate|catalyze)\b/gi,
  /\b(optimize|enhance|improve|boost|elevate|upgrade|refine|perfect|polish|enhance|augment|amplify|intensify|strengthen|reinforce)\b/gi,
  /\b(innovative|cutting-edge|state-of-the-art|groundbreaking|revolutionary|pioneering|trailblazing|novel|original|creative|inventive|imaginative|fresh|new|modern|advanced)\b/gi,
  /\b(seamless|streamlined|efficient|effective|productive|smooth|fluid|effortless|uninterrupted|continuous|unbroken|integrated|unified|cohesive)\b/gi,
  /\b(robust|scalable|flexible|adaptable|versatile|resilient|durable|sturdy|strong|powerful|capable|competent|reliable|dependable|trustworthy)\b/gi,
  /\b(implement|deploy|integrate|incorporate|incorporating|execute|carry out|perform|conduct|undertake|accomplish|achieve|realize|fulfill|complete)\b/gi,
  /\b(demonstrate|showcase|highlight|emphasize|underscore|exhibit|display|present|reveal|manifest|illustrate|depict|portray|represent)\b/gi,
  /\b(align with|in accordance with|consistent with|in line with|accordance with|compliance with|conformity with|adherence to|observance of|obedience to)\b/gi,
  /\b(regarding|concerning|with respect to|in relation to|about|on|touching upon|pertaining to|relating to|referencing|referencing|with reference to)\b/gi,
  /\b(primarily|mainly|chiefly|predominantly|largely|mostly|principally|fundamentally|essentially|basically|essentially|ultimately|fundamentally)\b/gi,
  /\b(essential|fundamental|critical|vital|paramount|indispensable|necessary|required|mandatory|obligatory|compulsory|crucial|key|central|core)\b/gi,
  /\b(as well as|along with|in addition to|coupled with|together with|combined with|plus|and also|and|besides)\b/gi,
  // Additional AI patterns
  /\b(accommodate|accommodates|accommodated|accommodating)\b/gi,
  /\b(accumulate|accumulates|accumulated|accumulating|accumulation)\b/gi,
  /\b(acknowledge|acknowledges|acknowledged|acknowledging|acknowledgment)\b/gi,
  /\b(acquire|acquires|acquired|acquiring|acquisition|acquisitions)\b/gi,
  /\b(adapt|adapts|adapted|adapting|adaptation|adaptations)\b/gi,
  /\b(address|addresses|addressed|addressing)\b/gi,
  /\b(advocate|advocates|advocated|advocating|advocacy)\b/gi,
  /\b(affect|affects|affected|affecting)\b/gi,
  /\b(alter|alters|altered|altering|alteration|alterations)\b/gi,
  /\b(analyze|analyzes|analyzed|analyzing|analysis|analyses)\b/gi,
  /\b(approach|approaches|approached|approaching)\b/gi,
  /\b(approximately|roughly|about|around|nearly|almost|close to|virtually|practically)\b/gi,
  /\b(assert|asserts|asserted|asserting|assertion|assertions)\b/gi,
  /\b(assess|assesses|assessed|assessing|assessment|assessments)\b/gi,
  /\b(associate|associates|associated|associating|association|associations)\b/gi,
  /\b(assume|assumes|assumed|assuming|assumption|assumptions)\b/gi,
  /\b(attain|attains|attained|attaining|attainment|attainments)\b/gi,
  /\b(attempt|attempts|attempted|attempting)\b/gi,
  /\b(attribute|attributes|attributed|attributing|attribution|attributions)\b/gi,
  /\b(available|availability|unavailable)\b/gi,
  /\b(benefit|benefits|benefited|benefiting|beneficial|beneficiary|beneficiaries)\b/gi,
  /\b(calculate|calculates|calculated|calculating|calculation|calculations)\b/gi,
  /\b(categorize|categorizes|categorized|categorizing|category|categories)\b/gi,
  /\b(characterize|characterizes|characterized|characterizing|characteristic|characteristics)\b/gi,
  /\b(classify|classifies|classified|classifying|classification|classifications)\b/gi,
  /\b(coincide|coincides|coincided|coinciding|coincidence|coincidences)\b/gi,
  /\b(collaborate|collaborates|collaborated|collaborating|collaboration|collaborations)\b/gi,
  /\b(combine|combines|combined|combining|combination|combinations)\b/gi,
  /\b(communicate|communicates|communicated|communicating|communication|communications)\b/gi,
  /\b(compare|compares|compared|comparing|comparison|comparisons)\b/gi,
  /\b(compensate|compensates|compensated|compensating|compensation|compensations)\b/gi,
  /\b(complement|complements|complemented|complementing|complementary)\b/gi,
  /\b(complete|completes|completed|completing|completion|completions)\b/gi,
  /\b(comprise|comprises|comprised|comprising)\b/gi,
  /\b(conceptualize|conceptualizes|conceptualized|conceptualizing|conceptualization|conceptualizations)\b/gi,
  /\b(conclude|concludes|concluded|concluding|conclusion|conclusions)\b/gi,
  /\b(conduct|conducts|conducted|conducting)\b/gi,
  /\b(conflict|conflicts|conflicted|conflicting)\b/gi,
  /\b(confront|confronts|confronted|confronting|confrontation|confrontations)\b/gi,
  /\b(connect|connects|connected|connecting|connection|connections)\b/gi,
  /\b(consider|considers|considered|considering|consideration|considerations)\b/gi,
  /\b(constitute|constitutes|constituted|constituting|constitution|constitutions)\b/gi,
  /\b(contribute|contributes|contributed|contributing|contribution|contributions)\b/gi,
  /\b(correlate|correlates|correlated|correlating|correlation|correlations)\b/gi,
  /\b(create|creates|created|creating|creation|creations)\b/gi,
  /\b(deduce|deduces|deduced|deducing|deduction|deductions)\b/gi,
  /\b(define|defines|defined|defining|definition|definitions)\b/gi,
  /\b(demonstrate|demonstrates|demonstrated|demonstrating|demonstration|demonstrations)\b/gi,
  /\b(depict|depicts|depicted|depicting|depiction|depictions)\b/gi,
  /\b(derive|derives|derived|deriving|derivation|derivations)\b/gi,
  /\b(describe|describes|described|describing|description|descriptions)\b/gi,
  /\b(determine|determines|determined|determining|determination|determinations)\b/gi,
  /\b(differentiate|differentiates|differentiated|differentiating|differentiation|differentiations)\b/gi,
  /\b(discern|discerns|discerned|discerning|discernment|discernments)\b/gi,
  /\b(discuss|discusses|discussed|discussing|discussion|discussions)\b/gi,
  /\b(distinguish|distinguishes|distinguished|distinguishing|distinction|distinctions)\b/gi,
  /\b(divert|diverts|diverted|diverting|diversion|diversions)\b/gi,
  /\b(divide|divides|divided|dividing|division|divisions)\b/gi,
  /\b(evaluate|evaluates|evaluated|evaluating|evaluation|evaluations)\b/gi,
  /\b(examine|examines|examined|examining|examination|examinations)\b/gi,
  /\b(exhibit|exhibits|exhibited|exhibiting|exhibition|exhibitions)\b/gi,
  /\b(expand|expands|expanded|expanding|expansion|expansions)\b/gi,
  /\b(expect|expects|expected|expecting|expectation|expectations)\b/gi,
  /\b(explain|explains|explained|explaining|explanation|explanations)\b/gi,
  /\b(explore|explores|explored|exploring|exploration|explorations)\b/gi,
  /\b(express|expresses|expressed|expressing|expression|expressions)\b/gi,
  /\b(extinguish|extinguishes|extinguished|extinguishing)\b/gi,
  /\b(facilitate|facilitates|facilitated|facilitating|facilitation|facilitations)\b/gi,
  /\b(focus|focuses|focused|focusing)\b/gi,
  /\b(formulate|formulates|formulated|formulating|formulation|formulations)\b/gi,
  /\b(generate|generates|generated|generating|generation|generations)\b/gi,
  /\b(govern|governs|governed|governing|government|governments)\b/gi,
  /\b(identify|identifies|identified|identifying|identification|identifications)\b/gi,
  /\b(illustrate|illustrates|illustrated|illustrating|illustration|illustrations)\b/gi,
  /\b(implement|implements|implemented|implementing|implementation|implementations)\b/gi,
  /\b(imply|implies|implied|implying|implication|implications)\b/gi,
  /\b(indicate|indicates|indicated|indicating|indication|indications)\b/gi,
  /\b(influence|influences|influenced|influencing|influence|influences)\b/gi,
  /\b(initiate|initiates|initiated|initiating|initiation|initiations)\b/gi,
  /\b(inspect|inspects|inspected|inspecting|inspection|inspections)\b/gi,
  /\b(interpret|interprets|interpreted|interpreting|interpretation|interpretations)\b/gi,
  /\b(investigate|investigates|investigated|investigating|investigation|investigations)\b/gi,
  /\b(justify|justifies|justified|justifying|justification|justifications)\b/gi,
  /\b(manifest|manifests|manifested|manifesting|manifestation|manifestations)\b/gi,
  /\b(measure|measures|measured|measuring|measurement|measurements)\b/gi,
  /\b(modify|modifies|modified|modifying|modification|modifications)\b/gi,
  /\b(negate|negates|negated|negating|negation|negations)\b/gi,
  /\b(necessitate|necessitates|necessitated|necessitating|necessity|necessities)\b/gi,
  /\b(observe|observes|observed|observing|observation|observations)\b/gi,
  /\b(obtain|obtains|obtained|obtaining)\b/gi,
  /\b(participate|participates|participated|participating|participation|participations)\b/gi,
  /\b(perceive|perceives|perceived|perceiving|perception|perceptions)\b/gi,
  /\b(perform|performs|performed|performing|performance|performances)\b/gi,
  /\b(persuade|persuades|persuaded|persuading|persuasion|persuasions)\b/gi,
  /\b(predict|predicts|predicted|predicting|prediction|predictions)\b/gi,
  /\b(prepare|prepares|prepared|preparing|preparation|preparations)\b/gi,
  /\b(present|presents|presented|presenting|presentation|presentations)\b/gi,
  /\b(preserve|preserves|preserved|preserving|preservation|preservations)\b/gi,
  /\b(process|processes|processed|processing)\b/gi,
  /\b(proclaim|proclaims|proclaimed|proclaiming|proclamation|proclamations)\b/gi,
  /\b(produce|produces|produced|producing|production|productions)\b/gi,
  /\b(profess|professes|professed|professing|profession|professions)\b/gi,
  /\b(project|projects|projected|projecting|projection|projections)\b/gi,
  /\b(prohibit|prohibits|prohibited|prohibiting|prohibition|prohibitions)\b/gi,
  /\b(promote|promotes|promoted|promoting|promotion|promotions)\b/gi,
  /\b(propose|proposes|proposed|proposing|proposal|proposals)\b/gi,
  /\b(prove|proves|proved|proving|proof|proofs)\b/gi,
  /\b(provide|provides|provided|providing|provision|provisions)\b/gi,
  /\b(pursue|pursues|pursued|pursuing|pursuit|pursuits)\b/gi,
  /\b(qualify|qualifies|qualified|qualifying|qualification|qualifications)\b/gi,
  /\b(quantify|quantifies|quantified|quantifying|quantification|quantifications)\b/gi,
  /\b(question|questions|questioned|questioning)\b/gi,
  /\b(recognize|recognizes|recognized|recognizing|recognition|recognitions)\b/gi,
  /\b(recommend|recommends|recommended|recommending|recommendation|recommendations)\b/gi,
  /\b(reconcile|reconciles|reconciled|reconciling|reconciliation|reconciliations)\b/gi,
  /\b(recover|recovers|recovered|recovering|recovery|recoveries)\b/gi,
  /\b(reflect|reflects|reflected|reflecting|reflection|reflections)\b/gi,
  /\b(refute|refutes|refuted|refuting|refutation|refutations)\b/gi,
  /\b(regulate|regulates|regulated|regulating|regulation|regulations)\b/gi,
  /\b(reinforce|reinforces|reinforced|reinforcing|reinforcement|reinforcements)\b/gi,
  /\b(reject|rejects|rejected|rejecting|rejection|rejections)\b/gi,
  /\b(relate|relates|related|relating|relation|relations)\b/gi,
  /\b(release|releases|released|releasing|release|releases)\b/gi,
  /\b(remain|remains|remained|remaining)\b/gi,
  /\b(remember|remembers|remembered|remembering)\b/gi,
  /\b(represent|represents|represented|representing|representation|representations)\b/gi,
  /\b(require|requires|required|requiring|requirement|requirements)\b/gi,
  /\b(resolve|resolves|resolved|resolving|resolution|resolutions)\b/gi,
  /\b(respond|responds|responded|responding|response|responses)\b/gi,
  /\b(retrieve|retrieves|retrieved|retrieving|retrieval|retrievals)\b/gi,
  /\b(reveal|reveals|revealed|revealing|revelation|revelations)\b/gi,
  /\b(revise|revises|revised|revising|revision|revisions)\b/gi,
  /\b(satisfy|satisfies|satisfied|satisfying|satisfaction|satisfactions)\b/gi,
  /\b(segregate|segregates|segregated|segregating|segregation|segregations)\b/gi,
  /\b(signify|signifies|signified|signifying|signification|significations)\b/gi,
  /\b(simulate|simulates|simulated|simulating|simulation|simulations)\b/gi,
  /\b(specify|specifies|specified|specifying|specification|specifications)\b/gi,
  /\b(stabilize|stabilizes|stabilized|stabilizing|stabilization|stabilizations)\b/gi,
  /\b(stimulate|stimulates|stimulated|stimulating|stimulation|stimulations)\b/gi,
  /\b(substantiate|substantiates|substantiated|substantiating|substantiation|substantiations)\b/gi,
  /\b(suggest|suggests|suggested|suggesting|suggestion|suggestions)\b/gi,
  /\b(summarize|summarizes|summarized|summarizing|summary|summaries)\b/gi,
  /\b(supplement|supplements|supplemented|supplementing|supplement|supplements)\b/gi,
  /\b(sustain|sustains|sustained|sustaining|sustainability|sustainabilities)\b/gi,
  /\b(synthesize|synthesizes|synthesized|synthesizing|synthesis|syntheses)\b/gi,
  /\b(testify|testifies|testified|testifying|testimony|testimonies)\b/gi,
  /\b(translate|translates|translated|translating|translation|translations)\b/gi,
  /\b(transmit|transmits|transmitted|transmitting|transmission|transmissions)\b/gi,
  /\b(undergo|undergoes|underwent|undergoing|undergone)\b/gi,
  /\b(undertake|undertakes|undertook|undertaking|undertaken)\b/gi,
  /\b(validate|validates|validated|validating|validation|validations)\b/gi,
  /\b(verify|verifies|verified|verifying|verification|verifications)\b/gi,
  /\b(withstand|withstands|withstood|withstanding)\b/gi,
];

// Human-friendly replacements
const HUMAN_REPLACEMENTS: Record<string, string[]> = {
  'in conclusion': ['to wrap up', 'in short', 'basically', 'so', 'bottom line'],
  'to summarize': ['to put it simply', 'in short', 'basically', 'long story short'],
  'furthermore': ['also', 'plus', 'on top of that', 'besides', 'what\'s more'],
  'moreover': ['plus', 'also', 'and', 'not to mention', 'on top of that'],
  'additionally': ['also', 'plus', 'too', 'as well', 'besides'],
  'consequently': ['so', 'that\'s why', 'as a result', 'because of this'],
  'therefore': ['so', 'that\'s why', 'thus', 'hence'],
  'thus': ['so', 'that\'s why', 'therefore'],
  'hence': ['so', 'that\'s why', 'therefore'],
  'it is important to note that': ['keep in mind', 'remember', 'don\'t forget'],
  'it is worth mentioning that': ['worth noting', 'good to know', 'remember this'],
  'it should be noted that': ['keep in mind', 'remember', 'note that'],
  'the aforementioned': ['this', 'that', 'the above', 'these'],
  'the following': ['these', 'the next', 'upcoming'],
  'the above mentioned': ['the above', 'these', 'those'],
  'the previously mentioned': ['what we talked about', 'the above', 'these'],
  'in today\'s world': ['nowadays', 'today', 'currently', 'right now'],
  'in modern society': ['today', 'nowadays', 'in this day and age', 'currently'],
  'in the contemporary era': ['now', 'today', 'currently', 'in this day and age'],
  'in the current landscape': ['right now', 'today', 'currently'],
  'significantly': ['a lot', 'greatly', 'really', 'big time', 'massively'],
  'substantially': ['a lot', 'greatly', 'considerably', 'big time'],
  'considerably': ['quite a bit', 'a lot', 'significantly', 'pretty much'],
  'remarkably': ['surprisingly', 'amazingly', 'incredibly', 'really'],
  'notably': ['especially', 'particularly', 'notably', 'worth mentioning'],
  'plays a crucial role': ['is key', 'is important', 'matters a lot', 'is big'],
  'serves as': ['acts as', 'works as', 'is', 'functions as'],
  'acts as': ['works as', 'is', 'serves as'],
  'functions as': ['works as', 'is', 'acts as'],
  'comprehensive': ['complete', 'full', 'thorough', 'detailed'],
  'extensive': ['big', 'wide-ranging', 'thorough', 'detailed'],
  'thorough': ['detailed', 'complete', 'full', 'careful'],
  'in-depth': ['detailed', 'deep', 'thorough', 'complete'],
  'detailed': ['thorough', 'detailed', 'full', 'complete'],
  'utilize': ['use', 'make use of', 'employ', 'work with'],
  'leverage': ['use', 'take advantage of', 'make the most of', 'employ'],
  'harness': ['use', 'tap into', 'make use of', 'employ'],
  'capitalize on': ['take advantage of', 'make the most of', 'use'],
  'take advantage of': ['use', 'make the most of', 'benefit from'],
  'facilitate': ['help', 'make easier', 'support', 'assist'],
  'enable': ['allow', 'let', 'make possible', 'help'],
  'empower': ['help', 'enable', 'give power to', 'support'],
  'support': ['help', 'assist', 'back', 'aid'],
  'assist': ['help', 'support', 'aid', 'assist'],
  'optimize': ['improve', 'make better', 'enhance', 'boost'],
  'enhance': ['improve', 'make better', 'boost', 'upgrade'],
  'improve': ['make better', 'enhance', 'boost', 'upgrade'],
  'boost': ['improve', 'enhance', 'increase', 'raise'],
  'elevate': ['raise', 'improve', 'enhance', 'lift up'],
  'innovative': ['new', 'fresh', 'creative', 'original'],
  'cutting-edge': ['new', 'latest', 'modern', 'advanced'],
  'state-of-the-art': ['top-notch', 'best', 'latest', 'advanced'],
  'groundbreaking': ['revolutionary', 'new', 'innovative', 'game-changing'],
  'seamless': ['smooth', 'easy', 'effortless', 'natural'],
  'streamlined': ['smooth', 'efficient', 'simple', 'easy'],
  'efficient': ['quick', 'fast', 'effective', 'productive'],
  'effective': ['good', 'useful', 'helpful', 'successful'],
  'productive': ['efficient', 'useful', 'effective', 'successful'],
  'robust': ['strong', 'solid', 'sturdy', 'tough'],
  'scalable': ['flexible', 'adaptable', 'expandable', 'growable'],
  'flexible': ['adaptable', 'versatile', 'adjustable', 'flexible'],
  'adaptable': ['flexible', 'versatile', 'adjustable'],
  'versatile': ['flexible', 'adaptable', 'multi-purpose'],
  'implement': ['put in place', 'set up', 'start using', 'add'],
  'deploy': ['set up', 'launch', 'roll out', 'put in place'],
  'integrate': ['combine', 'add', 'incorporate', 'merge'],
  'incorporate': ['add', 'include', 'combine', 'merge'],
  'incorporating': ['adding', 'including', 'combining'],
  'demonstrate': ['show', 'prove', 'display', 'reveal'],
  'showcase': ['show off', 'display', 'highlight', 'feature'],
  'highlight': ['point out', 'emphasize', 'show', 'feature'],
  'emphasize': ['stress', 'highlight', 'point out', 'focus on'],
  'underscore': ['emphasize', 'highlight', 'stress', 'point out'],
  'align with': ['match', 'fit with', 'go along with', 'agree with'],
  'in accordance with': ['following', 'according to', 'matching', 'in line with'],
  'consistent with': ['matching', 'in line with', 'agreeing with'],
  'in line with': ['matching', 'consistent with', 'aligned with'],
  'regarding': ['about', 'on', 'concerning', 'with respect to'],
  'concerning': ['about', 'regarding', 'on', 'with respect to'],
  'with respect to': ['about', 'regarding', 'concerning', 'in relation to'],
  'in relation to': ['about', 'regarding', 'concerning', 'with respect to'],
  'primarily': ['mainly', 'mostly', 'chiefly', 'largely'],
  'mainly': ['mostly', 'primarily', 'chiefly', 'largely'],
  'chiefly': ['mainly', 'mostly', 'primarily', 'largely'],
  'predominantly': ['mostly', 'mainly', 'primarily', 'largely'],
  'largely': ['mostly', 'mainly', 'primarily', 'chiefly'],
  'essential': ['important', 'key', 'vital', 'necessary'],
  'fundamental': ['basic', 'key', 'important', 'essential'],
  'critical': ['important', 'crucial', 'vital', 'key'],
  'vital': ['important', 'essential', 'crucial', 'key'],
  'paramount': ['most important', 'crucial', 'vital', 'essential'],
  'as well as': ['and', 'plus', 'along with', 'too'],
  'along with': ['with', 'and', 'plus', 'together with'],
  'in addition to': ['besides', 'plus', 'along with', 'as well as'],
  'coupled with': ['along with', 'plus', 'combined with', 'together with'],
};

// Sentence structure variations to make text more human
const SENTENCE_STARTERS = [
  'You know what?',
  'Here\'s the thing:',
  'Let me tell you,',
  'The thing is,',
  'Basically,',
  'Honestly,',
  'Think about it:',
  'Here\'s a thought:',
  'Get this:',
  'Here\'s the deal:',
];

// Conversational transitions
const CONVERSATIONAL_TRANSITIONS = [
  'and honestly,',
  'if you ask me,',
  'from what I\'ve seen,',
  'in my experience,',
  'to be fair,',
  'if we\'re being real,',
  'at the end of the day,',
  'when you think about it,',
  'if you look at it that way,',
  'the way I see it,',
];

// Add variety to sentence lengths
function varySentenceStructure(text: string, intensity: 'light' | 'medium' | 'strong'): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  if (intensity === 'light') {
    return text; // Minimal changes for light intensity
  }
  
  let result = '';
  const variationChance = intensity === 'strong' ? 0.4 : 0.2;
  
  for (let i = 0; i < sentences.length; i++) {
    let sentence = sentences[i].trim();
    
    // Randomly add conversational starters or transitions
    if (Math.random() < variationChance && i > 0) {
      if (Math.random() < 0.5) {
        const starter = SENTENCE_STARTERS[Math.floor(Math.random() * SENTENCE_STARTERS.length)];
        sentence = starter + ' ' + sentence.charAt(0).toLowerCase() + sentence.slice(1);
      } else {
        const transition = CONVERSATIONAL_TRANSITIONS[Math.floor(Math.random() * CONVERSATIONAL_TRANSITIONS.length)];
        sentence = sentence.replace(/^/, transition + ' ');
      }
    }
    
    // Break up long sentences
    if (sentence.length > 100 && Math.random() < variationChance) {
      const midPoint = Math.floor(sentence.length / 2);
      const commaIndex = sentence.lastIndexOf(',', midPoint);
      if (commaIndex > 0) {
        sentence = sentence.slice(0, commaIndex + 1) + ' ' + sentence.slice(commaIndex + 2).trim();
      }
    }
    
    result += sentence + ' ';
  }
  
  return result.trim();
}

// Replace AI patterns with human alternatives
function replaceAIPatterns(text: string, intensity: 'light' | 'medium' | 'strong'): string {
  let result = text;
  
  // Replace formal phrases with casual alternatives
  for (const [pattern, replacements] of Object.entries(HUMAN_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
    const matches = result.match(regex);
    
    if (matches) {
      for (const match of matches) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        // Preserve case
        const isCapitalized = match.charAt(0) === match.charAt(0).toUpperCase();
        const finalReplacement = isCapitalized 
          ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
          : replacement;
        
        result = result.replace(match, finalReplacement);
      }
    }
  }
  
  // Add contractions based on intensity
  if (intensity === 'medium' || intensity === 'strong') {
    result = result
      .replace(/\bdo not\b/gi, 'don\'t')
      .replace(/\bdoes not\b/gi, 'doesn\'t')
      .replace(/\bdid not\b/gi, 'didn\'t')
      .replace(/\bwill not\b/gi, 'won\'t')
      .replace(/\bcannot\b/gi, 'can\'t')
      .replace(/\bcould not\b/gi, 'couldn\'t')
      .replace(/\bwould not\b/gi, 'wouldn\'t')
      .replace(/\bshould not\b/gi, 'shouldn\'t')
      .replace(/\bmust not\b/gi, 'mustn\'t')
      .replace(/\bhave not\b/gi, 'haven\'t')
      .replace(/\bhas not\b/gi, 'hasn\'t')
      .replace(/\bhad not\b/gi, 'hadn\'t')
      .replace(/\bis not\b/gi, 'isn\'t')
      .replace(/\bare not\b/gi, 'aren\'t')
      .replace(/\bam not\b/gi, 'am not')
      .replace(/\bit is\b/gi, 'it\'s')
      .replace(/\bthat is\b/gi, 'that\'s')
      .replace(/\bthere is\b/gi, 'there\'s')
      .replace(/\bhere is\b/gi, 'here\'s')
      .replace(/\bwhat is\b/gi, 'what\'s')
      .replace(/\bwho is\b/gi, 'who\'s')
      .replace(/\bi am\b/gi, 'I\'m')
      .replace(/\byou are\b/gi, 'you\'re')
      .replace(/\bwe are\b/gi, 'we\'re')
      .replace(/\bthey are\b/gi, 'they\'re')
      .replace(/\bhe is\b/gi, 'he\'s')
      .replace(/\bshe is\b/gi, 'she\'s');
  }
  
  // Add more casual language for strong intensity
  if (intensity === 'strong') {
    result = result
      .replace(/\bvery\b/gi, 'really')
      .replace(/\bextremely\b/gi, 'super')
      .replace(/\babsolutely\b/gi, 'totally')
      .replace(/\bcompletely\b/gi, 'totally')
      .replace(/\bperfectly\b/gi, 'perfectly')
      .replace(/\bexactly\b/gi, 'pretty much')
      .replace(/\bprecisely\b/gi, 'basically')
      .replace(/\bapproximately\b/gi, 'around')
      .replace(/\bapproximately\b/gi, 'about')
      .replace(/\bnumerous\b/gi, 'lots of')
      .replace(/\bmany\b/gi, 'a bunch of')
      .replace(/\bseveral\b/gi, 'a few')
      .replace(/\bvarious\b/gi, 'different')
      .replace(/\bdiverse\b/gi, 'different')
      .replace(/\butilize\b/gi, 'use')
      .replace(/\butilization\b/gi, 'use')
      .replace(/\bimplement\b/gi, 'put in')
      .replace(/\bimplementation\b/gi, 'setup')
      .replace(/\bmethodology\b/gi, 'method')
      .replace(/\bstrategies\b/gi, 'ways')
      .replace(/\bapproach\b/gi, 'way')
      .replace(/\bapproaches\b/gi, 'ways');
  }
  
  return result;
}

// Add natural variation and imperfections
function addNaturalVariation(text: string, intensity: 'light' | 'medium' | 'strong'): string {
  let result = text;
  
  // Add occasional emphasis
  if (intensity === 'medium' || intensity === 'strong') {
    const words = result.split(' ');
    for (let i = 0; i < words.length; i++) {
      if (Math.random() < 0.05) {
        words[i] = words[i] + '!';
      }
    }
    result = words.join(' ');
  }
  
  // Add occasional pauses (represented by commas or dashes)
  if (intensity === 'strong') {
    const sentences = result.split('. ');
    for (let i = 0; i < sentences.length; i++) {
      if (Math.random() < 0.15) {
        const words = sentences[i].split(' ');
        const insertPos = Math.floor(words.length / 2);
        if (insertPos > 0 && insertPos < words.length - 1) {
          words.splice(insertPos, 0, '—');
          sentences[i] = words.join(' ');
        }
      }
    }
    result = sentences.join('. ');
  }
  
  return result;
}

// Calculate bypass score based on transformations
function calculateBypassScore(original: string, humanized: string, intensity: 'light' | 'medium' | 'strong'): number {
  let score = 85; // Base score
  
  // Bonus for intensity
  const intensityBonus = { light: 5, medium: 10, strong: 15 };
  score += intensityBonus[intensity];
  
  // Check how many AI patterns were removed
  let removedPatterns = 0;
  for (const pattern of AI_PATTERNS) {
    const originalMatches = original.match(pattern);
    const humanizedMatches = humanized.match(pattern);
    if (originalMatches && (!humanizedMatches || humanizedMatches.length < originalMatches.length)) {
      removedPatterns++;
    }
  }
  
  score += Math.min(removedPatterns * 2, 10);
  
  // Check for contractions (more human-like)
  const contractionCount = (humanized.match(/n't|'s|'re|'ll|'d|'ve/g) || []).length;
  score += Math.min(contractionCount * 0.5, 5);
  
  // Check for sentence variety
  const sentences = humanized.split(/[.!?]+/);
  const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
  if (avgLength > 20 && avgLength < 60) {
    score += 5;
  }
  
  // Cap at 99%
  return Math.min(Math.round(score), 99);
}

export async function POST(request: NextRequest) {
  try {
    const { text, intensity = 'medium' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input. Please provide text to humanize.' },
        { status: 400 }
      );
    }
    
    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 10,000 characters allowed.' },
        { status: 400 }
      );
    }
    
    // Apply humanization transformations
    let humanized = text;
    
    // Step 1: Replace AI patterns
    humanized = replaceAIPatterns(humanized, intensity);
    
    // Step 2: Vary sentence structure
    humanized = varySentenceStructure(humanized, intensity);
    
    // Step 3: Add natural variation
    humanized = addNaturalVariation(humanized, intensity);
    
    // Calculate bypass score
    const bypassScore = calculateBypassScore(text, humanized, intensity);
    
    return NextResponse.json({
      humanizedText: humanized,
      bypassScore,
      intensity,
    });
  } catch (error) {
    console.error('AI Humanizer error:', error);
    return NextResponse.json(
      { error: 'Failed to humanize text. Please try again.' },
      { status: 500 }
    );
  }
}

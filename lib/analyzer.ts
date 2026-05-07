// lib/analyzer.ts
import { AnalysisResult, WritingContext, Bias, EmotionalTone, Assumption } from './types';

const BIAS_PATTERNS: Record<string, { keywords: string[]; weight: number; explanation: string }> = {
  'All-or-Nothing': { 
    keywords: ['always', 'never', 'everyone', 'no one', 'constantly', 'completely', 'everything', 'nothing'], 
    weight: 0.8,
    explanation: 'Seeing things in black and white categories'
  },
  'Mind Reading': { 
    keywords: ['you think', 'you feel', 'you believe', "you're trying", 'you want', 'you just', 'you only'], 
    weight: 0.7,
    explanation: 'Assuming you know what others are thinking'
  },
  'Catastrophizing': { 
    keywords: ['disaster', 'ruined', 'terrible', 'awful', 'worst', 'horrible', 'end of the', 'destroyed'], 
    weight: 0.6,
    explanation: 'Expecting the worst possible outcome'
  },
  'Personalization': { 
    keywords: ['my fault', 'because of me', 'I always', 'I never', 'I ruin'], 
    weight: 0.7,
    explanation: 'Taking excessive responsibility for external events'
  },
  'Emotional Reasoning': { 
    keywords: ['I feel like', 'it feels like', 'seems like everyone', 'I feel that'], 
    weight: 0.5,
    explanation: 'Assuming feelings reflect reality'
  },
  'Labeling': {
    keywords: ['idiot', 'stupid', 'useless', 'worthless', 'incompetent', 'moron', 'jerk'],
    weight: 0.9,
    explanation: 'Attaching a negative label to someone rather than describing the behavior'
  },
  'Blaming': {
    keywords: ['your fault', "you're the reason", 'you caused', 'you made me', 'because of you'],
    weight: 0.85,
    explanation: 'Placing blame on others without considering your own role'
  }
};

const REFLECTIVE_QUESTIONS = [
  "What's one alternative explanation you haven't considered?",
  "How might this read to someone having a difficult day?",
  "What need are you trying to meet by sending this?",
  "If you wait 24 hours, would this still feel urgent?",
  "What's the outcome you actually want? Will this achieve it?",
  "Is there a kinder way to express this same message?",
  "What would you say if you were in the other person's shoes?",
];

export async function analyzeText(
  text: string,
  context: WritingContext
): Promise<AnalysisResult> {
  const biases = detectBiases(text);
  const assumptions = detectAssumptions(text);
  const emotionalTone = analyzeEmotionalTone(text, biases);
  const regretScore = calculateRegretScore(biases, assumptions, emotionalTone, context);
  const suggestedRephrases = generateRephrases(text, biases);

  return {
    biases,
    emotionalTone,
    assumptions,
    regretScore,
    suggestedRephrases,
    reflectiveQuestion: REFLECTIVE_QUESTIONS[Math.floor(Math.random() * REFLECTIVE_QUESTIONS.length)]
  };
}

function detectBiases(text: string): Bias[] {
  const biases: Bias[] = [];
  const sentences = text.split(/[.!?]+/);

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed || trimmed.length < 5) return;

    Object.entries(BIAS_PATTERNS).forEach(([biasName, pattern]) => {
      const lowerSentence = trimmed.toLowerCase();
      const matchCount = pattern.keywords.filter(word => 
        lowerSentence.includes(word.toLowerCase())
      ).length;

      if (matchCount >= 1) {
        biases.push({
          type: biasName,
          confidence: Math.min(matchCount * pattern.weight, 0.95),
          excerpt: trimmed,
          explanation: pattern.explanation
        });
      }
    });
  });

  // Remove duplicates, keep highest confidence
  const seen = new Map<string, Bias>();
  biases.forEach(bias => {
    const existing = seen.get(bias.type);
    if (!existing || existing.confidence < bias.confidence) {
      seen.set(bias.type, bias);
    }
  });

  return Array.from(seen.values());
}

function detectAssumptions(text: string): Assumption[] {
  const assumptionPatterns = [
    { pattern: /you (clearly|obviously|just|simply|always|never)/gi, severity: 'medium' as const },
    { pattern: /you (don't|won't|can't|refuse to|won't even)/gi, severity: 'medium' as const },
    { pattern: /I know (you|you're|your|why)/gi, severity: 'high' as const },
    { pattern: /as (usual|always|expected|per)/gi, severity: 'medium' as const },
    { pattern: /it's (obvious|clear) (that )?you/gi, severity: 'high' as const },
  ];

  const results: Assumption[] = [];
  
  assumptionPatterns.forEach(({ pattern, severity }) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        results.push({ text: match, severity });
      });
    }
  });

  return results;
}

function analyzeEmotionalTone(text: string, _biases: Bias[]): EmotionalTone {
  
  const paragraphs = text.split(/\n\n|\n/).filter(p => p.trim().length > 0);

  // Strong negative words
  const intenseNegative = ['hate', 'despise', 'furious', 'outraged', 'disgusting', 'vile', 'evil'];
  const moderateNegative = ['angry', 'upset', 'frustrated', 'annoyed', 'disappointed', 'wrong'];
  const mildNegative = ['concerned', 'worried', 'uneasy', 'bothered', 'uncomfortable'];
  
  const positive = ['thank', 'appreciate', 'grateful', 'happy', 'pleased', 'glad', 'great', 'good', 'love', 'wonderful'];
  const professional = ['regarding', 'following up', 'per our', 'would like to', 'consider', 'perhaps'];

  let startTone = 'neutral';
  let middleTone = 'neutral';
  let endTone = 'neutral';

  if (paragraphs.length >= 1) {
    startTone = getToneForText(paragraphs[0], intenseNegative, moderateNegative, mildNegative, positive, professional);
  }
  if (paragraphs.length >= 2) {
    const midIdx = Math.floor(paragraphs.length / 2);
    middleTone = getToneForText(paragraphs[midIdx], intenseNegative, moderateNegative, mildNegative, positive, professional);
  }
  if (paragraphs.length >= 1) {
    endTone = getToneForText(paragraphs[paragraphs.length - 1], intenseNegative, moderateNegative, mildNegative, positive, professional);
  }

  // Detect shift
  let shift = 'stable';
  const negativeTones = ['angry', 'frustrated', 'hostile', 'sad', 'negative'];
  const positiveTones = ['appreciative', 'grateful', 'happy', 'warm', 'positive'];
  
  if (negativeTones.includes(startTone) && positiveTones.includes(endTone)) {
    shift = 'negative-to-positive';
  } else if (positiveTones.includes(startTone) && negativeTones.includes(endTone)) {
    shift = 'positive-to-negative';
  }

  // Intensity
  const allTones = [startTone, middleTone, endTone];
  const intensity: 'mild' | 'moderate' | 'intense' = 
    allTones.some(t => ['angry', 'hostile', 'furious'].includes(t)) ? 'intense' :
    allTones.some(t => ['frustrated', 'negative', 'upset'].includes(t)) ? 'moderate' : 'mild';

  return { start: startTone, middle: middleTone, end: endTone, shift, intensity };
}

function getToneForText(
  text: string, 
  intense: string[], 
  moderate: string[], 
  mild: string[], 
  positive: string[], 
  professional: string[]
): string {
  const lower = text.toLowerCase();
  
  if (intense.some(w => lower.includes(w))) return 'angry';
  if (moderate.some(w => lower.includes(w))) return 'frustrated';
  if (mild.some(w => lower.includes(w))) return 'concerned';
  if (positive.some(w => lower.includes(w)) && moderate.some(w => lower.includes(w))) return 'mixed';
  if (positive.some(w => lower.includes(w))) return 'appreciative';
  if (professional.some(w => lower.includes(w))) return 'professional';
  
  return 'neutral';
}

function calculateRegretScore(
  biases: Bias[], 
  assumptions: Assumption[], 
  tone: EmotionalTone, 
  context: WritingContext
): number {
  let score = 0;

  // Biases contribute heavily
  score += biases.length * 15;

  // High confidence biases contribute more
  biases.forEach(b => {
    if (b.confidence > 0.8) score += 10;
  });

  // Assumptions add score
  assumptions.forEach(a => {
    if (a.severity === 'high') score += 15;
    else score += 8;
  });

  // Emotional intensity
  if (tone.intensity === 'intense') score += 25;
  else if (tone.intensity === 'moderate') score += 12;

  // Negative tone shift
  if (tone.shift === 'positive-to-negative') score += 15;

  // Angry tone anywhere
  if (tone.start === 'angry' || tone.middle === 'angry' || tone.end === 'angry') score += 20;

  // Context multiplier
  const multipliers: Record<WritingContext, number> = {
    email: 1.2,
    social: 1.5,
    message: 1.0,
    journal: 0.5,
    essay: 0.8
  };

  score *= multipliers[context] ?? 1;

  return Math.min(Math.round(score), 100);
}

function generateRephrases(text: string, biases: Bias[]): string[] {
  const rephrases: string[] = [];
  

  biases.forEach(bias => {
    if (bias.type === 'All-or-Nothing') {
      const softened = bias.excerpt
        .replace(/\balways\b/gi, 'sometimes')
        .replace(/\bnever\b/gi, 'occasionally')
        .replace(/\beveryone\b/gi, 'some people')
        .replace(/\beverything\b/gi, 'some things')
        .replace(/\bnothing\b/gi, 'very little')
        .replace(/\bconstantly\b/gi, 'frequently');
      if (softened !== bias.excerpt) rephrases.push(softened);
    }
    if (bias.type === 'Mind Reading') {
      const reframed = bias.excerpt
        .replace(/you think/gi, 'I wonder if')
        .replace(/you feel/gi, 'you might feel')
        .replace(/you believe/gi, 'your perspective seems to be')
        .replace(/you just/gi, 'you may');
      if (reframed !== bias.excerpt) rephrases.push(reframed);
    }
    if (bias.type === 'Labeling') {
      const cleaned = bias.excerpt
        .replace(/\b(?:idiot|stupid|useless|worthless|incompetent|moron|jerk)\b/gi, '[consider rephrasing]');
      if (cleaned !== bias.excerpt) rephrases.push(cleaned);
    }
  });

  // Deduplicate
  return [...new Set(rephrases)].slice(0, 3);
}
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
    keywords: ['idiot', 'stupid', 'useless', 'worthless', 'incompetent', 'moron', 'jerk', 'hate'],
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

  let shift = 'stable';
  const negativeTones = ['angry', 'frustrated', 'hostile', 'sad', 'negative'];
  const positiveTones = ['appreciative', 'grateful', 'happy', 'warm', 'positive'];
  
  if (negativeTones.includes(startTone) && positiveTones.includes(endTone)) {
    shift = 'negative-to-positive';
  } else if (positiveTones.includes(startTone) && negativeTones.includes(endTone)) {
    shift = 'positive-to-negative';
  }

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

  score += biases.length * 15;

  biases.forEach(b => {
    if (b.confidence > 0.8) score += 10;
  });

  assumptions.forEach(a => {
    if (a.severity === 'high') score += 15;
    else score += 8;
  });

  if (tone.intensity === 'intense') score += 25;
  else if (tone.intensity === 'moderate') score += 12;

  if (tone.shift === 'positive-to-negative') score += 15;

  if (tone.start === 'angry' || tone.middle === 'angry' || tone.end === 'angry') score += 20;

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

  if (biases.some(b => b.type === 'Labeling')) {
    rephrases.push(
      'Describe how the specific behavior affected you rather than attacking the person. ' +
      'Try: "I felt hurt when..." instead of name-calling or labels.'
    );
  }

  if (biases.some(b => b.type === 'Blaming')) {
    rephrases.push(
      'Instead of assigning blame, focus on the impact and what you need going forward. ' +
      'Try: "When X happened, I felt Y. In the future, I would appreciate Z."'
    );
  }

  if (biases.some(b => b.type === 'All-or-Nothing')) {
    rephrases.push(
      'Soften absolute language. Replace words like "always," "never," and "completely" ' +
      'with "sometimes," "often," or "in this instance" to keep the conversation productive.'
    );
  }

  if (biases.some(b => b.type === 'Mind Reading')) {
    rephrases.push(
      'Instead of assuming what the other person thinks or feels, try asking: ' +
      '"Can you help me understand your perspective on this?"'
    );
  }

  if (biases.some(b => b.type === 'Catastrophizing')) {
    rephrases.push(
      'Pause and ask yourself: "What is the most likely outcome, not the worst possible one?" ' +
      'Describe the situation factually without dramatic language.'
    );
  }

  if (biases.some(b => b.type === 'Emotional Reasoning')) {
    rephrases.push(
      'Feelings are valid, but they are not facts. Consider adding: ' +
      '"I recognize this is how I feel right now, and I want to also look at the facts."'
    );
  }

  if (biases.some(b => b.type === 'Personalization')) {
    rephrases.push(
      'Be careful not to take excessive responsibility. Ask yourself: ' +
      '"What part of this situation is actually within my control?"'
    );
  }

  if (rephrases.length === 0 && biases.length > 0) {
    rephrases.push(
      'This message might benefit from a calmer tone. Consider waiting a few hours and revisiting it.'
    );
  }

  if (rephrases.length === 0) {
    rephrases.push(
      'Your message looks clear. To add warmth, consider including something you appreciate about the recipient.'
    );
  }

  return rephrases.slice(0, 3);
}
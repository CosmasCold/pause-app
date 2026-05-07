// lib/prompts.ts
export const REFLECTIVE_QUESTIONS = [
  "What's one alternative explanation you haven't considered?",
  "How might this read to someone having a difficult day?",
  "What need are you trying to meet by sending this?",
  "If you wait 24 hours, would this still feel urgent?",
  "What's the outcome you actually want? Will this achieve it?",
];

export const BIAS_PATTERNS = {
  'All-or-Nothing': {
    keywords: ['always', 'never', 'everyone', 'no one', 'constantly', 'completely'],
    weight: 0.8
  },
  'Mind Reading': {
    keywords: ['you think', 'you feel', 'you believe', 'you\'re trying', 'you want'],
    weight: 0.7
  },
  'Catastrophizing': {
    keywords: ['disaster', 'ruined', 'terrible', 'awful', 'worst', 'horrible'],
    weight: 0.6
  },
  'Personalization': {
    keywords: ['my fault', 'because of me', 'I always', 'I never'],
    weight: 0.7
  },
  'Emotional Reasoning': {
    keywords: ['I feel like', 'it feels like', 'seems like everyone'],
    weight: 0.5
  }
};
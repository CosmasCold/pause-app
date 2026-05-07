// lib/types.ts
export interface AnalysisResult {
  biases: Bias[];
  emotionalTone: EmotionalTone;
  assumptions: Assumption[];
  regretScore: number; // 0-100
  suggestedRephrases: string[];
  reflectiveQuestion: string;
}

export interface Bias {
  type: string;
  confidence: number;
  excerpt: string;
  explanation: string;
}

export interface EmotionalTone {
  start: string;
  middle: string;
  end: string;
  shift: string;
  intensity: 'mild' | 'moderate' | 'intense';
}

export interface Assumption {
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export type WritingContext = 'email' | 'message' | 'social' | 'journal' | 'essay';
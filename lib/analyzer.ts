// lib/analyzer.ts
import { HfInference } from '@huggingface/inference';
import { AnalysisResult, WritingContext, Bias, EmotionalTone, Assumption } from './types';
import { BIAS_PATTERNS, REFLECTIVE_QUESTIONS } from './prompts';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY!);

interface EmotionResult {
  label: string;
  score: number;
}

interface ToxicityResult {
  label: string;
  score: number;
}

interface AnalysisData {
  emotionalTone: EmotionalTone;
  biasDetection: Bias[];
  toxicityResult: ToxicityResult[];
  context: WritingContext;
}

export async function analyzeText(
  text: string, 
  context: WritingContext
): Promise<AnalysisResult> {
  const [emotionResult, toxicityResult, biasDetection] = await Promise.all([
    analyzeEmotions(text),
    analyzeToxicity(text),
    detectPatternBiases(text)
  ]);

  const toxicityData = toxicityResult as unknown as ToxicityResult[];
  const emotionalTone = mapEmotionToTone(emotionResult as unknown as EmotionResult[], text);
  const assumptions = extractAssumptions(text);
  const regretScore = calculateRegretScore({
    emotionalTone,
    biasDetection,
    toxicityResult: toxicityData,
    context
  });

  return {
    biases: biasDetection,
    emotionalTone,
    assumptions,
    regretScore,
    suggestedRephrases: generateRephrases(text, biasDetection),
    reflectiveQuestion: getRandomQuestion()
  };
}

async function analyzeEmotions(text: string) {
  const response = await hf.textClassification({
    model: 'SamLowe/roberta-base-go_emotions',
    inputs: text,
  });
  return response;
}

async function analyzeToxicity(text: string) {
  const response = await hf.textClassification({
    model: 'unitary/toxic-bert',
    inputs: text,
  });
  return response;
}

function detectPatternBiases(text: string): Bias[] {
  const biases: Bias[] = [];
  const sentences = text.split(/[.!?]+/);

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    Object.entries(BIAS_PATTERNS).forEach(([biasName, pattern]) => {
      const matchCount = pattern.keywords.filter(word => 
        trimmed.toLowerCase().includes(word)
      ).length;

      if (matchCount >= 2) {
        biases.push({
          type: biasName,
          confidence: Math.min(matchCount * pattern.weight, 0.95),
          excerpt: trimmed,
          explanation: getBiasExplanation(biasName)
        });
      }
    });
  });

  return biases;
}

function mapEmotionToTone(emotions: EmotionResult[], text: string): EmotionalTone {
  const topEmotions = emotions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const paragraphs = text.split('\n\n');
  const toneShift = detectToneShift(paragraphs);

  return {
    start: topEmotions[0]?.label || 'neutral',
    middle: topEmotions[1]?.label || 'neutral',
    end: topEmotions[2]?.label || 'neutral',
    shift: toneShift,
    intensity: calculateIntensity(topEmotions)
  };
}

function extractAssumptions(text: string): Assumption[] {
  const assumptionPatterns = [
    /you (clearly|obviously|just|simply)/gi,
    /you (don't|won't|can't|refuse to)/gi,
    /I know (you|you're|your)/gi,
    /as (usual|always|expected)/gi
  ];

  const results: Assumption[] = [];

  assumptionPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      results.push({
        text: match[0],
        severity: match[0].length > 30 ? 'high' : 'medium'
      });
    }
  });

  return results;
}

function calculateRegretScore(data: AnalysisData): number {
  let score = 0;
  
  const toxicityScore = data.toxicityResult?.[0]?.score ?? 0;
  if (toxicityScore > 0.5) score += 30;
  
  score += Math.min(data.biasDetection.length * 15, 40);
  
  if (data.emotionalTone.intensity === 'intense') score += 20;
  
  const contextMultipliers: Record<WritingContext, number> = {
    email: 1.2,
    social: 1.5,
    message: 1.0,
    journal: 0.5,
    essay: 0.8
  };
  
  const multiplier = contextMultipliers[data.context] ?? 1;
  score *= multiplier;
  
  return Math.min(Math.round(score), 100);
}

function getBiasExplanation(bias: string): string {
  const explanations: Record<string, string> = {
    'All-or-Nothing': 'Seeing things in black and white categories',
    'Mind Reading': 'Assuming you know what others are thinking',
    'Catastrophizing': 'Expecting the worst possible outcome',
    'Personalization': 'Taking excessive responsibility for external events',
    'Emotional Reasoning': 'Assuming feelings reflect reality'
  };
  return explanations[bias] || 'Cognitive pattern detected';
}

function detectToneShift(paragraphs: string[]): string {
  if (paragraphs.length < 2) return 'minimal';
  
  const firstPara = paragraphs[0].toLowerCase();
  const lastPara = paragraphs[paragraphs.length - 1].toLowerCase();
  
  const positiveWords = ['thank', 'appreciate', 'great', 'good', 'happy', 'please'];
  const negativeWords = ['however', 'but', 'unfortunately', 'disappointed', 'angry', 'frustrated'];
  
  const firstPositive = positiveWords.filter(w => firstPara.includes(w)).length;
  const firstNegative = negativeWords.filter(w => firstPara.includes(w)).length;
  const lastPositive = positiveWords.filter(w => lastPara.includes(w)).length;
  const lastNegative = negativeWords.filter(w => lastPara.includes(w)).length;
  
  if (firstPositive > firstNegative && lastNegative > lastPositive) return 'positive-to-negative';
  if (firstNegative > firstPositive && lastPositive > lastNegative) return 'negative-to-positive';
  return 'stable';
}

function calculateIntensity(emotions: EmotionResult[]): 'mild' | 'moderate' | 'intense' {
  const avgScore = emotions.reduce((sum, e) => sum + e.score, 0) / emotions.length;
  if (avgScore > 0.7) return 'intense';
  if (avgScore > 0.4) return 'moderate';
  return 'mild';
}

function generateRephrases(text: string, biases: Bias[]): string[] {
  const rephrases: string[] = [];
  
  biases.forEach(bias => {
    if (bias.type === 'All-or-Nothing') {
      rephrases.push(
        bias.excerpt
          .replace(/always/g, 'sometimes')
          .replace(/never/g, 'occasionally')
          .replace(/everyone/g, 'some people')
      );
    }
    if (bias.type === 'Mind Reading') {
      rephrases.push(
        bias.excerpt.replace(/you think/gi, 'I wonder if')
                    .replace(/you feel/gi, 'you might feel')
      );
    }
  });

  return rephrases.slice(0, 3);
}

function getRandomQuestion(): string {
  return REFLECTIVE_QUESTIONS[Math.floor(Math.random() * REFLECTIVE_QUESTIONS.length)];
}
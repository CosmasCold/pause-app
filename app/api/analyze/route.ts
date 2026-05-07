// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }

    if (!HF_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Run both analyses
    const [emotions, toxicity] = await Promise.all([
      queryModel('SamLowe/roberta-base-go_emotions', text),
      queryModel('unitary/toxic-bert', text).catch(() => [])
    ]);

    // Local bias detection
    const biases = detectPatternBiases(text);
    const assumptions = extractAssumptions(text);
    const emotionalTone = mapEmotionToTone(emotions, text);
    
    // Calculate regret score
    let score = 0;
    const toxicityScore = toxicity?.[0]?.score ?? 0;
    if (toxicityScore > 0.5) score += 30;
    score += Math.min(biases.length * 15, 40);
    if (emotionalTone.intensity === 'intense') score += 20;
    if (emotionalTone.shift !== 'stable' && emotionalTone.shift !== 'minimal') score += 15;
    
    const multipliers: Record<string, number> = {
      email: 1.2, social: 1.5, message: 1.0, journal: 0.5, essay: 0.8
    };
    score *= multipliers[context] ?? 1;
    const regretScore = Math.min(Math.round(score), 100);

    // Generate rephrases
    const rephrases: string[] = [];
    biases.forEach((bias: { type: string; excerpt: string }) => {
      if (bias.type === 'All-or-Nothing') {
        rephrases.push(bias.excerpt.replace(/always/g, 'sometimes').replace(/never/g, 'occasionally').replace(/everyone/g, 'some people'));
      }
      if (bias.type === 'Mind Reading') {
        rephrases.push(bias.excerpt.replace(/you think/gi, 'I wonder if').replace(/you feel/gi, 'you might feel'));
      }
    });

    const questions = [
      "What's one alternative explanation you haven't considered?",
      "How might this read to someone having a difficult day?",
      "What need are you trying to meet by sending this?",
      "If you wait 24 hours, would this still feel urgent?",
      "What's the outcome you actually want? Will this achieve it?",
    ];

    return NextResponse.json({
      biases,
      emotionalTone,
      assumptions,
      regretScore,
      suggestedRephrases: rephrases.slice(0, 3),
      reflectiveQuestion: questions[Math.floor(Math.random() * questions.length)]
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function queryModel(model: string, text: string) {
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  );

  if (!response.ok) {
    console.error(`Model ${model} failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data.flat() : [];
}

function detectPatternBiases(text: string) {
  const patterns: Record<string, { keywords: string[]; weight: number }> = {
    'All-or-Nothing': { keywords: ['always', 'never', 'everyone', 'no one', 'constantly', 'completely'], weight: 0.8 },
    'Mind Reading': { keywords: ['you think', 'you feel', 'you believe', "you're trying", 'you want'], weight: 0.7 },
    'Catastrophizing': { keywords: ['disaster', 'ruined', 'terrible', 'awful', 'worst', 'horrible'], weight: 0.6 },
    'Personalization': { keywords: ['my fault', 'because of me', 'I always', 'I never'], weight: 0.7 },
    'Emotional Reasoning': { keywords: ['I feel like', 'it feels like', 'seems like everyone'], weight: 0.5 }
  };

  const biases: { type: string; confidence: number; excerpt: string; explanation: string }[] = [];
  const sentences = text.split(/[.!?]+/);
  const explanations: Record<string, string> = {
    'All-or-Nothing': 'Seeing things in black and white categories',
    'Mind Reading': 'Assuming you know what others are thinking',
    'Catastrophizing': 'Expecting the worst possible outcome',
    'Personalization': 'Taking excessive responsibility for external events',
    'Emotional Reasoning': 'Assuming feelings reflect reality'
  };

  sentences.forEach(sentence => {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    Object.entries(patterns).forEach(([biasName, pattern]) => {
      const matchCount = pattern.keywords.filter(word => trimmed.toLowerCase().includes(word)).length;
      if (matchCount >= 2) {
        biases.push({
          type: biasName,
          confidence: Math.min(matchCount * pattern.weight, 0.95),
          excerpt: trimmed,
          explanation: explanations[biasName] || 'Cognitive pattern detected'
        });
      }
    });
  });

  return biases;
}

function extractAssumptions(text: string) {
  const patterns = [
    /you (clearly|obviously|just|simply)/gi,
    /you (don't|won't|can't|refuse to)/gi,
    /I know (you|you're|your)/gi,
    /as (usual|always|expected)/gi
  ];

  const results: { text: string; severity: string }[] = [];
  patterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match) {
      results.push({ text: match[0], severity: match[0].length > 30 ? 'high' : 'medium' });
    }
  });
  return results;
}

function mapEmotionToTone(emotions: { label: string; score: number }[], text: string) {
  if (!emotions?.length) {
    return { start: 'neutral', middle: 'neutral', end: 'neutral', shift: 'minimal', intensity: 'mild' };
  }

  const top = emotions.sort((a, b) => b.score - a.score).slice(0, 3);
  const paragraphs = text.split('\n\n');
  
  let shift = 'stable';
  if (paragraphs.length >= 2) {
    const first = paragraphs[0].toLowerCase();
    const last = paragraphs[paragraphs.length - 1].toLowerCase();
    const pos = ['thank', 'appreciate', 'great', 'good', 'happy', 'please'];
    const neg = ['however', 'but', 'unfortunately', 'disappointed', 'angry', 'frustrated'];
    const fp = pos.filter(w => first.includes(w)).length;
    const fn = neg.filter(w => first.includes(w)).length;
    const lp = pos.filter(w => last.includes(w)).length;
    const ln = neg.filter(w => last.includes(w)).length;
    if (fp > fn && ln > lp) shift = 'positive-to-negative';
    else if (fn > fp && lp > ln) shift = 'negative-to-positive';
  }

  const avg = top.reduce((s, e) => s + e.score, 0) / top.length;
  return {
    start: top[0]?.label || 'neutral',
    middle: top[1]?.label || 'neutral',
    end: top[2]?.label || 'neutral',
    shift,
    intensity: avg > 0.7 ? 'intense' : avg > 0.4 ? 'moderate' : 'mild'
  };
}
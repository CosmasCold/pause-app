// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// ------ Local type definitions ------
interface Bias {
  type: string;
  confidence: number;
  excerpt: string;
  explanation: string;
}

interface Assumption {
  text: string;
  severity: string;
}

interface EmotionalTone {
  start: string;
  middle: string;
  end: string;
  shift: string;
  intensity: string;
}

interface AnalysisResult {
  biases: Bias[];
  emotionalTone: EmotionalTone;
  assumptions: Assumption[];
  regretScore: number;
  suggestedRephrases: string[];
  reflectiveQuestion: string;
}

const SYSTEM_PROMPT = `You are an expert communication coach. Analyze the text for tone, biases, assumptions, and regret probability.

TONE must be exactly one of: neutral, concerned, frustrated, angry, appreciative, professional, mixed, sad.
SHIFT must be exactly one of: stable, positive-to-negative, negative-to-positive, minimal.
INTENSITY must be exactly one of: mild, moderate, intense.

For messages containing insults, profanity, or direct attacks, regretScore MUST be at least 85.

"suggestedRephrases" must be 1-3 complete, ready-to-send replacement messages. They must be full sentences that express the user's underlying concern or frustration in a respectful, constructive way. Do NOT include generic advice like "Try saying…". Every suggestion must be a standalone message the user could copy-paste and send immediately. If the text is overtly hostile, rewrite it into a calm expression of the same core feeling.

IMPORTANT: If the input is repetitive nonsense (e.g., "vvvvvvv", "aaaaa", long strings of single characters, etc.), treat it as a neutral, non-harmful message with 0 regretScore, no biases, and intensity mild.

Respond ONLY with valid JSON (no markdown, no backticks):

{
  "biases": [
    { "type": "string", "confidence": number (0-1), "excerpt": "exact phrase", "explanation": "brief" }
  ],
  "emotionalTone": {
    "start": "tone",
    "middle": "tone",
    "end": "tone",
    "shift": "shift",
    "intensity": "intensity"
  },
  "assumptions": [
    { "text": "exact phrase", "severity": "low, medium, or high" }
  ],
  "regretScore": number (0-100),
  "suggestedRephrases": [ "complete replacement message", … ],
  "reflectiveQuestion": "thought-provoking question"
}`;

const PROFANITY =
  /\b(fuck|shit|asshole|bitch|bastard|dick|piss|cunt|motherfucker|douche|scumbag|moron|idiot|stupid|hate|worthless|useless|pathetic|garbage|trash|scum|kill yourself)\b/i;

function generateFallbackRephrase(text: string): string {
  const cleaned = text
    .replace(
      /\b(fuck|shit|asshole|bitch|bastard|dick|piss|cunt|motherfucker|douche|scumbag|moron|idiot|stupid|hate)\b/gi,
      ''
    )
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (cleaned.length < 10) {
    return "I'm feeling really upset right now and I need to express that. Can we talk about what happened?";
  }
  return `I'm feeling very frustrated. ${cleaned}. I'd like to discuss this calmly.`;
}

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.length < 3) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }

    const hasProfanity = PROFANITY.test(text);
    let aiResult: AnalysisResult | null = null;

    // Try AI if key available
    if (GROQ_API_KEY) {
      try {
        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: `Context: ${context}\nText: """${text}"""\n\nAnalyze. The suggestedRephrases must be complete, ready-to-send alternative messages.`,
                },
              ],
              temperature: 0.2,
              max_tokens: 1200,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0].message.content.trim();
          content = content.replace(/```json\n?|```/g, '').trim();
          const parsed = JSON.parse(content) as Partial<AnalysisResult>;

          // Sanitise and fix types
          aiResult = {
            biases: (parsed.biases || [])
              .filter(
                (b: Partial<Bias>) =>
                  b.type && typeof b.type === 'string' && b.type !== 'string' && typeof b.confidence === 'number'
              )
              .map((b: Partial<Bias>): Bias => ({
                type: b.type || '',
                confidence: Math.min(1, Math.max(0, b.confidence || 0)),
                excerpt: b.excerpt || '',
                explanation: b.explanation || '',
              })),
            emotionalTone: {
              start: parsed.emotionalTone?.start || 'neutral',
              middle: parsed.emotionalTone?.middle || 'neutral',
              end: parsed.emotionalTone?.end || 'neutral',
              shift: parsed.emotionalTone?.shift || 'minimal',
              intensity: parsed.emotionalTone?.intensity || 'mild',
            },
            assumptions: (parsed.assumptions || []).map(
              (a: Partial<Assumption>): Assumption => ({
                text: a.text || '',
                severity: a.severity || 'low',
              })
            ),
            regretScore: Math.min(100, Math.max(0, Math.round(parsed.regretScore || 0))),
            suggestedRephrases: parsed.suggestedRephrases || [],
            reflectiveQuestion: parsed.reflectiveQuestion || 'What do you want to achieve with this message?',
          };
        } else {
          console.error('Groq API error:', await response.text());
          return NextResponse.json(
            { error: 'Our AI coach is taking a short break. Please try again in a moment.' },
            { status: 502 }
          );
        }
      } catch (e) {
        console.error('Groq error:', e);
        return NextResponse.json(
          { error: 'Our AI coach is taking a short break. Please try again in a moment.' },
          { status: 502 }
        );
      }
    }

    // Safety net: override for profanity
    if (hasProfanity) {
      if (!aiResult) {
        aiResult = {
          biases: [
            {
              type: 'Labeling',
              confidence: 0.95,
              excerpt: text.split(/[.!?]+/)[0].trim(),
              explanation: 'Message contains hostile or derogatory language',
            },
          ],
          emotionalTone: {
            start: 'angry',
            middle: 'angry',
            end: 'angry',
            shift: 'stable',
            intensity: 'intense',
          },
          assumptions: [{ text: text.trim(), severity: 'high' }],
          regretScore: 90,
          suggestedRephrases: [generateFallbackRephrase(text)],
          reflectiveQuestion: 'What do you actually want the other person to understand?',
        };
      } else {
        // Enforce minimums for profanity
        aiResult.emotionalTone.start =
          aiResult.emotionalTone.start === 'neutral' ? 'angry' : aiResult.emotionalTone.start;
        aiResult.emotionalTone.intensity = 'intense';
        aiResult.regretScore = Math.max(aiResult.regretScore, 85);

        if (
          !aiResult.suggestedRephrases ||
          aiResult.suggestedRephrases.length === 0 ||
          aiResult.suggestedRephrases.some(
            (s) => s.toLowerCase().startsWith('try') || s.toLowerCase().startsWith('consider')
          )
        ) {
          aiResult.suggestedRephrases = [generateFallbackRephrase(text)];
        }
      }
    }

    // Fallback if no AI result at all
    if (!aiResult) {
      aiResult = {
        biases: [],
        emotionalTone: {
          start: 'neutral',
          middle: 'neutral',
          end: 'neutral',
          shift: 'minimal',
          intensity: 'mild',
        },
        assumptions: [],
        regretScore: 0,
        suggestedRephrases: [],
        reflectiveQuestion: 'Is there anything you want to add to make your intent clearer?',
      };
    }

    // Normalize tone values
    const validTones = [
      'neutral',
      'concerned',
      'frustrated',
      'angry',
      'appreciative',
      'professional',
      'mixed',
      'sad',
    ];
    for (const key of ['start', 'middle', 'end'] as const) {
      if (!validTones.includes(aiResult.emotionalTone[key])) {
        aiResult.emotionalTone[key] = 'frustrated';
      }
    }

    // Override shift: if all tones are the same, shift is stable
    const { start, middle, end } = aiResult.emotionalTone;
    if (start === middle && middle === end) {
      aiResult.emotionalTone.shift = 'stable';
    } else {
      const validShifts = ['stable', 'positive-to-negative', 'negative-to-positive', 'minimal'];
      if (!validShifts.includes(aiResult.emotionalTone.shift)) {
        aiResult.emotionalTone.shift = 'stable';
      }
    }

    const validIntensities = ['mild', 'moderate', 'intense'];
    if (!validIntensities.includes(aiResult.emotionalTone.intensity)) {
      aiResult.emotionalTone.intensity = 'intense';
    }

    return NextResponse.json(aiResult);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Our AI coach is taking a short break. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
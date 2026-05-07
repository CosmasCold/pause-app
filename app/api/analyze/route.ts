import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are a blunt, honest communication coach. Analyze the text for emotional tone, cognitive biases, assumptions about others, and regret probability.

TONE must be exactly one of: neutral, concerned, frustrated, angry, appreciative, professional, mixed, sad.
SHIFT must be exactly one of: stable, positive-to-negative, negative-to-positive, minimal.
INTENSITY must be exactly one of: mild, moderate, intense.

For messages containing insults, profanity, or direct attacks, regretScore MUST be at least 85.

Respond ONLY with valid JSON (no markdown, no backticks) with this exact structure:

{
  "biases": [
    { "type": "string", "confidence": number, "excerpt": "exact phrase", "explanation": "brief" }
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
  "suggestedRephrases": [ "actionable rephrasing advice" ],
  "reflectiveQuestion": "thought-provoking question"
}`;

const PROFANITY = /\b(fuck|shit|asshole|bitch|bastard|dick|piss|cunt|motherfucker|douche|scumbag|moron|idiot|stupid|hate|worthless|useless|pathetic|garbage|trash|scum|kill yourself)\b/i;

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.length < 3) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }

    const hasProfanity = PROFANITY.test(text);
    let aiResult = null;

    if (GROQ_API_KEY) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: `Context: ${context}\nText: """${text}"""\n\nAnalyze. If this contains ANY profanity or insults, regretScore must be 85 or higher.` }
            ],
            temperature: 0.1,
            max_tokens: 1000,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          let content = data.choices[0].message.content.trim();
          content = content.replace(/```json\n?|```/g, '').trim();
          aiResult = JSON.parse(content);
        }
      } catch (e) {
        console.error('Groq error:', e);
      }
    }

    // Safety net: override for profanity
    if (hasProfanity) {
      if (!aiResult) {
        aiResult = {
          biases: [{
            type: 'Labeling',
            confidence: 0.95,
            excerpt: text.split(/[.!?]+/)[0].trim(),
            explanation: 'Message contains hostile or derogatory language'
          }],
          emotionalTone: { start: 'angry', middle: 'angry', end: 'angry', shift: 'stable', intensity: 'intense' },
          assumptions: [{ text: text.trim(), severity: 'high' }],
          regretScore: 90,
          suggestedRephrases: ['Express your frustration without personal attacks. Try: "I feel really upset right now and need to talk about this."'],
          reflectiveQuestion: 'What do you actually want the other person to understand?'
        };
      } else {
        // Enforce minimums
        aiResult.emotionalTone.start = aiResult.emotionalTone.start === 'neutral' ? 'angry' : aiResult.emotionalTone.start;
        aiResult.emotionalTone.intensity = 'intense';
        aiResult.regretScore = Math.max(aiResult.regretScore ?? 80, 85);
      }
    }

    if (!aiResult) {
      aiResult = {
        biases: [],
        emotionalTone: { start: 'neutral', middle: 'neutral', end: 'neutral', shift: 'minimal', intensity: 'mild' },
        assumptions: [],
        regretScore: 0,
        suggestedRephrases: [],
        reflectiveQuestion: 'Is there anything you want to add to make your intent clearer?'
      };
    }

    // Normalize any non-standard tone values that AI might return
    const validTones = ['neutral', 'concerned', 'frustrated', 'angry', 'appreciative', 'professional', 'mixed', 'sad'];
    for (const key of ['start', 'middle', 'end'] as const) {
      if (!validTones.includes(aiResult.emotionalTone[key])) {
        aiResult.emotionalTone[key] = 'frustrated';
      }
    }
    const validShifts = ['stable', 'positive-to-negative', 'negative-to-positive', 'minimal'];
    if (!validShifts.includes(aiResult.emotionalTone.shift)) {
      aiResult.emotionalTone.shift = 'stable';
    }
    const validIntensities = ['mild', 'moderate', 'intense'];
    if (!validIntensities.includes(aiResult.emotionalTone.intensity)) {
      aiResult.emotionalTone.intensity = 'intense';
    }

    return NextResponse.json(aiResult);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
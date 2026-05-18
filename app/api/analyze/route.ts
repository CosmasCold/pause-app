// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are an expert communication coach. Your job is to analyze a message and return a JSON object with the following fields. Do NOT use placeholder values like "string". Every field must contain real, thoughtful analysis.

FIELDS:

1. "biases" – an array of cognitive biases found in the text. Each bias must have:
   - "type": one of "All-or-Nothing", "Mind Reading", "Catastrophizing", "Labeling", "Blaming", "Emotional Reasoning", "Personalization"
   - "confidence": a number from 0 to 1
   - "excerpt": the exact phrase from the text that shows this bias
   - "explanation": a brief, plain-English explanation of why this is that bias

2. "emotionalTone" – an object with:
   - "start": the tone of the opening (one of: neutral, concerned, frustrated, angry, appreciative, professional, mixed, sad)
   - "middle": tone of the middle
   - "end": tone of the closing
   - "shift": one of: stable, positive-to-negative, negative-to-positive, minimal
   - "intensity": one of: mild, moderate, intense

3. "assumptions" – an array of assumptions the writer makes about the recipient. Each has:
   - "text": the exact phrase
   - "severity": one of: low, medium, high

4. "regretScore" – a number from 0 to 100 representing how likely the sender is to regret sending this message.

   Use the FULL range. Do NOT default to 0 or 95. Here are guidelines:
   - 0-10: Completely neutral, factual, or warm. No emotional charge.
   - 10-25: Mild concern or slight frustration expressed politely.
   - 25-45: Clear frustration or disappointment, but still professional.
   - 45-65: Strong frustration, some accusatory language, or noticeable tension.
   - 65-85: Hostile, aggressive, or insulting language.
   - 85-100: Extreme hostility, profanity, direct personal attacks.

5. "suggestedRephrases" – an array of 1-3 complete replacement messages. These must be full sentences the user could copy and send immediately. Do NOT give generic advice. If the original message is already fine, return an empty array.

6. "reflectiveQuestion" – one thought-provoking question to help the user reconsider their message.

Return ONLY valid JSON. No markdown, no backticks, no extra text.`;

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
    let aiResult: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any

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
          console.log('RAW GROQ CONTENT:', content);
aiResult = JSON.parse(content);
          aiResult = JSON.parse(content);
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
            (s: string) => s.toLowerCase().startsWith('try') || s.toLowerCase().startsWith('consider')
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
    const validTones = ['neutral', 'concerned', 'frustrated', 'angry', 'appreciative', 'professional', 'mixed', 'sad'];
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
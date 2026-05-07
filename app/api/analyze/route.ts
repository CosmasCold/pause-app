// app/api/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `You are an expert communication coach and cognitive behavioral therapist. Analyze the provided text for emotional tone, cognitive biases, assumptions about others, and regret probability (the likelihood the sender will regret sending this message). Respond ONLY with a valid JSON object — no markdown, no extra text. The JSON must have exactly this structure:

{
  "biases": [
    {
      "type": "string (e.g., All-or-Nothing, Mind Reading, Catastrophizing, Labeling, Blaming, Emotional Reasoning, Personalization)",
      "confidence": number (0-1),
      "excerpt": "the specific phrase from the text",
      "explanation": "brief explanation of this bias"
    }
  ],
  "emotionalTone": {
    "start": "string (e.g., angry, frustrated, neutral, appreciative, etc.)",
    "middle": "string",
    "end": "string",
    "shift": "string (stable, positive-to-negative, negative-to-positive, minimal)",
    "intensity": "mild, moderate, or intense"
  },
  "assumptions": [
    {
      "text": "the exact phrase that shows assumption about others",
      "severity": "low, medium, or high"
    }
  ],
  "regretScore": number (0-100, where 0 = no regret likely, 100 = extremely likely to regret),
  "suggestedRephrases": [
    "A helpful, actionable rephrasing or communication advice (not just word swaps, but a full alternative sentence or strategy)"
  ],
  "reflectiveQuestion": "A thought-provoking question to help the user reconsider their message"
}`;

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 });
    }

    const userPrompt = `Context: ${context} message\nText: """${text}"""\n\nAnalyze the text above.`;

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
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq error:', errorText);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON from the response (strip any accidental markdown fences)
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();

    const result = JSON.parse(cleaned);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
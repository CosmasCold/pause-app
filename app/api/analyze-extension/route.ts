// app/api/analyze-extension/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '@/lib/analyzer';
import { WritingContext } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { text, context } = await request.json();
    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Text too short' }, { status: 400 });
    }
    const result = await analyzeText(text, (context as WritingContext) || 'email');
    return NextResponse.json(result);
  } catch (error) {
    console.error('Extension analysis error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
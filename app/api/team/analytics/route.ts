// app/api/team/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service‑role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface Bias {
  type: string;
  confidence: number;
  excerpt: string;
  explanation: string;
}

interface SavedAnalysis {
  biases: Bias[];
  regret_score: number;
  user_id: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // dashboard will send this

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // Verify user tier with admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    if (profile.tier !== 'team' || !profile.team_id) {
      return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
    }

    // Get team members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('team_id', profile.team_id);

    if (membersError) {
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 });
    }

    const memberIds = (members || []).map((m) => m.id);

    // Get analyses
    const { data: analyses, error: analysesError } = await supabaseAdmin
      .from('saved_analyses')
      .select('*')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(500);

    if (analysesError) {
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
    }

    const analysesList: SavedAnalysis[] = analyses as SavedAnalysis[] || [];
    const totalAnalyses = analysesList.length;
    const averageRegretScore =
      totalAnalyses > 0
        ? Math.round(
            analysesList.reduce((sum, a) => sum + a.regret_score, 0) / totalAnalyses
          )
        : 0;

    const biasCount: Record<string, number> = {};
    analysesList.forEach((a) => {
      (a.biases || []).forEach((bias: Bias) => {
        biasCount[bias.type] = (biasCount[bias.type] || 0) + 1;
      });
    });

    const topBiases = Object.entries(biasCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const memberStats = (members || []).map((member) => {
      const memberAnalyses = analysesList.filter((a) => a.user_id === member.id);
      return {
        email: member.email,
        analyses: memberAnalyses.length,
        avgScore:
          memberAnalyses.length > 0
            ? Math.round(
                memberAnalyses.reduce((sum, a) => sum + a.regret_score, 0) /
                  memberAnalyses.length
              )
            : 0,
      };
    });

    return NextResponse.json({
      members: memberStats,
      totalAnalyses,
      averageRegretScore,
      topBiases,
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
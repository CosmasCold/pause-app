// app/api/team/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('team_id, tier')
    .eq('id', user.id)
    .single();

  if (!profile?.team_id || profile.tier !== 'team') {
    return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
  }

  const { data: members } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('team_id', profile.team_id);

  if (!members || members.length === 0) {
    return NextResponse.json({
      members: [],
      totalAnalyses: 0,
      averageRegretScore: 0,
      topBiases: [],
    });
  }

  const memberIds = members.map((m) => m.id);

  const { data: analyses } = await supabase
    .from('saved_analyses')
    .select('*')
    .in('user_id', memberIds)
    .order('created_at', { ascending: false })
    .limit(500);

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

  const memberStats = members.map((member) => {
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
}
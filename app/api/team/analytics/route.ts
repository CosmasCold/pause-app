// app/api/team/analytics/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  created_at: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  try {
    // Verify team tier and get team members
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', userId)
      .single();

    if (!profile || profile.tier !== 'team' || !profile.team_id) {
      return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
    }

    const { data: members } = await supabaseAdmin
  .from('user_profiles')
  .select('id, email, name')
  .eq('team_id', profile.team_id);

    if (!members || members.length === 0) {
      return NextResponse.json({
        members: [],
        totalAnalyses: 0,
        averageRegretScore: 0,
        topBiases: [],
        trend: null,
      });
    }

    const memberIds = members.map((m) => m.id);

    // All analyses for team members
    const { data: analyses } = await supabaseAdmin
      .from('saved_analyses')
      .select('*')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false });

    const analysesList: SavedAnalysis[] = (analyses as SavedAnalysis[]) || [];

    // ---- Standard stats (unchanged) ----
    const totalAnalyses = analysesList.length;
    const averageRegretScore = totalAnalyses > 0
      ? Math.round(
          analysesList.reduce((sum, a) => sum + a.regret_score, 0) / totalAnalyses
        )
      : 0;

    const biasCount: Record<string, number> = {};
    analysesList.forEach((a) => {
      (a.biases || []).forEach((bias) => {
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
        name: member.name || '',
        analyses: memberAnalyses.length,
        avgScore: memberAnalyses.length > 0
          ? Math.round(
              memberAnalyses.reduce((sum, a) => sum + a.regret_score, 0) /
                memberAnalyses.length
            )
          : 0,
      };
    });

    // ---- Trends (last 30 days vs previous 30 days) ----
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentAnalyses = analysesList.filter(
      (a) => new Date(a.created_at) >= last30Days
    );
    const olderAnalyses = analysesList.filter(
      (a) => {
        const date = new Date(a.created_at);
        return date >= previous30Days && date < last30Days;
      }
    );

    const recentAvg = recentAnalyses.length > 0
      ? Math.round(
          recentAnalyses.reduce((sum, a) => sum + a.regret_score, 0) /
            recentAnalyses.length
        )
      : 0;

    const olderAvg = olderAnalyses.length > 0
      ? Math.round(
          olderAnalyses.reduce((sum, a) => sum + a.regret_score, 0) /
            olderAnalyses.length
        )
      : 0;

    const trendChange = olderAvg > 0
      ? Math.round(((olderAvg - recentAvg) / olderAvg) * 100)
      : 0;

    // Most improved bias (team-wide)
    const countBiases = (list: SavedAnalysis[]) => {
      const counts: Record<string, number> = {};
      list.forEach((a) => {
        (a.biases || []).forEach((bias) => {
          counts[bias.type] = (counts[bias.type] || 0) + 1;
        });
      });
      return counts;
    };

    const recentBiasCounts = countBiases(recentAnalyses);
    const olderBiasCounts = countBiases(olderAnalyses);

    let mostImprovedBias: { bias: string; improvementPercent: number } | null = null;
    let maxImprovement = 0;
    Object.keys(recentBiasCounts).forEach((bias) => {
      const recentCount = recentBiasCounts[bias] || 0;
      const olderCount = olderBiasCounts[bias] || 0;
      if (olderCount > 0 && recentCount < olderCount) {
        const improvement = Math.round(((olderCount - recentCount) / olderCount) * 100);
        if (improvement > maxImprovement) {
          maxImprovement = improvement;
          mostImprovedBias = { bias, improvementPercent: improvement };
        }
      }
    });

    const trend = {
      recentAvg,
      olderAvg,
      changePercent: trendChange, // positive = improved (score went down), negative = worsened
      recentCount: recentAnalyses.length,
      olderCount: olderAnalyses.length,
      mostImprovedBias,
    };

    return NextResponse.json({
      members: memberStats,
      totalAnalyses,
      averageRegretScore,
      topBiases,
      trend,
    });
  } catch (error) {
    console.error('Team analytics error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
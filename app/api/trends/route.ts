// app/api/trends/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify tier
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier')
    .eq('id', user.id)
    .single();

  if (!profile || profile.tier === 'free') {
    return NextResponse.json({ error: 'Pro tier required' }, { status: 403 });
  }

  // Get all analyses
  const { data: analyses } = await supabase
    .from('saved_analyses')
    .select('regret_score, biases, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!analyses || analyses.length === 0) {
    return NextResponse.json({
      trends: {
        days7: { averageScore: 0, count: 0 },
        days30: { averageScore: 0, count: 0 },
        days90: { averageScore: 0, count: 0 },
      },
      mostImprovedBias: null,
    });
  }

  const now = new Date();
  const periodCalculations = (days: number) => {
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const periodAnalyses = analyses.filter(a => new Date(a.created_at) >= cutoff);
    const averageScore = periodAnalyses.length > 0
      ? Math.round(periodAnalyses.reduce((sum, a) => sum + a.regret_score, 0) / periodAnalyses.length)
      : 0;
    return { averageScore, count: periodAnalyses.length };
  };

  const trends = {
    days7: periodCalculations(7),
    days30: periodCalculations(30),
    days90: periodCalculations(90),
  };

  // Most improved bias: compare last 30 days vs previous 30 days
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const previous30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const recentAnalyses = analyses.filter(a => new Date(a.created_at) >= last30Days);
  const olderAnalyses = analyses.filter(a => {
    const date = new Date(a.created_at);
    return date >= previous30Days && date < last30Days;
  });

  interface SavedAnalysis {
  biases: { type: string }[];
}

const countBiases = (analysisList: SavedAnalysis[]) => {
  const counts: Record<string, number> = {};
  analysisList.forEach(a => {
    (a.biases || []).forEach(bias => {
      counts[bias.type] = (counts[bias.type] || 0) + 1;
    });
  });
  return counts;
};

  const recentBiasCounts = countBiases(recentAnalyses);
  const olderBiasCounts = countBiases(olderAnalyses);

  let mostImprovedBias: { bias: string; improvementPercent: number } | null = null;
  let maxImprovement = 0;

  Object.keys(recentBiasCounts).forEach(bias => {
    const recentCount = recentBiasCounts[bias] || 0;
    const olderCount = olderBiasCounts[bias] || 0;
    // Only consider if older count > 0 to avoid division by zero
    if (olderCount > 0 && recentCount < olderCount) {
      const improvement = Math.round(((olderCount - recentCount) / olderCount) * 100);
      if (improvement > maxImprovement) {
        maxImprovement = improvement;
        mostImprovedBias = { bias, improvementPercent: improvement };
      }
    }
  });

  return NextResponse.json({ trends, mostImprovedBias });
}
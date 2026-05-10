// app/api/cron/weekly-report/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service‑role client – bypasses RLS, safe for cron jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface SavedAnalysis {
  id: string;
  user_id: string;
  original_text: string;
  context: string;
  regret_score: number;
  biases: { type: string }[];
  emotional_tone: Record<string, unknown>;
  assumptions: Record<string, unknown>;
  created_at: string;
}

interface WeeklyReport {
  totalAnalyses: number;
  averageRegretScore: number;
  mostUsedContext: string;
  topBias: string;
  streak: number;
}

export async function GET() {
  try {
    // Use admin client – no RLS issues
    const { data: users } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email_reports', true)
      .neq('tier', 'free');   // only Pro & Team

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'No users subscribed to reports' });
    }

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const report = await generateWeeklyReport(user.id);
        if (!report) return { email: user.email, success: false, reason: 'No analyses' };

        if (process.env.RESEND_API_KEY) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Pause <noreply@pauseapp.space>',
              to: user.email,
              subject: `Your Weekly Pause Report – ${report.averageRegretScore}% regret probability`,
              html: buildEmailHtml(user.email.split('@')[0], report),
            }),
          });
        }

        return { email: user.email, success: true };
      })
    );

    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Reports sent: ${successes} successful, ${failures} failed`,
    });
  } catch (error) {
    console.error('Weekly report error:', error);
    return NextResponse.json({ error: 'Failed to send reports' }, { status: 500 });
  }
}

async function generateWeeklyReport(userId: string): Promise<WeeklyReport | null> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const { data: thisWeek } = await supabaseAdmin
    .from('saved_analyses')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', weekStart.toISOString())
    .order('created_at', { ascending: false });

  const analyses = (thisWeek as SavedAnalysis[]) || [];
  if (analyses.length === 0) return null;

  const avgScore = Math.round(
    analyses.reduce((sum, a) => sum + a.regret_score, 0) / analyses.length
  );

  const contextCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    contextCounts[a.context] = (contextCounts[a.context] || 0) + 1;
  });
  const topContext = Object.entries(contextCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'email';

  const biasCounts: Record<string, number> = {};
  analyses.forEach((a) => {
    (a.biases || []).forEach((bias) => {
      biasCounts[bias.type] = (biasCounts[bias.type] || 0) + 1;
    });
  });
  const topBias = Object.entries(biasCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'None';

  const daysUsed = new Set(
    analyses.map((a) => a.created_at.split('T')[0])
  );
  let streak = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (daysUsed.has(d.toISOString().split('T')[0])) streak++;
    else break;
  }

  return {
    totalAnalyses: analyses.length,
    averageRegretScore: avgScore,
    mostUsedContext: topContext,
    topBias,
    streak,
  };
}

function buildEmailHtml(name: string, report: WeeklyReport) {
  return `
    <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
      <h2>Your Weekly Pause Report</h2>
      <p>Hi ${name}, here's your communication recap for the past week.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr>
          <td style="padding:12px;background:#f5f5f4;border-radius:8px;text-align:center">
            <p style="font-size:12px;color:#78716c">Analyses</p>
            <p style="font-size:28px;font-weight:700">${report.totalAnalyses}</p>
          </td>
          <td style="padding:12px;background:#f5f5f4;border-radius:8px;text-align:center">
            <p style="font-size:12px;color:#78716c">Avg Score</p>
            <p style="font-size:28px;font-weight:700;color:${report.averageRegretScore < 30 ? '#059669' : report.averageRegretScore < 60 ? '#D97706' : '#DC2626'}">${report.averageRegretScore}%</p>
          </td>
          <td style="padding:12px;background:#f5f5f4;border-radius:8px;text-align:center">
            <p style="font-size:12px;color:#78716c">Streak</p>
            <p style="font-size:28px;font-weight:700">${report.streak} days</p>
          </td>
        </tr>
      </table>
      <p><strong>Most used context:</strong> ${report.mostUsedContext}</p>
      <p><strong>Top bias detected:</strong> ${report.topBias}</p>
      <hr style="border-color:#e7e5e4;margin:24px 0" />
      <a href="https://pauseapp.space" style="display:inline-block;background:#1c1917;color:white;padding:12px 32px;border-radius:12px;text-decoration:none">Open Pause</a>
    </div>
  `;
}
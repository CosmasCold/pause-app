// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { Users, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

interface TeamStats {
  members: { email: string; analyses: number; avgScore: number }[];
  totalAnalyses: number;
  averageRegretScore: number;
  topBiases: { type: string; count: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Check tier
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (!profile || profile.tier !== 'team') {
        toast.error('Team dashboard requires a Team subscription.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/team/analytics');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Could not load analytics.');
      }
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="pt-24 text-center">
          <BarChart3 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
          <p className="text-stone-500 mt-2">Loading analytics...</p>
        </div>
      </>
    );
  }

  if (!stats) {
    return (
      <>
        <Navigation />
        <div className="pt-24 text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-playfair font-bold text-stone-800 mb-2">
            Team Plan Required
          </h2>
          <p className="text-stone-600 mb-6">
            The Team Dashboard is exclusively for teams on the Team subscription.
            Upgrade to unlock analytics for your organization.
          </p>
          <a
            href="/pricing"
            className="inline-block bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600"
          >
            View Plans
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">
          Team Dashboard
        </h1>

        {/* KPI Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/90 rounded-3xl p-6 shadow-xl border border-stone-200"
          >
            <Users className="w-8 h-8 text-teal-500 mb-2" />
            <p className="text-3xl font-bold">{stats.members.length}</p>
            <p className="text-stone-500">Team Members</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 rounded-3xl p-6 shadow-xl border border-stone-200"
          >
            <BarChart3 className="w-8 h-8 text-teal-500 mb-2" />
            <p className="text-3xl font-bold">{stats.totalAnalyses}</p>
            <p className="text-stone-500">Total Analyses</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 rounded-3xl p-6 shadow-xl border border-stone-200"
          >
            <TrendingUp className="w-8 h-8 text-teal-500 mb-2" />
            <p className="text-3xl font-bold">{stats.averageRegretScore}%</p>
            <p className="text-stone-500">Avg. Regret Score</p>
          </motion.div>
        </div>

        {/* Top Biases */}
        {stats.topBiases.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-playfair font-bold text-stone-800 mb-4">
              Most Common Biases
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {stats.topBiases.map((bias, i) => (
                <div key={i} className="bg-white/90 rounded-2xl p-4 border border-stone-200 text-center">
                  <p className="text-lg font-bold text-teal-600">{bias.count}</p>
                  <p className="text-sm text-stone-600">{bias.type}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Member breakdown */}
        <div>
          <h2 className="text-2xl font-playfair font-bold text-stone-800 mb-4">
            Member Activity
          </h2>
          <div className="bg-white/90 rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-4 font-medium text-stone-600">Member</th>
                  <th className="text-left p-4 font-medium text-stone-600">Analyses</th>
                  <th className="text-left p-4 font-medium text-stone-600">Avg. Score</th>
                </tr>
              </thead>
              <tbody>
                {stats.members.map((member, i) => (
                  <tr key={i} className="border-t border-stone-100">
                    <td className="p-4 text-stone-700">{member.email}</td>
                    <td className="p-4 text-stone-700">{member.analyses}</td>
                    <td className="p-4">
                      <span
                        className={
                          member.avgScore < 30
                            ? 'text-teal-600'
                            : member.avgScore < 60
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }
                      >
                        {member.avgScore}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
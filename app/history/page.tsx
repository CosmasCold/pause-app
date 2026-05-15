// app/history/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  Star,
  ChevronDown,
  Download,
  RefreshCw,
  ArrowLeft,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SavedAnalysis {
  id: string;
  original_text: string;
  context: string;
  regret_score: number;
  biases: { type: string; confidence: number; excerpt: string; explanation: string }[];
  emotional_tone: { start: string; middle: string; end: string; shift: string; intensity: string };
  created_at: string;
  is_favorite: boolean;
}

interface Trends {
  days7: { averageScore: number; count: number };
  days30: { averageScore: number; count: number };
  days90: { averageScore: number; count: number };
}

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextFilter, setContextFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string>('free');
  const [trends, setTrends] = useState<Trends | null>(null);
  const [mostImprovedBias, setMostImprovedBias] = useState<{ bias: string; improvementPercent: number } | null>(null);

  const initialized = useRef(false);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch tier
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier')
      .eq('id', user.id)
      .single();
    setUserTier(profile?.tier || 'free');

    // Fetch analyses
    const { data, error } = await supabase
      .from('saved_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setAnalyses(data);
    if (error) toast.error('Failed to load history');

    // Fetch trends if Pro/Team
    if (profile?.tier === 'pro' || profile?.tier === 'team') {
      try {
        const trendRes = await fetch('/api/trends');
        if (trendRes.ok) {
          const trendData = await trendRes.json();
          setTrends(trendData.trends);
          setMostImprovedBias(trendData.mostImprovedBias);
        }
      } catch {
        // silently fail trends
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchHistory();
    }
  }, []);

  // --- All existing handlers (toggleFavorite, deleteAnalysis, exportHistory, downloadPDF) remain unchanged ---
  const toggleFavorite = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('saved_analyses')
      .update({ is_favorite: !current })
      .eq('id', id);
    if (!error) {
      setAnalyses(prev => prev.map(a => (a.id === id ? { ...a, is_favorite: !current } : a)));
      toast.success(current ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase
      .from('saved_analyses')
      .delete()
      .eq('id', id);
    if (!error) {
      setAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success('Deleted');
    }
  };

  const exportHistory = () => {
    const csv = [
      ['Date', 'Context', 'Regret Score', 'Biases', 'Text Preview'],
      ...filteredAnalyses.map(a => [
        new Date(a.created_at).toLocaleDateString(),
        a.context,
        a.regret_score,
        a.biases?.map(b => b.type).join('; '),
        `"${a.original_text.substring(0, 100)}"`,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pause-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('History exported!');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Pause - Analysis History', 14, 20);
    doc.setFontSize(10);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 28);
    const tableData = filteredAnalyses.map((a) => [
      new Date(a.created_at).toLocaleDateString(),
      a.context,
      `${a.regret_score}%`,
      a.biases?.map(b => b.type).join(', '),
      a.original_text.substring(0, 80) + '...',
    ]);
    autoTable(doc, {
      startY: 35,
      head: [['Date', 'Context', 'Regret', 'Biases', 'Excerpt']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 148, 136] },
    });
    doc.save(`pause-history-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredAnalyses = analyses
    .filter(a => {
      const matchesSearch = a.original_text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesContext = contextFilter === 'all' || a.context === contextFilter;
      return matchesSearch && matchesContext;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return a.regret_score - b.regret_score;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const scoreColor = (score: number) =>
    score < 30 ? 'text-teal-600' : score < 60 ? 'text-amber-600' : 'text-red-600';

  const isPaid = userTier === 'pro' || userTier === 'team';

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <button onClick={() => router.push('/')} className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Analyzer</span>
      </button>

      <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">History</h1>

      {/* ====== Progress Section (Pro only) ====== */}
      {isPaid && trends && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50">
          <h2 className="text-xl font-playfair font-bold text-stone-800 mb-6">Your Progress</h2>

          {/* Trend numbers */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: '7 Days', data: trends.days7 },
              { label: '30 Days', data: trends.days30 },
              { label: '90 Days', data: trends.days90 },
            ].map(({ label, data }) => (
              <div key={label} className="text-center p-4 bg-stone-50 rounded-2xl">
                <p className="text-xs text-stone-500 mb-1">{label}</p>
                <p className={`text-2xl font-bold ${data.averageScore < 30 ? 'text-teal-600' : data.averageScore < 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {data.averageScore}%
                </p>
                <p className="text-xs text-stone-400 mt-1">{data.count} analyses</p>
              </div>
            ))}
          </div>

          {/* Most improved bias */}
          {mostImprovedBias && (
            <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-2xl">
              <TrendingDown className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-teal-800">
                  Most improved bias: <strong>{mostImprovedBias.bias}</strong>
                </p>
                <p className="text-xs text-teal-600">
                  Down {mostImprovedBias.improvementPercent}% in the last 30 days
                </p>
              </div>
            </div>
          )}

          {!mostImprovedBias && trends.days30.count > 0 && (
            <p className="text-sm text-stone-500 text-center">Keep analyzing to see your bias improvement.</p>
          )}
        </motion.div>
      )}

      {/* ====== Upgrade prompt for free users ====== */}
      {!isPaid && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50 text-center">
          <TrendingUp className="w-8 h-8 text-teal-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-stone-800 mb-2">Track your progress over time</h3>
          <p className="text-stone-600 text-sm mb-4">
            Upgrade to Pro to see your regret score trend, most improved bias, and detailed communication patterns.
          </p>
          <Link href="/pricing" className="inline-block bg-teal-500 text-white px-5 py-2.5 rounded-2xl font-medium hover:bg-teal-600 transition-colors text-sm">
            Upgrade to Pro
          </Link>
        </motion.div>
      )}

      {/* ====== Existing header with export buttons ====== */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <p className="text-stone-600">{analyses.length} analyses saved</p>
        </div>
        <div className="flex gap-3">
          {isPaid && (
            <>
              <button onClick={downloadPDF} className="flex items-center gap-2 px-4 py-2.5 bg-white/80 rounded-2xl border border-stone-300/50 hover:bg-white transition-colors text-stone-700">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={exportHistory} className="flex items-center gap-2 px-4 py-2.5 bg-white/80 rounded-2xl border border-stone-300/50 hover:bg-white transition-colors text-stone-700">
                <Download className="w-4 h-4" /> CSV
              </button>
            </>
          )}
          <button onClick={fetchHistory} className="p-2.5 bg-white/80 rounded-2xl border border-stone-300/50 hover:bg-white transition-colors">
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="text" placeholder="Search analyses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 transition-colors text-stone-700" />
        </div>
        <select value={contextFilter} onChange={e => setContextFilter(e.target.value)} className="px-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 text-stone-700">
          <option value="all">All Contexts</option>
          <option value="email">Email</option>
          <option value="message">Message</option>
          <option value="social">Social</option>
          <option value="journal">Journal</option>
          <option value="essay">Essay</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'score')} className="px-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 text-stone-700">
          <option value="date">Newest First</option>
          <option value="score">Lowest Score</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600" />
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-stone-500 text-lg">No analyses found. Start analyzing some text!</p>
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:text-teal-700 font-medium">Go to analyzer →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map(analysis => (
            <motion.div key={analysis.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 rounded-2xl border border-stone-300/50 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-teal-50 text-teal-700">{analysis.context}</span>
                    <span className="text-sm text-stone-500">{new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleFavorite(analysis.id, analysis.is_favorite)} className={`p-1.5 rounded-lg transition-colors ${analysis.is_favorite ? 'text-amber-500 bg-amber-50' : 'text-stone-400 hover:text-amber-500'}`}>
                      <Star className="w-4 h-4" fill={analysis.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => deleteAnalysis(analysis.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-stone-700 mb-3 line-clamp-2">{analysis.original_text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${scoreColor(analysis.regret_score)}`}>{analysis.regret_score}%</span>
                    <span className="text-stone-500 text-sm">regret</span>
                  </div>
                  <button onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)} className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium">
                    Details <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === analysis.id ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
              {expandedId === analysis.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-stone-200/50 px-6 py-4 space-y-3">
                  {analysis.biases?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2">Biases</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.biases.map((bias, i) => (
                          <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">{bias.type}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.emotional_tone && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2">Tone</h4>
                      <div className="flex gap-3 text-sm text-stone-600">
                        <span>Start: <strong className="capitalize">{analysis.emotional_tone.start}</strong></span>
                        <span>End: <strong className="capitalize">{analysis.emotional_tone.end}</strong></span>
                        <span>Intensity: <strong className="capitalize">{analysis.emotional_tone.intensity}</strong></span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}
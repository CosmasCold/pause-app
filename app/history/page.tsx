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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [contextFilter, setContextFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const initialized = useRef(false);

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('saved_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setAnalyses(data);
    if (error) toast.error('Failed to load history');
    setLoading(false);
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchHistory();
    }
  }, []);

  const toggleFavorite = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('saved_analyses')
      .update({ is_favorite: !current })
      .eq('id', id);

    if (!error) {
      setAnalyses(prev =>
        prev.map(a => (a.id === id ? { ...a, is_favorite: !current } : a))
      );
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
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pause-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('History exported!');
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

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Analyzer</span>
      </button>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-2">History</h1>
          <p className="text-stone-600">{analyses.length} analyses saved</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportHistory}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 rounded-2xl border border-stone-300/50 hover:bg-white transition-colors text-stone-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={fetchHistory}
            className="p-2.5 bg-white/80 rounded-2xl border border-stone-300/50 hover:bg-white transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-stone-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 transition-colors text-stone-700"
          />
        </div>

        <select
          value={contextFilter}
          onChange={e => setContextFilter(e.target.value)}
          className="px-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 text-stone-700"
        >
          <option value="all">All Contexts</option>
          <option value="email">Email</option>
          <option value="message">Message</option>
          <option value="social">Social</option>
          <option value="journal">Journal</option>
          <option value="essay">Essay</option>
        </select>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'date' | 'score')}
          className="px-4 py-3 bg-white/80 rounded-2xl border border-stone-300/50 focus:outline-none focus:border-teal-500 text-stone-700"
        >
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
          <Link href="/" className="mt-4 inline-block text-teal-600 hover:text-teal-700 font-medium">
            Go to analyzer →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map(analysis => (
            <motion.div
              key={analysis.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 rounded-2xl border border-stone-300/50 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-teal-50 text-teal-700">
                      {analysis.context}
                    </span>
                    <span className="text-sm text-stone-500">
                      {new Date(analysis.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFavorite(analysis.id, analysis.is_favorite)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        analysis.is_favorite
                          ? 'text-amber-500 bg-amber-50'
                          : 'text-stone-400 hover:text-amber-500'
                      }`}
                    >
                      <Star className="w-4 h-4" fill={analysis.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => deleteAnalysis(analysis.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-stone-700 mb-3 line-clamp-2">{analysis.original_text}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${scoreColor(analysis.regret_score)}`}>
                      {analysis.regret_score}%
                    </span>
                    <span className="text-stone-500 text-sm">regret</span>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedId(expandedId === analysis.id ? null : analysis.id)
                    }
                    className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors text-sm font-medium"
                  >
                    Details
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedId === analysis.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {expandedId === analysis.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-stone-200/50 px-6 py-4 space-y-3"
                >
                  {analysis.biases?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2">Biases</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.biases.map((bias, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                          >
                            {bias.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.emotional_tone && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2">Tone</h4>
                      <div className="flex gap-3 text-sm text-stone-600">
                        <span>
                          Start: <strong className="capitalize">{analysis.emotional_tone.start}</strong>
                        </span>
                        <span>
                          End: <strong className="capitalize">{analysis.emotional_tone.end}</strong>
                        </span>
                        <span>
                          Intensity: <strong className="capitalize">{analysis.emotional_tone.intensity}</strong>
                        </span>
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
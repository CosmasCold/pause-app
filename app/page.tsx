// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  Eye,
  RefreshCw,
  ChevronRight,
  Shield,
  Zap,
  Users,
  Share2,
  Check,
  Save,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeText } from '@/lib/analyzer';
import { AnalysisResult, WritingContext } from '@/lib/types';
import ShareCard from '@/components/ShareCard';
import { supabase } from '@/lib/supabase';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pause – AI Communication Coach',
  description:
    'Catch cognitive biases and emotional tone before you hit send. Get a regret probability score and rephrasing suggestions in seconds. Free plan available.',
};


export default function Home() {
  const [text, setText] = useState('');
  const [context, setContext] = useState<WritingContext>('email');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'pro' | 'team'>('free');
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [user, setUser] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [showAuth, setShowAuth] = useState(false);

  const FREE_LIMIT = 3;
  const FREE_CHAR_LIMIT = 1000;

  // Listen for auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load user profile on mount (only if user exists)
  useEffect(() => {
  (async () => {
    if (!user) {
      setIsLoadingProfile(false);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('user_profiles')
      .select('tier, analyses_today, last_analysis_date')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      await supabase.from('user_profiles').insert({
        id: user.id,
        email: user.email,
        tier: 'free',
        analyses_today: 0,
        last_analysis_date: today,
      });
      setUserTier('free');
      setAnalysesUsed(0);
    } else {
      setUserTier((data.tier as 'free' | 'pro' | 'team') || 'free');
      if (data.last_analysis_date === today) {
        setAnalysesUsed(data.analyses_today || 0);
      } else {
        setAnalysesUsed(0);
        if ((data.tier || 'free') === 'free') {
          await supabase
            .from('user_profiles')
            .update({ analyses_today: 0, last_analysis_date: today })
            .eq('id', user.id);
        }
      }
    }
    setIsLoadingProfile(false);
  })();
}, [user]);

  const isFree = userTier === 'free';
  const hasReachedLimit = isFree && analysesUsed >= FREE_LIMIT;
  const isOverCharLimit = isFree && text.length > FREE_CHAR_LIMIT;

  const handleAnalyze = async () => {
    if (text.length < 10) {
      toast.error('Please write at least a few sentences to analyze.');
      return;
    }

    if (hasReachedLimit) {
      toast.error(
        'Free plan limit: 3 analyses per day. Upgrade to Pro for unlimited.'
      );
      return;
    }

    if (isOverCharLimit) {
      toast.error(
        `Free plan limit: ${FREE_CHAR_LIMIT} characters. Upgrade to Pro for longer text.`
      );
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeText(text, context);
      setAnalysis(result);
      setShowResults(true);
      setIsSaved(false);
      toast.success('Analysis complete');

      // Increment usage for free users
      if (isFree && user) {
        const today = new Date().toISOString().split('T')[0];
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('analyses_today, last_analysis_date, tier')
          .eq('id', user.id)
          .single();

        let newCount = (profile?.analyses_today || 0) + 1;
        const currentTier = profile?.tier || 'free';

        if (profile && profile.last_analysis_date !== today) {
          newCount = 1;
        }

        setAnalysesUsed(newCount);

        const { error } = await supabase
          .from('user_profiles')
          .upsert(
            {
              id: user.id,
              email: user.email,
              tier: currentTier,
              analyses_today: newCount,
              last_analysis_date: today,
            },
            { onConflict: 'id' }
          );

        if (error) {
          console.error('Failed to save usage:', error);
          setAnalysesUsed(newCount - 1);
          toast.error('Could not save usage. Please try again.');
        }
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Analysis failed. Please try again.';
      toast.error(message);
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRephraseApply = (rephrase: string) => {
    setText(rephrase);
    toast.success('Rephrasing applied!');
  };

  const handleSaveAnalysis = async () => {
    if (!analysis || isSaved) return;
    setIsSaving(true);

// ----- FREE TIER GATE -----
  if (userTier === 'free') {
    toast.error('Upgrade to Pro to save analyses.', {
      duration: 5000,
    });
    setIsSaving(false);
    return;
  }
  // ---- end gate ----

     // ----- NEW: Pro gate -----
  if (userTier !== 'pro' && userTier !== 'team') {
    toast.error('Save to history is a Pro feature. Upgrade to save.');
    setIsSaving(false);
    return;
  }
  // --- end gate ---

    if (!user) {
      toast.error('Sign in to save analyses');
      setIsSaving(false);
      return;
    }

    // Ensure profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      await supabase.from('user_profiles').insert({
        id: user.id,
        email: user.email,
        tier: 'free',
        analyses_today: 0,
        last_analysis_date: new Date().toISOString().split('T')[0],
      });
    }

    const { error } = await supabase.from('saved_analyses').insert({
      user_id: user.id,
      original_text: text,
      context,
      regret_score: analysis.regretScore,
      biases: analysis.biases,
      emotional_tone: analysis.emotionalTone,
      assumptions: analysis.assumptions,
    });

    if (error) {
      console.error('Save error:', error);
      toast.error(`Failed to save: ${error.message || error}`);
    } else {
      setIsSaved(true);
      toast.success('Saved to history!', {
  style: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
});
    }
    setIsSaving(false);
  };

  // ========== LANDING PAGE ==========
  // ========== LANDING PAGE ==========
if (!user) {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl"
        >
          <div className="mb-8 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Pause"
              className="h-20 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="font-playfair text-5xl md:text-7xl font-bold text-stone-800 mb-6">
            Pause before you send.
          </h1>
          <p className="text-lg md:text-xl text-stone-600 mb-10 leading-relaxed">
            Let AI catch cognitive biases, emotional tone, and hidden assumptions in
            your writing — so you never hit send on a message you&apos;ll regret.
          </p>

          <button
            onClick={() => setShowAuth(true)}
            className="bg-teal-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-teal-800 transition-colors shadow-xl shadow-teal-200/40 inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-stone-400 text-sm mt-4">
            No credit card required. Free plan includes 3 analyses per day.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-playfair font-bold text-center text-stone-800 mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✍️</span>
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">1. Write or paste</h3>
              <p className="text-stone-500 text-sm">
                Copy your draft email, Slack message, or tweet into Pause.
              </p>
            </div>
            <div>
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">2. Analyze instantly</h3>
              <p className="text-stone-500 text-sm">
                Our AI scans for biases, tone, and hidden assumptions in seconds.
              </p>
            </div>
            <div>
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-stone-800 mb-2">3. Send with confidence</h3>
              <p className="text-stone-500 text-sm">
                Apply rephrasing suggestions or reflect before you hit send.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* What makes Pause different */}
<section className="max-w-3xl mx-auto px-4 py-12">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35 }}
    className="bg-white/90 rounded-3xl p-8 shadow-lg border border-stone-200"
  >
    <h2 className="text-2xl font-playfair font-bold text-stone-950 mb-6 text-center">
      What makes Pause different
    </h2>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="flex gap-3">
        <span className="text-teal-700 text-lg mt-0.5">🎯</span>
        <div>
          <p className="font-semibold text-stone-800 mb-1">Purpose‑built, not a chatbot</p>
          <p className="text-stone-600 text-sm">
            No prompts, no instructions. Paste your draft and get structured results instantly. Pause knows exactly what to look for.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <span className="text-teal-700 text-lg mt-0.5">📊</span>
        <div>
          <p className="font-semibold text-stone-800 mb-1">Real metrics, not vague advice</p>
          <p className="text-stone-600 text-sm">
            A regret probability score, emotional tone shift detection, and concrete rephrasing suggestions you can send immediately.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <span className="text-teal-700 text-lg mt-0.5">🔒</span>
        <div>
          <p className="font-semibold text-stone-800 mb-1">Private by design</p>
          <p className="text-stone-600 text-sm">
            Your text is never stored unless you save it. No one reads your messages. No data used for training.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <span className="text-teal-700 text-lg mt-0.5">🚀</span>
        <div>
          <p className="font-semibold text-stone-800 mb-1">Free to start, scales with you</p>
          <p className="text-stone-600 text-sm">
            3 free analyses per day. Pro and Team plans unlock unlimited use, history, exports, and progress tracking.
          </p>
        </div>
      </div>
    </div>
  </motion.div>
</section>

      

      {/* Demo / GIF placeholder */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 rounded-3xl p-6 md:p-10 shadow-xl border border-stone-200 text-center"
        >
          <h3 className="text-2xl font-playfair font-bold text-stone-800 mb-4">
            See Pause in action
          </h3>
          <p className="text-stone-600 mb-6 max-w-lg mx-auto">
            Here&apos;s what happens when you paste a heated email into Pause.
            The regret probability, biases, and suggestions appear instantly.
          </p>
          {/* Placeholder for demo GIF or video */}
          <div className="bg-stone-100 rounded-2xl p-10 text-stone-400 text-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/demo.gif" alt="Pause in action" className="w-full h-auto rounded-2xl" />
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
<section className="max-w-4xl mx-auto px-4 py-12">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4 }}
  >
    <h2 className="text-2xl font-playfair font-bold text-center text-stone-950 mb-8">
      What users are saying
    </h2>
    <div className="grid md:grid-cols-2 gap-6">
      <blockquote className="bg-white/90 rounded-3xl p-6 shadow-lg border border-stone-200">
        <p className="text-stone-600 italic mb-4">
          &ldquo;Pause caught a passive‑aggressive tone I didn&rsquo;t even realise I had.
          My draft went from a career‑limiting grenade to a professional email in one click.
          It&rsquo;s like having a communication coach on speed dial.&rdquo;
        </p>
        <cite className="text-stone-500 not-italic text-sm">
          — Maria Q., A very relieved Product Manager
        </cite>
      </blockquote>

      <div className="bg-white/90 rounded-3xl p-6 shadow-lg border border-stone-200 flex flex-col items-center justify-center text-center">
        <p className="text-stone-500 text-sm mb-3">
          Have a story about how Pause saved you from a regrettable message?
        </p>
        <Link
          href="/contact"
          className="text-teal-700 hover:text-teal-700 font-medium text-sm"
        >
          Share your story →
        </Link>
      </div>
    </div>
  </motion.div>
</section>

      {/* Final CTA */}
      <section className="text-center pb-20 px-4">
        <button
          onClick={() => setShowAuth(true)}
          className="bg-teal-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:bg-teal-600 transition-colors shadow-xl shadow-teal-200/40 inline-flex items-center gap-2"
        >
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </button>
      </section>

      {/* Auth modal */}
      {showAuth && (
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      )}
    </main>
  );
}

  // ========== MAIN APP (signed in) ==========
  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="font-playfair text-6xl font-bold text-stone-800 mb-6">
          Pause before you send.
        </h1>
        <p className="text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
          The space between feeling and sending. Check your writing for
          emotional tone, cognitive biases, and hidden assumptions.
        </p>
      </motion.div>

      {/* Context Selector */}
      <div className="flex gap-3 mb-8 justify-center flex-wrap">
        {(
          ['email', 'message', 'social', 'journal', 'essay'] as WritingContext[]
        ).map((ctx) => (
          <button
            key={ctx}
            onClick={() => setContext(ctx)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
              context === ctx
                ? 'bg-teal-700 text-white shadow-lg shadow-teal-200/50'
                : 'bg-white/80 text-stone-600 hover:bg-white border border-stone-300/60'
            }`}
          >
            {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Input Area */}
      <motion.div
        layout
        className="bg-white/90 rounded-3xl shadow-xl shadow-stone-300/40 border border-stone-300/50 p-8 mb-8"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={getPlaceholder(context)}
          disabled={isAnalyzing}
          className={`w-full h-48 text-lg text-stone-700 placeholder-stone-400 resize-none focus:outline-none leading-relaxed bg-transparent ${
            isAnalyzing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-stone-300/50">
          <div className="flex flex-col items-start gap-1">
            <div
              className={`text-sm font-medium ${
                isFree && text.length > FREE_CHAR_LIMIT
                  ? 'text-red-500'
                  : 'text-stone-500'
              }`}
            >
              {text.length} / {isFree ? FREE_CHAR_LIMIT : '∞'} characters
            </div>
            {isFree && !isLoadingProfile && (
              <div className="text-xs text-stone-400">
                {FREE_LIMIT - analysesUsed} / {FREE_LIMIT} analyses remaining
                today
              </div>
            )}
          </div>

          <motion.button
            whileHover={
              isAnalyzing || hasReachedLimit || isOverCharLimit
                ? {}
                : { scale: 1.02 }
            }
            whileTap={
              isAnalyzing || hasReachedLimit || isOverCharLimit
                ? {}
                : { scale: 0.98 }
            }
            onClick={handleAnalyze}
            disabled={isAnalyzing || hasReachedLimit || isOverCharLimit}
            className={`relative px-8 py-3.5 rounded-2xl font-medium flex items-center gap-2 transition-all duration-200 ${
              isAnalyzing
                ? 'bg-teal-400 text-white shadow-lg shadow-teal-200/40 cursor-wait'
                : hasReachedLimit || isOverCharLimit
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-teal-500 text-white hover:bg-teal-800 shadow-lg shadow-teal-200/30'
            } disabled:opacity-100`}
          >
            {isAnalyzing && (
              <span className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
            )}
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Analyze Text
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>

        {isFree && hasReachedLimit && (
          <p className="mt-3 text-sm text-amber-600">
            You&apos;ve used all free analyses today.{' '}
            <a href="/pricing" className="underline font-medium">
              Upgrade to Pro
            </a>{' '}
            for unlimited analyses.
          </p>
        )}
        {isFree && isOverCharLimit && (
          <p className="mt-3 text-sm text-red-500">
            Text exceeds the {FREE_CHAR_LIMIT}-character free limit.{' '}
            <a href="/pricing" className="underline font-medium">
              Upgrade to Pro
            </a>{' '}
            for unlimited length.
          </p>
        )}
      </motion.div>

      {/* Results Section */}
      <AnimatePresence>
        {showResults && analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6"
          >
            {/* Regret Score */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/90 rounded-3xl p-8 shadow-xl shadow-stone-300/40 border border-stone-300/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-playfair font-bold text-stone-800">
                  Regret Probability
                </h3>
                <div
                  className="text-4xl font-bold font-playfair"
                  style={{ color: getScoreColor(analysis.regretScore) }}
                >
                  {analysis.regretScore}%
                </div>
              </div>

              <div className="w-full bg-stone-300/50 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.regretScore}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: getScoreColor(analysis.regretScore),
                  }}
                />
              </div>

              <p className="mt-4 text-stone-600">
                {getScoreMessage(analysis.regretScore)}
              </p>

{/* Share prompt for high regret */}
{analysis.regretScore >= 60 && (
  <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
    <p className="text-sm text-amber-800 font-medium">
      This message scored {analysis.regretScore}% regret probability. Share this result?
    </p>
  </div>
)}

              <div className="flex gap-4 mt-4">
  <button
    onClick={() => setShowShare(true)}
    className="flex items-center gap-2 text-teal-700 hover:text-teal-700 transition-colors font-medium text-sm"
  >
    <Share2 className="w-4 h-4" />
    Share
  </button>

  <button
    onClick={handleSaveAnalysis}
    disabled={isSaving || isSaved}
    className={`flex items-center gap-2 text-sm font-medium transition-colors ${
      isSaved
        ? 'text-teal-500 cursor-default'
        : 'text-teal-700 hover:text-teal-700'
    }`}
  >
    {isSaving ? (
      <>
        <RefreshCw className="w-4 h-4 animate-spin" />
        Saving...
      </>
    ) : isSaved ? (
      <>
        <Check className="w-4 h-4" />
        Saved
      </>
    ) : (
      <>
        <Save className="w-4 h-4" />
        Save to History
      </>
    )}
  </button>
</div>
            </motion.div>

            {/* Emotional Tone */}
            <ResultsCard
              icon={<Heart className="w-5 h-5" />}
              title="Emotional Tone"
            >
              <div className="grid grid-cols-3 gap-4">
                <ToneIndicator
                  label="Opening"
                  tone={analysis.emotionalTone.start}
                />
                <ToneIndicator
                  label="Middle"
                  tone={analysis.emotionalTone.middle}
                />
                <ToneIndicator
                  label="Closing"
                  tone={analysis.emotionalTone.end}
                />
              </div>
              {analysis.emotionalTone.shift !== 'stable' && (
                <div className="mt-4 p-4 bg-amber-50/80 rounded-2xl text-amber-800">
                  Tone shift detected:{' '}
                  {analysis.emotionalTone.shift.replace(/-/g, ' → ')}
                </div>
              )}
            </ResultsCard>

            {/* Cognitive Biases */}
            <ResultsCard
              icon={<Brain className="w-5 h-5" />}
              title="Cognitive Biases Detected"
            >
              {analysis.biases.length === 0 ? (
                <p className="text-stone-600">
                  No significant cognitive biases detected. Great job!
                </p>
              ) : (
                <div className="space-y-4">
                  {analysis.biases.map((bias, i) => (
                    <div key={i} className="p-4 bg-stone-100/80 rounded-2xl">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-stone-800">
                          {bias.type}
                        </h4>
                        <span className="text-sm text-stone-500">
                          {Math.round(bias.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mb-2 break-words line-clamp-2">
                        &ldquo;{bias.excerpt}&rdquo;
                      </p>
                      <p className="text-xs text-stone-500">
                        {bias.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ResultsCard>

            {/* Assumptions */}
            <ResultsCard
              icon={<Eye className="w-5 h-5" />}
              title="Assumptions About Others"
            >
              {analysis.assumptions.length === 0 ? (
                <p className="text-stone-600">
                  No assumptions detected in your writing.
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.assumptions.map((assumption, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-purple-50/80 rounded-xl"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <p className="text-sm text-purple-900">
                        &ldquo;{assumption.text}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ResultsCard>

            {/* Suggested Rephrases */}
            {analysis.suggestedRephrases.length > 0 && (
              <ResultsCard
                icon={<RefreshCw className="w-5 h-5" />}
                title="Suggested Rephrasing"
              >
                <div className="space-y-3">
                  {analysis.suggestedRephrases.map((rephrase, i) => (
                    <button
                      key={i}
                      onClick={() => handleRephraseApply(rephrase)}
                      className="w-full text-left p-4 bg-teal-50/80 rounded-2xl hover:bg-teal-100/80 transition-colors group"
                    >
                      <p className="text-teal-800 font-medium mb-1">
                        Rewrite {i + 1}:
                      </p>
                      <p className="text-stone-700">
                        &ldquo;{rephrase}&rdquo;
                      </p>
                      <p className="text-xs text-teal-700 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        Click to apply &rarr;
                      </p>
                    </button>
                  ))}
                </div>
              </ResultsCard>
            )}

            {/* Reflective Question */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-teal-50/80 to-emerald-50/80 rounded-3xl p-8 border border-teal-200/50"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">💭</div>
                <div>
                  <p className="text-sm text-teal-700 mb-2 font-medium">
                    A moment of reflection
                  </p>
                  <p className="text-xl font-playfair text-teal-900 italic">
                    &ldquo;{analysis.reflectiveQuestion}&rdquo;
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      {!showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mt-16"
        >
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Private &amp; Secure"
            description="Your text is processed locally where possible and never stored."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Instant Analysis"
            description="Get results in seconds with our optimized AI pipeline."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Better Relationships"
            description="Users report 40% fewer regretted messages after using Pause."
          />
        </motion.div>
      )}

      {/* Share Modal */}
      {analysis && (
        <ShareCard
          isOpen={showShare}
          onClose={() => setShowShare(false)}
          regretScore={analysis.regretScore}
          biasesDetected={analysis.biases.length}
          context={context}
          textPreview={text}
        />
      )}
    </main>
  );
}

// ---------- Helper Components ----------

function ResultsCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 rounded-3xl p-8 shadow-xl shadow-stone-300/40 border border-stone-300/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="text-teal-700">{icon}</div>
        <h3 className="text-xl font-playfair font-bold text-stone-800">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function ToneIndicator({ label, tone }: { label: string; tone: string }) {
  const capitalizeTone = (t: string) => {
    const map: Record<string, string> = {
      neutral: 'Neutral',
      concerned: 'Concerned',
      frustrated: 'Frustrated',
      angry: 'Angry',
      appreciative: 'Appreciative',
      professional: 'Professional',
      mixed: 'Mixed',
      sad: 'Sad',
    };
    return map[t] || t.charAt(0).toUpperCase() + t.slice(1);
  };

  return (
    <div className="text-center p-4 bg-stone-100/80 rounded-2xl">
      <p className="text-xs text-stone-500 mb-2 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-stone-700">{capitalizeTone(tone)}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 bg-white/80 rounded-3xl border border-stone-300/50 hover:shadow-lg hover:shadow-stone-300/30 transition-shadow">
      <div className="text-teal-700 mb-4">{icon}</div>
      <h3 className="font-semibold text-stone-700 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ---------- Utility Functions ----------

function getPlaceholder(context: WritingContext): string {
  const placeholders: Record<WritingContext, string> = {
    email:
      "Dear team, I wanted to address the concerns raised in yesterday's meeting...",
    message: "Hey, I've been thinking about what you said earlier...",
    social: "Can't believe how some people just don't get it...",
    journal: 'Today I felt overwhelmed because...',
    essay: 'The fundamental issue with this approach is...',
  };
  return placeholders[context];
}

function getScoreColor(score: number): string {
  if (score < 30) return '#059669';
  if (score < 60) return '#d97706';
  return '#dc2626';
}

function getScoreMessage(score: number): string {
  if (score < 30)
    return 'This message looks well-balanced and thoughtful. You are in a good headspace.';
  if (score < 60)
    return 'There are some elements that might be worth reconsidering before sending.';
  return 'This message carries significant emotional weight. Consider waiting 24 hours before sending.';
}
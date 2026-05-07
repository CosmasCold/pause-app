// app/page.tsx
'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeText } from '@/lib/analyzer';
import { AnalysisResult, WritingContext } from '@/lib/types';
import ShareCard from '@/components/ShareCard';

export default function Home() {
  const [text, setText] = useState('');
  const [context, setContext] = useState<WritingContext>('email');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleAnalyze = async () => {
    if (text.length < 10) {
      toast.error('Please write at least a few sentences to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeText(text, context);
      setAnalysis(result);
      setShowResults(true);
      toast.success('Analysis complete');
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="font-playfair text-6xl font-bold text-stone-700 mb-6">
          Pause before you send.
        </h1>
        <p className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed">
          The space between feeling and sending. Check your writing for
          emotional tone, cognitive biases, and hidden assumptions.
        </p>
      </motion.div>

      {/* Context Selector */}
      <div className="flex gap-3 mb-8 justify-center flex-wrap">
        {(['email', 'message', 'social', 'journal', 'essay'] as WritingContext[]).map(
          (ctx) => (
            <button
              key={ctx}
              onClick={() => setContext(ctx)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                context === ctx
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-200/50'
                  : 'bg-white/80 text-stone-500 hover:bg-white border border-stone-200/60'
              }`}
            >
              {ctx.charAt(0).toUpperCase() + ctx.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Main Input Area */}
      <motion.div
        layout
        className="bg-white/90 rounded-3xl shadow-xl shadow-stone-200/40 border border-stone-200/50 p-8 mb-8 backdrop-blur-sm"
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={getPlaceholder(context)}
          disabled={isAnalyzing}
          className={`w-full h-48 text-lg text-stone-600 placeholder-stone-400 resize-none focus:outline-none leading-relaxed bg-transparent ${
            isAnalyzing ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        />

        <div className="flex justify-between items-center mt-6 pt-6 border-t border-stone-200/50">
          <div className="text-sm text-stone-400">
            {isAnalyzing ? 'Analyzing your text…' : `${text.length} characters`}
          </div>

          <motion.button
            whileHover={isAnalyzing ? {} : { scale: 1.02 }}
            whileTap={isAnalyzing ? {} : { scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className={`relative px-8 py-3.5 rounded-2xl font-medium flex items-center gap-2 transition-all duration-200 ${
              isAnalyzing
                ? 'bg-teal-400 text-white shadow-lg shadow-teal-200/40 cursor-wait'
                : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-200/30'
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
              className="bg-white/90 rounded-3xl p-8 shadow-xl shadow-stone-200/40 border border-stone-200/50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-playfair font-bold text-stone-700">
                  Regret Probability
                </h3>
                <div
                  className="text-4xl font-bold font-playfair"
                  style={{ color: getScoreColor(analysis.regretScore) }}
                >
                  {analysis.regretScore}%
                </div>
              </div>

              <div className="w-full bg-stone-200/50 rounded-full h-3">
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

              <p className="mt-4 text-stone-500">
                {getScoreMessage(analysis.regretScore)}
              </p>

              <button
                onClick={() => setShowShare(true)}
                className="mt-4 flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share your Pause
              </button>
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
                <div className="mt-4 p-4 bg-amber-50/80 rounded-2xl text-amber-700">
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
                <p className="text-stone-500">
                  No significant cognitive biases detected. Great job!
                </p>
              ) : (
                <div className="space-y-4">
                  {analysis.biases.map((bias, i) => (
                    <div key={i} className="p-4 bg-stone-50/80 rounded-2xl">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-stone-700">
                          {bias.type}
                        </h4>
                        <span className="text-sm text-stone-400">
                          {Math.round(bias.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-stone-500 mb-2">
                        &ldquo;{bias.excerpt}&rdquo;
                      </p>
                      <p className="text-xs text-stone-400">
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
                <p className="text-stone-500">
                  No assumptions detected in your writing.
                </p>
              ) : (
                <div className="space-y-3">
                  {analysis.assumptions.map((assumption, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-purple-50/80 rounded-xl"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-400" />
                      <p className="text-sm text-purple-800">
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
                      <p className="text-teal-800 mb-1">
                        Rewrite {i + 1}:
                      </p>
                      <p className="text-stone-600">
                        &ldquo;{rephrase}&rdquo;
                      </p>
                      <p className="text-xs text-teal-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
              className="bg-gradient-to-r from-teal-50/80 to-emerald-50/80 rounded-3xl p-8 border border-teal-100/50 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">💭</div>
                <div>
                  <p className="text-sm text-teal-600 mb-2 font-medium">
                    A moment of reflection
                  </p>
                  <p className="text-xl font-playfair text-teal-800 italic">
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

// Helper components
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
      className="bg-white/90 rounded-3xl p-8 shadow-xl shadow-stone-200/40 border border-stone-200/50 backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="text-teal-500">{icon}</div>
        <h3 className="text-xl font-playfair font-bold text-stone-700">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function ToneIndicator({ label, tone }: { label: string; tone: string }) {
  return (
    <div className="text-center p-4 bg-stone-50/80 rounded-2xl">
      <p className="text-xs text-stone-400 mb-2 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-stone-600 capitalize">{tone}</p>
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
    <div className="p-8 bg-white/80 rounded-3xl border border-stone-200/50 hover:shadow-lg hover:shadow-stone-200/30 transition-shadow backdrop-blur-sm">
      <div className="text-teal-500 mb-4">{icon}</div>
      <h3 className="font-semibold text-stone-600 mb-2">{title}</h3>
      <p className="text-stone-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Utility functions
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
  if (score < 30) return '#0d9488';
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
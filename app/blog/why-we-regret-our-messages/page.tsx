import Navigation from '@/components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why We Regret Our Messages – Pause',
  description:
    'Discover the cognitive biases that lead to message regret and how AI‑powered analysis helps you communicate more clearly.',
  openGraph: {
    title: 'Why We Regret Our Messages',
    description:
      'Discover the cognitive biases that lead to message regret and how AI‑powered analysis helps you communicate more clearly.',
    images: [{ url: '/logo.png', width: 512, height: 512 }],
  },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm mb-8 transition-colors"
          >
            ← Back to Insights
          </Link>

          {/* Article header */}
          <header className="mb-10">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              Why We Regret Our Messages (and How AI Can Help You Stop)
            </h1>
            <p className="text-stone-500 text-sm">May 1, 2026</p>
          </header>

          {/* Article content – nicely styled prose */}
          <div className="prose prose-lg prose-stone max-w-none
            prose-headings:font-playfair prose-headings:text-stone-800 prose-headings:mt-10 prose-headings:mb-4
            prose-p:text-stone-600 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-stone-800
            prose-li:text-stone-600 prose-li:leading-relaxed
            prose-blockquote:border-l-teal-500 prose-blockquote:bg-teal-50/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:text-stone-600
            prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
            prose-ul:my-6 prose-ol:my-6
          ">
            <h2>The 3‑Second Email That Haunts You</h2>
            <p>
              We’ve all been there. You fire off a quick reply, and moments later your stomach drops.
              “Did I really say that?” The regret is immediate—and with email, there’s no
              undo button. But why does it happen so often? The answer lies in the way our brains process
              emotions and language under pressure.
            </p>

            <h2>Cognitive Biases at Play</h2>
            <p>Psychologists have identified several biases that sabotage our digital communication:</p>
            <ul>
              <li>
                <strong>Emotional reasoning</strong> – “I feel angry, therefore you must have done
                something wrong.” This bias convinces us that our emotions are objective facts, leading
                to accusatory language.
              </li>
              <li>
                <strong>All‑or‑nothing thinking</strong> – “You <em>always</em> ignore my
                ideas.” Absolute words like “always,” “never,” and “everyone” rarely reflect reality
                and immediately put the recipient on the defensive.
              </li>
              <li>
                <strong>Mind reading</strong> – “You’re clearly trying to undermine me.” When we assume
                we know what someone else is thinking, we respond to a story in our head rather than the
                actual person.
              </li>
              <li>
                <strong>Labeling</strong> – reducing a complex person to a single negative word, like
                “incompetent” or “toxic.” Labels are personal attacks that shut down any chance of
                productive dialogue.
              </li>
              <li>
                <strong>Catastrophizing</strong> – “If this project fails, we’ll lose the client and
                the whole company will collapse.” This amplifies anxiety and makes level‑headed
                communication nearly impossible.
              </li>
            </ul>
            <p>
              These shortcuts evolved to help us make quick decisions, but they wreak havoc in written
              form, where tone and context are easily lost.
            </p>

            <h2>How AI Can Break the Cycle</h2>
            <p>
              Pause uses a large language model to scan your draft for exactly these patterns. It flags
              phrases that carry emotional charge, assumptions about others’ intentions, and
              all‑or‑nothing language. Most importantly, it gives you{' '}
              <strong>specific, actionable rephrasing suggestions</strong> that preserve your message’s
              intent without the unnecessary conflict.
            </p>
            <p>
              Instead of “You never listen to anyone,” Pause might suggest “I feel frustrated when my
              input isn’t acknowledged.” The difference is night and day. The AI doesn’t just criticize
              – it coaches you toward clearer, kinder communication.
            </p>

            <h2>The Regret Probability Score</h2>
            <p>
              Our “Regret Probability” score is calculated from the number and severity of biases
              detected, the emotional intensity of your language, and the context (a Slack message is
              less formal than an email to a client). Users who pause and revise see a 40% drop in
              regretted messages within the first week.
            </p>

            <h2>Practical Tips for Self‑Editing</h2>
            <ol>
              <li><strong>Wait 10 minutes.</strong> Even a short delay gives your brain time to recalibrate.</li>
              <li><strong>Read it aloud.</strong> Your ears will catch what your eyes miss.</li>
              <li>
                <strong>Ask: “What’s my real goal?”</strong> If you want a solution, don’t send a rant.
              </li>
              <li><strong>Use Pause.</strong> Run your draft through the tool to see your blind spots instantly.</li>
            </ol>

            <h2>Start Pausing Today</h2>
            <p>
              Next time you’re about to hit send, copy your draft into Pause. The 10 seconds you spend
              now can save hours of relationship repair later.
            </p>
          </div>

                    <div className="mt-8 bg-stone-50 rounded-2xl p-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">Read next</p>
            <div className="space-y-2">
              <Link href="/blog/how-to-give-feedback-without-sounding-harsh" className="block text-teal-700 hover:text-teal-800 text-sm">
                How to Give Feedback Without Sounding Harsh →
              </Link>
              <Link href="/blog/5-cognitive-biases-that-destroy-relationships" className="block text-teal-700 hover:text-teal-800 text-sm">
                5 Cognitive Biases That Destroy Professional Relationships →
              </Link>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 p-8 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-100 text-center">
            <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
              Ready to stop regretting your messages?
            </h3>
            <p className="text-stone-600 mb-6">
              Try Pause for free — 3 analyses per day, no credit card required.
            </p>
            <Link
              href="/"
              className="inline-block bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200/30"
            >
              Start Analyzing
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
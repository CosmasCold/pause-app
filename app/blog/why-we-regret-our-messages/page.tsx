import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <Link href="/blog" className="text-teal-600 hover:text-teal-700 text-sm mb-6 inline-block">
          ← Back to Insights
        </Link>
        <article>
          <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-4">
            Why We Regret Our Messages (and How AI Can Help You Stop)
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            May 1, 2026
          </p>
          <div className="prose prose-stone max-w-none">
            <h2>The 3‑Second Email That Haunts You</h2>
            <p>
              We&rsquo;ve all been there. You fire off a quick reply, and moments later your stomach drops.
              &ldquo;Did I really say that?&rdquo; The regret is immediate&mdash;and with email, there&rsquo;s no
              undo button. But why does it happen so often? The answer lies in the way our brains process
              emotions and language under pressure.
            </p>
            <h2>Cognitive Biases at Play</h2>
            <p>Psychologists have identified several biases that sabotage our digital communication:</p>
            <ul>
              <li>
                <strong>Emotional reasoning</strong> &ndash; &ldquo;I feel angry, therefore you must have
                done something wrong.&rdquo; This bias convinces us that our emotions are objective facts,
                leading to accusatory language.
              </li>
              <li>
                <strong>All‑or‑nothing thinking</strong> &ndash; &ldquo;You <em>always</em> ignore my
                ideas.&rdquo; Absolute words like &ldquo;always,&rdquo; &ldquo;never,&rdquo; and
                &ldquo;everyone&rdquo; rarely reflect reality and immediately put the recipient on the
                defensive.
              </li>
              <li>
                <strong>Mind reading</strong> &ndash; &ldquo;You&rsquo;re clearly trying to undermine
                me.&rdquo; When we assume we know what someone else is thinking, we respond to a story in
                our head rather than the actual person.
              </li>
              <li>
                <strong>Labeling</strong> &ndash; reducing a complex person to a single negative word, like
                &ldquo;incompetent&rdquo; or &ldquo;toxic.&rdquo; Labels are personal attacks that shut
                down any chance of productive dialogue.
              </li>
              <li>
                <strong>Catastrophizing</strong> &ndash; &ldquo;If this project fails, we&rsquo;ll lose the
                client and the whole company will collapse.&rdquo; This amplifies anxiety and makes
                level‑headed communication nearly impossible.
              </li>
            </ul>
            <p>
              These shortcuts evolved to help us make quick decisions, but they wreak havoc in written
              form, where tone and context are easily lost.
            </p>
            <h2>How AI Can Break the Cycle</h2>
            <p>
              Pause uses a large language model to scan your draft for exactly these patterns. It flags
              phrases that carry emotional charge, assumptions about others&rsquo; intentions, and
              all‑or‑nothing language. Most importantly, it gives you{' '}
              <strong>specific, actionable rephrasing suggestions</strong> that preserve your
              message&rsquo;s intent without the unnecessary conflict.
            </p>
            <p>
              Instead of &ldquo;You never listen to anyone,&rdquo; Pause might suggest &ldquo;I feel
              frustrated when my input isn&rsquo;t acknowledged.&rdquo; The difference is night and day.
              The AI doesn&rsquo;t just criticize &ndash; it coaches you toward clearer, kinder
              communication.
            </p>
            <h2>The Regret Probability Score</h2>
            <p>
              Our &ldquo;Regret Probability&rdquo; score is calculated from the number and severity of
              biases detected, the emotional intensity of your language, and the context (a Slack message
              is less formal than an email to a client). Users who pause and revise see a 40% drop in
              regretted messages within the first week.
            </p>
            <h2>Practical Tips for Self‑Editing</h2>
            <ol>
              <li>
                <strong>Wait 10 minutes.</strong> Even a short delay gives your brain time to recalibrate.
              </li>
              <li>
                <strong>Read it aloud.</strong> Your ears will catch what your eyes miss.
              </li>
              <li>
                <strong>Ask: &ldquo;What&rsquo;s my real goal?&rdquo;</strong> If you want a solution,
                don&rsquo;t send a rant.
              </li>
              <li>
                <strong>Use Pause.</strong> Run your draft through the tool to see your blind spots
                instantly.
              </li>
            </ol>
            <h2>Start Pausing Today</h2>
            <p>
              Next time you&rsquo;re about to hit send, copy your draft into Pause. The 10 seconds you
              spend now can save hours of relationship repair later.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
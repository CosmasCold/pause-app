import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 text-sm mb-8 transition-colors"
          >
            ← Back to Insights
          </Link>

          <header className="mb-10">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              How to Give Feedback Without Sounding Harsh
            </h1>
            <p className="text-stone-500 text-sm">May 18, 2026</p>
          </header>

          <div className="prose prose-lg prose-stone max-w-none
            prose-headings:font-playfair prose-headings:text-stone-800 prose-headings:mt-10 prose-headings:mb-4
            prose-p:text-stone-600 prose-p:leading-relaxed prose-p:mb-5
            prose-a:text-teal-700 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-stone-800
            prose-li:text-stone-600 prose-li:leading-relaxed
            prose-blockquote:border-l-teal-700 prose-blockquote:bg-teal-50/50 prose-blockquote:py-1 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl prose-blockquote:text-stone-600
            prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm
            prose-ul:my-6 prose-ol:my-6
          ">
            <h2>The Problem with Most Feedback</h2>
            <p>
              When you’re frustrated, feedback often comes out sideways. A well‑intentioned suggestion
              like “This isn’t what I expected” can land as “You messed up.” The difference isn’t in
              what you meant — it’s in how the words are received. And the most common culprit? Unintentional
              labelling.
            </p>

            <h2>Labels vs. Behaviours</h2>
            <p>
              A label is a judgment about a person. A behaviour is a description of an action. Labels
              trigger defensiveness. Behaviours invite collaboration. The same criticism, framed as a
              behaviour, lands completely differently.
            </p>

            <div className="bg-stone-50 p-6 rounded-2xl my-8">
              <p className="font-semibold text-stone-800 mb-2">Before (label)</p>
              <p className="text-stone-600 mb-4 italic">
                “You’re so disorganised — this report is a mess.”
              </p>
              <p className="font-semibold text-stone-800 mb-2">After (behaviour)</p>
              <p className="text-stone-600 italic">
                “This report is missing the Q2 numbers and the formatting is off. Can we walk through it together?”
              </p>
            </div>

            <h2>Three Steps to Cleaner Feedback</h2>
            <ol>
              <li>
                <strong>Circle every label.</strong> Read your draft and circle words like “incompetent”,
                “lazy”, “careless”, “unprofessional”, or anything that sounds like a character judgment.
              </li>
              <li>
                <strong>Rewrite as a specific behaviour.</strong> Instead of “You’re so unresponsive,”
                try “I haven’t heard back on the two emails I sent this week.”
              </li>
              <li>
                <strong>End with a question, not a verdict.</strong> Questions invite solutions. Verdicts
                invite silence. “Can we set up a system to avoid this in the future?” is far more
                productive than “Don’t let this happen again.”
              </li>
            </ol>

            <h2>How Pause Helps</h2>
            <p>
              Pause is an AI‑powered communication coach that catches labelling, emotional tone, and
              cognitive biases in your drafts before you hit send. It gives you a regret probability score
              and suggests rephrasing that keeps your message clear without the unintended harshness.
              Free to try — no credit card required.
            </p>
            <p>
              <Link href="/" className="text-teal-700 font-medium">
                Try Pause now →
              </Link>
            </p>
          </div>

          <div className="mt-16 p-8 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-200/50 text-center">
            <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
              Give cleaner feedback in seconds
            </h3>
            <p className="text-stone-600 mb-6">
              Pause catches tone and bias before you send. Free plan includes 3 analyses per day.
            </p>
            <Link
              href="/"
              className="inline-block bg-teal-700 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-800 transition-colors shadow-lg shadow-teal-200/30"
            >
              Try Pause Free
            </Link>
          </div>

          {/* Internal links */}
                    <div className="mt-8 bg-stone-50 rounded-2xl p-6">
            <p className="text-sm font-semibold text-stone-700 mb-3">Read next</p>
            <div className="space-y-2">
              <Link href="/blog/introducing-pause" className="block text-teal-700 hover:text-teal-800 text-sm">
                Introducing Pause: The AI‑Powered Communication Coach →
              </Link>
              <Link href="/blog/why-we-regret-our-messages" className="block text-teal-700 hover:text-teal-800 text-sm">
                Why We Regret Our Messages (and How to Stop) →
              </Link>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Introducing Pause: The AI‑Powered Communication Coach for Your Inbox',
  description:
    'Meet the AI that catches emotional tone, hidden assumptions, and regret‑triggering language before you hit send. Built to make your digital communications clearer, kinder, and more effective.',
  openGraph: {
    title: 'Introducing Pause: The AI‑Powered Communication Coach for Your Inbox',
    description:
      'Meet the AI that catches emotional tone, hidden assumptions, and regret‑triggering language before you hit send. Built to make your digital communications clearer, kinder, and more effective.',
    images: [{ url: '/logo.png', width: 512, height: 512 }],
  },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <article className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm mb-8 transition-colors"
          >
            ← Back to Insights
          </Link>

          <header className="mb-10">
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              Introducing Pause: The AI‑Powered Communication Coach for Your Inbox
            </h1>
            <p className="text-stone-500 text-sm">April 10, 2026</p>
          </header>

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
            <h2>What Is Pause?</h2>
            <p>
              Pause is a communication coach that lives in your browser. You paste a draft email, Slack
              message, or social media post, and within seconds it shows you the emotional tone, the cognitive
              biases present, and—most importantly—concrete suggestions for rephrasing that keep your
              message clear and respectful.
            </p>
            <p>
              Think of it as a second opinion from a therapist, an English professor, and a career coach
              combined—available 24/7 on every device with a modern browser.
            </p>

            <h2>Why We Built It</h2>
            <p>
              We’ve all sent messages we regret. The damage can range from minor embarrassment to losing a
              client or a friendship. Existing tools like spell‑check and grammar check don’t touch tone or
              bias. They’ll tell you that “your stupid” should be “you’re stupid”, but they won’t flag that
              calling someone stupid is a terrible idea. Pause fills that gap.
            </p>
            <p>
              We built Pause because we needed it ourselves. The team behind it has spent years in remote work,
              navigating delicate email threads, and wrestling with the impulse to send angry replies. We
              wanted an objective, non‑judgmental tool that could tell us, “Hey, maybe don’t send that just yet.”
            </p>

            <h2>How It Works</h2>
            <p>
              Pause is powered by a fine‑tuned large language model trained to identify emotional tone and
              cognitive biases in short texts. When you enter a draft, the AI analyzes it in three dimensions:
            </p>
            <ol>
              <li>
                <strong>Emotional Tone</strong> – We break your message into opening, middle, and closing, and
                label each segment (angry, frustrated, appreciative, professional, etc.). If your tone shifts
                from professional to angry, we alert you and highlight the shift.
              </li>
              <li>
                <strong>Cognitive Bias Detection</strong> – We scan for seven common biases: all‑or‑nothing
                thinking, mind reading, catastrophizing, labeling, blaming, emotional reasoning, and
                personalization. Each detected bias comes with an excerpt from your text and a plain‑English
                explanation.
              </li>
              <li>
                <strong>Actionable Suggestions</strong> – This is the heart of Pause. Instead of generic advice
                like “try to be nicer”, we give you a complete rephrasing that preserves your intent while
                removing the aggressive or biased language. You can click any suggestion to instantly apply it
                to your draft, then polish it further if needed.
              </li>
            </ol>
            <p>
              All analysis runs in real time. Free users get 3 analyses per day with a 1,000‑character limit.
              Pro users enjoy unlimited analyses, longer text, saved history, PDF and CSV exports, and weekly
              communication reports delivered straight to their inbox.
            </p>

            <h2>Who Is Pause For?</h2>
            <p>
              Pause is for anyone who writes to other people—and that includes just about every professional on
              the planet. Our early users include:
            </p>
            <ul>
              <li><strong>Managers</strong> giving feedback to direct reports, where word choice can make the difference between motivating and demoralizing.</li>
              <li><strong>Customer support reps</strong> who need to respond to angry tickets without escalating the situation.</li>
              <li><strong>Remote workers</strong> who rely on async messaging and miss out on vocal tone and body language.</li>
              <li><strong>Job seekers</strong> crafting cover letters and negotiation emails.</li>
              <li><strong>Individuals journaling</strong> who want to notice their own thought patterns and cognitive distortions.</li>
            </ul>

            <h2>Privacy First</h2>
            <p>
              Your text is never stored unless you choose to save it. Free‑tier analyses run locally where
              possible; Pro‑tier analyses use a secure server‑side call. No human ever reads your messages. We
              adhere to strict data‑protection principles and do not sell or share any user data.
            </p>

            <h2>Pricing That Scales with You</h2>
            <ul>
              <li><strong>Free:</strong> 3 analyses per day, up to 1,000 characters each. Perfect for occasional use.</li>
              <li><strong>Pro:</strong> $8/month. Unlimited analyses, unlimited text length, saved history, PDF/CSV exports, weekly communication reports, and rephrasing suggestions.</li>
              <li><strong>Team:</strong> $19/month (up to 10 members). Everything in Pro, plus a team analytics dashboard, admin controls, and priority support.</li>
            </ul>

            <h2>Ready to Pause?</h2>
            <p>
              Try it now at{' '}
              <a href="https://pauseapp.space" className="text-teal-600 underline">
                pauseapp.space
              </a>
              . Your relationships—and your future self—will thank you.
            </p>
          </div>

          <div className="mt-16 p-8 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-100 text-center">
            <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
              Start your free trial today
            </h3>
            <p className="text-stone-600 mb-6">
              No credit card required. 3 analyses per day on the free plan.
            </p>
            <Link
              href="/"
              className="inline-block bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200/30"
            >
              Get Started
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
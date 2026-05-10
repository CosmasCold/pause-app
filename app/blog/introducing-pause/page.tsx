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
            Introducing Pause: The AI‑Powered Communication Coach for Your Inbox
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            April 10, 2026
          </p>
          <div className="prose prose-stone max-w-none">
            <h2>What Is Pause?</h2>
            <p>
              Pause is a communication coach that lives in your browser. You paste a draft email, Slack
              message, or social media post, and within seconds it shows you the emotional tone, the
              cognitive biases present, and&mdash;most importantly&mdash;concrete suggestions for
              rephrasing that keep your message clear and respectful.
            </p>
            <p>
              Think of it as a second opinion from a therapist, an English professor, and a career coach
              combined&mdash;available 24/7 on every device with a modern browser.
            </p>
            <h2>Why We Built It</h2>
            <p>
              We&rsquo;ve all sent messages we regret. The damage can range from minor embarrassment to
              losing a client or a friendship. Existing tools like spell‑check and grammar check don&rsquo;t
              touch tone or bias. They&rsquo;ll tell you that &ldquo;your stupid&rdquo; should be
              &ldquo;you&rsquo;re stupid&rdquo;, but they won&rsquo;t flag that calling someone stupid is a
              terrible idea. Pause fills that gap.
            </p>
            <p>
              We built Pause because we needed it ourselves. The team behind it has spent years in remote
              work, navigating delicate email threads, and wrestling with the impulse to send angry replies.
              We wanted an objective, non‑judgmental tool that could tell us, &ldquo;Hey, maybe don&rsquo;t
              send that just yet.&rdquo;
            </p>
            <h2>How It Works</h2>
            <p>
              Pause is powered by a fine‑tuned large language model trained to identify emotional tone and
              cognitive biases in short texts. When you enter a draft, the AI analyzes it in three
              dimensions:
            </p>
            <ol>
              <li>
                <strong>Emotional Tone</strong> &ndash; We break your message into opening, middle, and
                closing, and label each segment (angry, frustrated, appreciative, professional, etc.). If
                your tone shifts from professional to angry, we alert you and highlight the shift.
              </li>
              <li>
                <strong>Cognitive Bias Detection</strong> &ndash; We scan for seven common biases:
                all‑or‑nothing thinking, mind reading, catastrophizing, labeling, blaming, emotional
                reasoning, and personalization. Each detected bias comes with an excerpt from your text and
                a plain‑English explanation.
              </li>
              <li>
                <strong>Actionable Suggestions</strong> &ndash; This is the heart of Pause. Instead of
                generic advice like &ldquo;try to be nicer&rdquo;, we give you a complete rephrasing that
                preserves your intent while removing the aggressive or biased language. You can click any
                suggestion to instantly apply it to your draft, then polish it further if needed.
              </li>
            </ol>
            <p>
              All analysis runs in real time. Free users get 3 analyses per day with a 1,000‑character
              limit. Pro users enjoy unlimited analyses, longer text, saved history, PDF and CSV exports,
              and weekly communication reports delivered straight to their inbox.
            </p>
            <h2>Who Is Pause For?</h2>
            <p>
              Pause is for anyone who writes to other people&mdash;and that includes just about every
              professional on the planet. Our early users include:
            </p>
            <ul>
              <li>
                <strong>Managers</strong> giving feedback to direct reports, where word choice can make the
                difference between motivating and demoralizing.
              </li>
              <li>
                <strong>Customer support reps</strong> who need to respond to angry tickets without
                escalating the situation.
              </li>
              <li>
                <strong>Remote workers</strong> who rely on async messaging and miss out on vocal tone and
                body language.
              </li>
              <li>
                <strong>Job seekers</strong> crafting cover letters and negotiation emails.
              </li>
              <li>
                <strong>Individuals journaling</strong> who want to notice their own thought patterns and
                cognitive distortions.
              </li>
            </ul>
            <h2>Privacy First</h2>
            <p>
              Your text is never stored unless you choose to save it. Free‑tier analyses run locally where
              possible; Pro‑tier analyses use a secure server‑side call. No human ever reads your messages.
              We adhere to strict data‑protection principles and do not sell or share any user data.
            </p>
            <h2>
              Pricing That Scales with You
            </h2>
            <ul>
              <li>
                <strong>Free:</strong> 3 analyses per day, up to 1,000 characters each. Perfect for
                occasional use.
              </li>
              <li>
                <strong>Pro:</strong> $8/month. Unlimited analyses, unlimited text length, saved history,
                PDF/CSV exports, weekly communication reports, and rephrasing suggestions.
              </li>
              <li>
                <strong>Team:</strong> $19/month (up to 10 members). Everything in Pro, plus a team
                analytics dashboard, admin controls, and priority support.
              </li>
            </ul>
            <h2>Ready to Pause?</h2>
            <p>
              Try it now at{' '}
              <a href="https://pauseapp.space" className="text-teal-600 underline">
                pauseapp.space
              </a>
              . Your relationships&mdash;and your future self&mdash;will thank you.
            </p>
          </div>
        </article>
      </main>
    </>
  );
}
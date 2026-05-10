import Navigation from '@/components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '5 Cognitive Biases That Destroy Professional Relationships',
  description:
    'Mind reading, catastrophizing, and all‑or‑nothing thinking are more common in emails than you think. Learn how to spot them and steer your conversations back on track.',
  openGraph: {
    title: '5 Cognitive Biases That Destroy Professional Relationships',
    description:
      'Mind reading, catastrophizing, and all‑or‑nothing thinking are more common in emails than you think. Learn how to spot them and steer your conversations back on track.',
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
              5 Cognitive Biases That Destroy Professional Relationships
            </h1>
            <p className="text-stone-500 text-sm">April 24, 2026</p>
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
            <h2>The Silent Career Killer</h2>
            <p>
              You may be the most skilled person on your team, but if your emails consistently rub people
              the wrong way, your career will hit a ceiling. Research from the Harvard Business Review shows
              that communication style is one of the top three factors in promotion decisions—yet it’s
              rarely taught formally. Cognitive biases are the hidden gremlins that turn a straightforward
              message into a relationship wrecking ball.
            </p>

            <h2>Bias #1: Mind Reading</h2>
            <p><strong>What it is:</strong> Assuming you know what the other person is thinking or feeling. “You’re probably thinking I’m being difficult, but…”</p>
            <p><strong>How it harms:</strong> It puts the recipient on the defensive before they’ve even responded. It also makes you seem insecure because you’re pre‑empting a reaction that may never have existed. Over time, colleagues may avoid collaborating with you because they feel they have to manage your assumptions.</p>
            <p><strong>Fix:</strong> Replace mind‑reading statements with neutral, fact‑based observations. Instead of “You clearly don’t care about this project,” say “I noticed the deadline was missed. Can we discuss what happened?”</p>

            <h2>Bias #2: Catastrophizing</h2>
            <p><strong>What it is:</strong> Jumping to the worst‑case scenario. “If this client leaves, we’ll lose the entire department and I’ll be out of a job.”</p>
            <p><strong>How it harms:</strong> It signals panic and erodes trust in your leadership. Colleagues may start tuning you out or, worse, mirror your anxiety, creating a toxic feedback loop. The actual problem is almost never as dire as the catastrophized version.</p>
            <p><strong>Fix:</strong> Ask yourself, “What’s the most likely outcome?” and “What’s the best step we can take right now?” Focus on actionable solutions rather than hypothetical disasters.</p>

            <h2>Bias #3: All‑or‑Nothing Thinking</h2>
            <p><strong>What it is:</strong> Using absolutes like “always,” “never,” “everyone,” or “no one.” “You <em>never</em> listen to anyone’s ideas.”</p>
            <p><strong>How it harms:</strong> It oversimplifies complex situations and makes you appear unreasonable. One counterexample is enough to break your argument and make you look sloppy. People around you will feel boxed in by your extreme statements.</p>
            <p><strong>Fix:</strong> Replace absolutes with specific, verifiable statements. “You didn’t acknowledge my suggestion in the last three meetings” is more honest and less combative than “You never listen.”</p>

            <h2>Bias #4: Labeling</h2>
            <p><strong>What it is:</strong> Calling someone “incompetent,” “lazy,” or “toxic” instead of describing the specific behavior that bothered you.</p>
            <p><strong>How it harms:</strong> Labels are personal attacks. They provoke defensiveness and escalate conflicts. Once you label a colleague, every future interaction is filtered through that label, making it nearly impossible to rebuild trust.</p>
            <p><strong>Fix:</strong> Describe the behavior and its impact. “When you interrupt me in meetings, I feel my expertise isn’t valued” is far more constructive than “You’re so disrespectful.”</p>

            <h2>Bias #5: Blaming</h2>
            <p><strong>What it is:</strong> “It’s your fault the report was late.” Even if factually true, focusing exclusively on blame rather than solutions damages relationships and prevents learning.</p>
            <p><strong>How it harms:</strong> It creates a culture of fear and finger‑pointing. People become more concerned with covering their tracks than solving problems. You also miss the opportunity to understand systemic issues that led to the mistake.</p>
            <p><strong>Fix:</strong> Focus on the solution and future prevention. “The report was late, which delayed the client presentation. Let’s set up a shared calendar so we can sync better next time.”</p>

            <h2>How to Reframe Your Message</h2>
            <p>
              The key is not to suppress your feelings, but to express them constructively. Pause’s
              rephrasing suggestions are built on decades of conflict‑resolution research. They help you
              shift from accusation to explanation, from labels to behaviors, and from blame to collaboration.
            </p>
            <p>
              Try running a difficult message through Pause before you send it. You’ll be surprised how much
              better the revised version feels—both for you and the recipient.
            </p>
          </div>

          <div className="mt-16 p-8 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl border border-teal-100 text-center">
            <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
              Catch these biases before you hit send
            </h3>
            <p className="text-stone-600 mb-6">
              Pause detects all 5 biases and gives you rephrasing suggestions instantly.
            </p>
            <Link
              href="/"
              className="inline-block bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200/30"
            >
              Try Pause Free
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}
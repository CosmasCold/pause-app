import Navigation from '@/components/Navigation';
import Link from 'next/link';

const faqs = [
  {
    q: 'What does Pause do that ChatGPT can’t?',
    a: 'ChatGPT is a general AI. Pause is purpose‑built for communication. You don’t need to write a prompt or explain what you want. Just paste your draft, click analyze, and you get a regret probability score, emotional tone breakdown, and one‑click rephrasing suggestions in seconds. No generic advice – only complete replacement messages you can send right away.',
  },
  {
    q: 'What is the regret probability score?',
    a: 'It’s a 0‑100% estimate of how likely you are to regret sending your message. The score is calculated from the number and severity of cognitive biases detected, the emotional intensity, and the context (email, Slack, social, etc.). A low score means you’re in a good headspace. A high score is a strong nudge to pause and rewrite.',
  },
  {
    q: 'Is my text stored or read by anyone?',
    a: 'Your text is never stored unless you explicitly choose to save it to your history. Free‑tier analyses run locally where possible. Pro‑tier analyses use a secure server‑side call, but no human ever reads your messages. We don’t use your data to train models.',
  },
  {
    q: 'What are cognitive biases, and why should I care?',
    a: 'Cognitive biases are mental shortcuts your brain takes. In writing, they show up as all‑or‑nothing language (“you always…”, “you never…”), mind reading (“you clearly think…”), labeling, catastrophizing, and more. They make your message feel hostile even when you didn’t intend it. Pause catches them before the recipient does.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. Pro and Team subscriptions can be cancelled from the Settings page. Your plan remains active until the end of the billing period, then you’ll be moved to the free tier. No questions asked.',
  },
  {
    q: 'Is there a team plan?',
    a: 'Yes. The Team plan costs $19/month for up to 10 members. It includes everything in Pro plus a team analytics dashboard, admin controls, and the ability to add or remove members. Only the team owner can manage billing.',
  },
];

export default function FAQPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-950 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-stone-600 mb-10">
          Everything you need to know about Pause. If you don’t find your answer, reach out on our{' '}
          <Link href="/contact" className="text-teal-600 underline">contact page</Link>.
        </p>

        <div className="space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h2 className="text-lg font-semibold text-stone-800 mb-2">{faq.q}</h2>
              <p className="text-stone-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-stone-200 text-sm text-stone-500">
          <Link href="/" className="text-teal-600 hover:text-teal-700">
            ← Back to Pause
          </Link>
        </div>
      </main>
    </>
  );
}
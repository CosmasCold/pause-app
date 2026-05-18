// app/blog/page.tsx
import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Insights – Pause',
  description:
    'Read our latest articles on communication, cognitive biases, and how to write clearer, kinder messages.',
  openGraph: {
    title: 'Insights – Pause',
    description:
      'Read our latest articles on communication, cognitive biases, and how to write clearer, kinder messages.',
    images: [{ url: '/logo.png', width: 512, height: 512 }],
  },
};

const posts = [
  {
    slug: 'how-to-give-feedback-without-sounding-harsh',
    title: 'How to Give Feedback Without Sounding Harsh',
    excerpt:
      'Feedback shouldn’t feel like an attack. Learn how to separate the person from the behaviour so your feedback lands as helpful, not hostile.',
    date: '2026-05-18',
  },
  {
    slug: 'why-we-regret-our-messages',
    title: 'Why We Regret Our Messages (and How to Stop)',
    excerpt:
      'Unchecked emotions and cognitive biases can turn a quick message into a lasting regret. Learn the science behind email rage and how to master your tone.',
    date: '2026-05-01',
  },
  {
    slug: '5-cognitive-biases-that-destroy-relationships',
    title: '5 Cognitive Biases That Destroy Professional Relationships',
    excerpt:
      'Mind reading, catastrophizing, and all‑or‑nothing thinking are more common in emails than you think. Discover how Pause helps you catch them.',
    date: '2026-04-24',
  },
  {
    slug: 'introducing-pause',
    title: 'Introducing Pause: The AI‑Powered Communication Coach',
    excerpt:
      'Meet the AI that catches emotional tone, hidden assumptions, and regret‑triggering language before you hit send.',
    date: '2026-04-10',
  },
];

export default function BlogPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl font-playfair font-bold text-stone-800 mb-10">Insights</h1>
        <div className="space-y-12">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-stone-200 pb-8">
              <h2 className="text-2xl font-semibold text-stone-800 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-teal-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-stone-400 text-sm mb-3">
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-stone-600 leading-relaxed">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-teal-600 hover:text-teal-700 font-medium text-sm mt-3 inline-block"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
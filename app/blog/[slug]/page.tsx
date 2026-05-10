// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

// Inline article data – avoids import issues entirely
const articles = [
  {
    slug: 'why-we-regret-our-messages',
    title: 'Why We Regret Our Messages (and How to Stop)',
    date: '2026-05-01',
    excerpt: '…',
    content: `<h2>The 3‑Second Email That Haunts You</h2><p>…</p>`,
  },
  {
    slug: '5-cognitive-biases-that-destroy-relationships',
    title: '5 Cognitive Biases That Destroy Professional Relationships',
    date: '2026-04-24',
    excerpt: '…',
    content: `<h2>The Silent Career Killer</h2><p>…</p>`,
  },
  {
    slug: 'introducing-pause',
    title: 'Introducing Pause: The AI‑Powered Communication Coach',
    date: '2026-04-10',
    excerpt: '…',
    content: `<h2>What Is Pause?</h2><p>…</p>`,
  },
];

export const dynamic = 'force-static';

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((a) => a.slug === params.slug);
  if (!article) return notFound();

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <Link href="/blog" className="text-teal-600 hover:text-teal-700 text-sm mb-6 inline-block">
          ← Back to Insights
        </Link>
        <article>
          <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-4">{article.title}</h1>
          <p className="text-stone-400 text-sm mb-8">
            {new Date(article.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <div
            className="prose prose-stone max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>
    </>
  );
}
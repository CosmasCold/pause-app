// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { articles, Article } from '../articles';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return articles.map((article: Article) => ({ slug: article.slug }));
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = articles.find((a: Article) => a.slug === params.slug);
  if (!article) return notFound();

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <Link href="/blog" className="text-teal-600 hover:text-teal-700 text-sm mb-6 inline-block">
          ← Back to Insights
        </Link>
        <article>
          <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-4">
            {article.title}
          </h1>
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
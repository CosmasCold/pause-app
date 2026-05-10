// app/blog/page.tsx
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { articles } from './articles';

export const dynamic = 'force-static';

export default function BlogPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl font-playfair font-bold text-stone-800 mb-10">Insights</h1>
        <div className="space-y-12">
          {articles.map((article) => (
            <article key={article.slug} className="border-b border-stone-200 pb-8">
              <h2 className="text-2xl font-semibold text-stone-800 mb-2">
                <Link href={`/blog/${article.slug}`} className="hover:text-teal-600 transition-colors">
                  {article.title}
                </Link>
              </h2>
              <p className="text-stone-400 text-sm mb-3">
                {new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-stone-600 leading-relaxed">{article.excerpt}</p>
              <Link
                href={`/blog/${article.slug}`}
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
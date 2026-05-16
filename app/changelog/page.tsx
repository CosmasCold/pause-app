import Navigation from '@/components/Navigation';
import Link from 'next/link';

const updates = [
  {
    date: '2026-05-15',
    title: 'Revised color palette',
    description:
      'Darker text for better readability, emerald green for low regret scores, and improved card contrast across the entire app.',
  },
  {
    date: '2026-05-15',
    title: 'Progress tracking for Pro users',
    description:
      'Pro and Team users can now see their 7‑day, 30‑day, and 90‑day average regret scores on the History page, plus their most improved bias.',
  },
  {
    date: '2026-05-14',
    title: 'Team trends on the dashboard',
    description:
      'Team owners can now view month‑over‑month regret score changes and the team’s most improved bias directly on the Team Dashboard.',
  },
  {
    date: '2026-05-11',
    title: 'Initial launch',
    description:
      'Pause launched on Product Hunt with free, Pro, and Team plans. Includes AI‑powered bias detection, rephrasing suggestions, and regret probability scores.',
  },
];

export default function ChangelogPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-950 mb-4">What&apos;s new</h1>
        <p className="text-stone-600 mb-10">
          A log of everything we&apos;ve shipped, big and small.
        </p>

        <div className="space-y-10">
          {updates.map((update) => (
            <div key={update.title} className="border-l-4 border-teal-500 pl-4">
              <p className="text-sm text-stone-400">{update.date}</p>
              <h2 className="text-lg font-semibold text-stone-800 mt-1">{update.title}</h2>
              <p className="text-stone-600 mt-1">{update.description}</p>
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
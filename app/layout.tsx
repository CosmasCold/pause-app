import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export const metadata: Metadata = {
  title: 'Pause — The space between feeling and sending',
  description:
    'Check your writing for cognitive biases and emotional tone before you send.',
  openGraph: {
    title: 'Pause — The space between feeling and sending',
    description:
      'Check your writing for cognitive biases and emotional tone before you send.',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="google-site-verification" content="CA6P_Ot-bfagJ0OuImO_OnVuZ6JrQNZx3s6Lj51PSdQ" />
      </head>
      <body
        className="min-h-screen text-stone-700"
        style={{
          background:
            'linear-gradient(160deg, #f2ebd9 0%, #ebe1cc 20%, #dce8e2 50%, #d2e2d9 75%, #c5dbcf 100%)',
        }}
      >
        <Navigation />
        <Toaster position="top-center" />
        <div className="pt-20 min-h-screen">{children}</div>
        <footer className="border-t border-stone-200/60 bg-white/60 backdrop-blur-sm">
  {/* Newsletter signup – appears on every page */}
  <div className="max-w-lg mx-auto px-4 py-12 text-center">
    <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
      Get weekly communication tips
    </h3>
    <p className="text-stone-600 mb-6 text-sm">
      One practical tip every Monday to help you write clearer, kinder messages.
    </p>
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          if (res.ok) {
            // use a simple alert or a toast library
            alert(data.message || 'Subscribed!');
            form.reset();
          } else {
            alert(data.error || 'Something went wrong');
          }
        } catch {
          alert('Network error');
        }
      }}
      className="flex gap-2 justify-center"
    >
      <input
        type="email"
        name="email"
        placeholder="you@example.com"
        required
        className="flex-1 max-w-xs px-4 py-3 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700"
      />
      <button
        type="submit"
        className="bg-teal-500 text-white px-5 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors"
      >
        Subscribe
      </button>
    </form>
    <p className="text-stone-400 text-xs mt-4">No spam. Unsubscribe anytime.</p>
  </div>

  {/* Existing legal links */}
  <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap justify-between items-center text-sm text-stone-500">
    <span>© {new Date().getFullYear()} Pause. All rights reserved.</span>
    <div className="flex gap-6">
      <Link href="/privacy" className="hover:text-stone-700">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-stone-700">Terms of Service</Link>
      <Link href="/contact" className="hover:text-stone-700">Contact</Link>
    </div>
  </div>
</footer>
      </body>
    </html>
  );
}
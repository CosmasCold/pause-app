import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import NewsletterForm from '@/components/NewsletterForm';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';

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
  <NewsletterForm />
  <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap justify-between items-center text-sm text-stone-500">
    <span>© {new Date().getFullYear()} Pause. All rights reserved.</span>
    <div className="flex gap-6">
      <Link href="/changelog" className="hover:text-stone-700">Changelog</Link>
      <Link href="/faq" className="hover:text-stone-700">FAQ</Link>
      <Link href="/privacy" className="hover:text-stone-700">Privacy Policy</Link>
      <Link href="/terms" className="hover:text-stone-700">Terms of Service</Link>
      <Link href="/contact" className="hover:text-stone-700">Contact</Link>
    </div>
  </div>
</footer>
        <Analytics />
      </body>
    </html>
  );
}
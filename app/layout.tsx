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
    'linear-gradient(160deg, #f9f2e7 0%, #f3ead8 20%, #e8dccc 50%, #dce5d4 75%, #c9d9c5 100%)',
}}
      >
        <Navigation />
        <Toaster position="top-center" />
        <div className="pt-20 min-h-screen">{children}</div>
        <footer className="border-t border-stone-200/60 bg-white/60 backdrop-blur-sm">
  <NewsletterForm />
  <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-stone-500">
    {/* Top row: copyright + badges */}
    <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
      <span>© {new Date().getFullYear()} Pause. All rights reserved.</span>
      <a
        href="https://www.saashub.com/the-pause-app?utm_source=badge&utm_campaign=badge&utm_content=the-pause-app&badge_variant=color&badge_kind=approved"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://cdn-b.saashub.com/img/badges/approved-color.png?v=1"
          alt="PauseApp.space badge"
          style={{ maxWidth: '150px' }}
        />
      </a>
      <a
        href="https://startupfa.me/s/pause?utm_source=pauseapp.space"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          src="https://startupfa.me/badges/featured-badge.webp"
          alt="Pause - Featured on Startup Fame"
          width="171"
          height="54"
        />
      </a>
      
      <a href="https://aiagentsdirectory.com/agent/pause-app?utm_source=badge&utm_medium=referral&utm_campaign=free_listing&utm_content=pause-app" target="_blank" rel="noopener noreferrer">
  <img src="https://aiagentsdirectory.com/featured-badge.svg?v=2024" alt="Pause App - Featured AI Agent on AI Agents Directory" width="200" height="50" />
</a>
    </div>

    
    <div className="flex flex-wrap justify-center gap-6">
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
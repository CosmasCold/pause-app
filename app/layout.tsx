import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Navigation from '@/components/Navigation';

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body
        className="min-h-screen text-stone-600"
        style={{
          background:
            'linear-gradient(160deg, #fdf9f0 0%, #f9f0e2 20%, #eef5f2 50%, #e4f0ea 75%, #d8ede4 100%)',
        }}
      >
        <Navigation />
        <Toaster position="top-center" />
        <div className="pt-20">{children}</div>
      </body>
    </html>
  );
}
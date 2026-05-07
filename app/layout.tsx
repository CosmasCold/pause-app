// app/layout.tsx
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: 'Pause — The space between feeling and sending',
  description: 'Check your writing for cognitive biases and emotional tone before you send.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body 
        className="min-h-screen"
        style={{ 
          background: 'linear-gradient(135deg, #fdfcf9 0%, #f8f5f0 25%, #f0f4f2 50%, #edf4f1 75%, #eaf2ef 100%)',
          color: '#44403c'
        }}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
}
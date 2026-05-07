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
        className="min-h-screen text-stone-700"
        style={{ 
          background: 'linear-gradient(135deg, #fefcf8 0%, #fdf8f0 20%, #f2f7f5 50%, #e8f4f0 75%, #dff0eb 100%)' 
        }}
      >
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
}
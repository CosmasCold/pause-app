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
      <body className="min-h-screen text-stone-800" 
        style={{ 
          background: 'linear-gradient(135deg, #fef9ef 0%, #fdf6e8 25%, #faf3e0 50%, #f5ecd7 75%, #efe5cc 100%)' 
        }}>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  )
}
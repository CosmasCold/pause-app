'use client';

import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <h3 className="text-xl font-playfair font-bold text-stone-800 mb-2">
        Get weekly communication tips
      </h3>
      <p className="text-stone-600 mb-6 text-sm">
        One practical tip every Monday to help you write clearer, kinder messages.
      </p>
      {status === 'success' ? (
        <p className="text-emerald-600 font-medium">Thanks for subscribing!</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-wrap gap-2 justify-center items-center"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 min-w-[200px] max-w-xs px-4 py-3 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700 text-sm"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-teal-500 text-white px-5 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {status === 'loading' ? 'Sending...' : 'Subscribe'}
          </button>
        </form>
      )}
      {status === 'error' && (
        <p className="text-red-500 text-sm mt-2">Something went wrong. Try again.</p>
      )}
      <p className="text-stone-400 text-xs mt-4">No spam. Unsubscribe anytime.</p>
    </div>
  );
}
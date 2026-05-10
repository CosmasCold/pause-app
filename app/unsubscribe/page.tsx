// app/unsubscribe/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email) {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setStatus('error');
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setMessage('No email address provided.');
  return;
}

    const doUnsubscribe = async () => {
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'You have been unsubscribed.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Something went wrong.');
        }
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    doUnsubscribe();
  }, [email]);

  return (
    <main className="pt-24 pb-16 px-4 max-w-lg mx-auto text-center">
      {status === 'loading' && (
        <>
          <div className="animate-spin w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full mx-auto mb-4" />
          <p className="text-stone-600">Unsubscribing...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-playfair font-bold text-stone-800 mb-4">
            Unsubscribed
          </h1>
          <p className="text-stone-600">{message}</p>
          <p className="text-stone-500 text-sm mt-4">
            You can always re‑subscribe anytime from our site.
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-playfair font-bold text-stone-800 mb-4">
            Oops
          </h1>
          <p className="text-stone-600">{message}</p>
        </>
      )}
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={<div className="pt-24 text-center">Loading...</div>}>
        <UnsubscribeContent />
      </Suspense>
    </>
  );
}
// app/contact/page.tsx
'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact – Pause',
  description:
    'Get in touch with the founder of Pause, the AI communication coach. Questions, feedback, or support inquiries welcome.',
};

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSending(true);
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Message sent!');
      setForm({ name: '', email: '', message: '' });
    } else {
      toast.error(data.error || 'Failed to send message');
    }
  } catch {
    toast.error('Network error – please try again.');
  } finally {
    setSending(false);
  }
};

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-lg mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-4">Contact Us</h1>
        <p className="text-stone-600 mb-8">
  Questions, feedback, or just want to say hi? We&rsquo;d love to hear from you.
</p>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white/90 rounded-3xl p-6 shadow">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl"
          />
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl"
          />
          <textarea
            placeholder="Your message"
            rows={5}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            required
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full bg-teal-500 text-white py-3 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </main>
    </>
  );
}
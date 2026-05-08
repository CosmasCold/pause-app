// app/auth/reset-password/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
  const hash = window.location.hash;
  if (hash?.includes('access_token')) {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  } else {
    toast.error('Invalid or expired reset link');
    router.push('/');
  }
}, [router]);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Password updated! You are now signed in.');
      router.push('/');
    }
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-100"
      >
        <div className="text-center mb-6">
          <span className="text-4xl">🔒</span>
          <h1 className="text-2xl font-playfair font-bold text-stone-800 mt-4">
            Set new password
          </h1>
          <p className="text-stone-500 mt-2">Choose a strong password.</p>
        </div>
        <div className="relative mb-4">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={handleUpdatePassword}
          disabled={loading}
          className="w-full bg-teal-500 text-white py-3.5 rounded-2xl font-medium hover:bg-teal-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </motion.div>
    </main>
  );
}
// components/AuthModal.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false);

  const handleMagicLink = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
  console.error('Magic link error:', error);
  toast.error(`Failed: ${error.message}`);
} else {
      setIsMagicLinkSent(true);
      toast.success('Magic link sent! Check your email.');
    }
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) toast.error('Failed to sign in with Google');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-playfair font-bold text-stone-800">
                Welcome to Pause
              </h2>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {isMagicLinkSent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-xl font-semibold mb-2 text-stone-800">
                  Check your email!
                </h3>
                <p className="text-stone-500">
                  We sent a magic link to <strong>{email}</strong>
                </p>
                <button
                  onClick={() => setIsMagicLinkSent(false)}
                  className="mt-6 text-teal-600 hover:text-teal-700"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3.5 border-2 border-stone-200 rounded-2xl hover:border-stone-300 transition-colors font-medium text-stone-700"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-stone-400">or</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-600 mb-2">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3.5 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700"
                    />
                  </div>

                  <button
                    onClick={handleMagicLink}
                    disabled={isLoading || !email}
                    className="w-full bg-stone-900 text-white py-3.5 rounded-2xl font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Send Magic Link'}
                  </button>
                </div>
              </>
            )}

            <p className="text-xs text-center text-stone-400 mt-8">
              By continuing, you agree to our{' '}
              <a href="/privacy" className="underline">
                Privacy Policy
              </a>.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
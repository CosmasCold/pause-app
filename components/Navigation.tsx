// components/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, LogOut, History, Settings } from 'lucide-react';
import AuthModal from './AuthModal';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-lg border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-teal-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="2" />
                <rect x="14" y="4" width="4" height="16" rx="2" />
              </svg>
            </span>
            <span className="font-playfair text-xl font-bold text-stone-800">Pause</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-stone-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-sm font-medium text-stone-700">
                    {user.email?.split('@')[0]}
                  </span>
                </button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-stone-100 p-2"
                  >
                    <Link
                      href="/history"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <History className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-700">History</span>
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4 text-stone-400" />
                      <span className="text-stone-700">Settings</span>
                    </Link>

                    <hr className="my-2 border-stone-100" />

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-teal-500 text-white px-5 py-2.5 rounded-2xl font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200/30"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
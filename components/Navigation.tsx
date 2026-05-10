// components/Navigation.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User as UserIcon, LogOut, History, Settings, Users } from 'lucide-react';
import AuthModal from './AuthModal';
import Link from 'next/link';
import Image from 'next/image';
import type { User } from '@supabase/supabase-js';

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [userTier, setUserTier] = useState('free');
  const menuRef = useRef<HTMLDivElement>(null);

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  // Load profile
  useEffect(() => {
    if (!user) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('name, avatar_url, tier')
        .eq('id', user.id)
        .single();
      setProfileName(data?.name || '');
      setProfileAvatar(data?.avatar_url || '');
      setUserTier(data?.tier || 'free');
    };
    loadProfile();
  }, [user]);

  // Click outside to close menu
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [showUserMenu]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    window.location.href = '/';
  };

  const displayName = profileName || user?.email?.split('@')[0] || '';

  return (
    <>
      <nav className="h-16 fixed top-0 left-0 right-0 z-40 bg-white/85 backdrop-blur-lg border-b border-stone-200/60">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Left: Logo (Home) */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Pause"
              width={28}
              height={28}
              className="object-contain"
              unoptimized
            />
            <span className="font-playfair text-xl font-bold text-stone-800">Pause</span>
          </Link>

          {/* Center/Right: Insights link – always visible */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/blog"
              className="text-stone-600 hover:text-stone-800 transition-colors font-medium text-sm sm:text-base"
            >
              Insights
            </Link>

            {/* Right: User menu or Sign In */}
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 rounded-2xl hover:bg-stone-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center overflow-hidden relative">
                    {profileAvatar ? (
                      <Image
                        src={profileAvatar}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-teal-600" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-stone-700 hidden sm:inline">
                    {displayName}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
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

                      {userTier === 'team' && (
                        <Link
                          href="/team"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Users className="w-4 h-4 text-stone-400" />
                          <span className="text-stone-700">Team</span>
                        </Link>
                      )}

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
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-teal-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl font-medium hover:bg-teal-600 transition-colors shadow-lg shadow-teal-200/30 text-sm"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <Suspense fallback={null}>
        <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      </Suspense>
    </>
  );
}
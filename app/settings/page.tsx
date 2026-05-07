// app/settings/page.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  Shield,
  User as UserIcon,
  LogOut,
  Trash2,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function SettingsContent() {
  const [profile, setProfile] = useState<{
    email: string;
    tier: string;
    email_reports: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [savingReports, setSavingReports] = useState(false);

  const initialized = useRef(false);
  const confirmedRef = useRef(false);
  const searchParams = useSearchParams();

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      const profileData = data || {
        email: user.email || '',
        tier: 'free',
        email_reports: true,
      };
      setProfile(profileData);
      setEmailReports(profileData.email_reports);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchProfile();
    }
  }, []);

  // Handle Stripe checkout session redirect (run only once)
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !profile || confirmedRef.current) return;
    confirmedRef.current = true;

    const confirmPayment = async () => {
      try {
        const response = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const result = await response.json();
        if (result.tier) {
          setProfile((prev) => (prev ? { ...prev, tier: result.tier } : prev));
          toast.success(`Upgraded to ${result.tier}!`, { duration: 4000 });
        }
      } catch {
        toast.error('Could not confirm payment');
      }
    };

    confirmPayment();
  }, [searchParams, profile]);

  const handleToggleReports = async () => {
    const newValue = !emailReports;
    setEmailReports(newValue);
    setSavingReports(true);

    const { error } = await supabase
      .from('user_profiles')
      .update({ email_reports: newValue })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    setSavingReports(false);

    if (error) {
      toast.error('Failed to update preference');
      setEmailReports(!newValue);
    } else {
      toast.success(
        newValue ? 'Weekly reports enabled' : 'Weekly reports disabled'
      );
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure? This will permanently delete all your data.')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('saved_analyses').delete().eq('user_id', user.id);
        await supabase.from('user_profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
        toast.success('Account deleted');
        window.location.href = '/';
      }
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-stone-600 text-center">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">
        Settings
      </h1>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50 mb-6"
      >
        <h2 className="text-lg font-semibold text-stone-800 mb-6 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-teal-600" />
          Account
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-stone-700">Email</p>
              <p className="text-stone-500 text-sm">{profile?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-stone-200/50">
            <div>
              <p className="font-medium text-stone-700">Plan</p>
              <p className="text-stone-500 text-sm capitalize">
                {profile?.tier || 'free'}
              </p>
            </div>
            {profile?.tier === 'free' ? (
              <a
                href="/pricing"
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm"
              >
                Upgrade <ChevronRight className="w-4 h-4" />
              </a>
            ) : (
              <div className="flex items-center gap-2 text-teal-600 font-medium text-sm">
                <CheckCircle className="w-4 h-4" />
                Active
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50 mb-6"
      >
        <h2 className="text-lg font-semibold text-stone-800 mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          Notifications
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-stone-700">Weekly Report</p>
              <p className="text-stone-500 text-sm">
                Receive a weekly summary of your communication patterns
              </p>
            </div>
            <button
              onClick={handleToggleReports}
              disabled={savingReports}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailReports ? 'bg-teal-500' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  emailReports ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-red-200/50 mb-6"
      >
        <h2 className="text-lg font-semibold text-red-600 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Danger Zone
        </h2>

        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-stone-400" />
              <span className="font-medium text-stone-700">Sign Out</span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </button>

          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl hover:bg-red-50 transition-colors border-t border-stone-200/50"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-600">Delete Account</p>
                <p className="text-stone-500 text-sm">
                  Permanently delete all your data
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-4 py-12">
          <p className="text-stone-600 text-center">Loading settings...</p>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
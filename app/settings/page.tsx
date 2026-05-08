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
  ArrowLeft,
  Camera,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<{
    email: string;
    tier: string;
    email_reports: boolean;
    name?: string;
    avatar_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailReports, setEmailReports] = useState(true);
  const [savingReports, setSavingReports] = useState(false);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initialized = useRef(false);
  const confirmedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        name: '',
        avatar_url: '',
      };
      setProfile(profileData);
      setEmailReports(profileData.email_reports);
      setName(profileData.name || '');
      setAvatarPreview(profileData.avatar_url || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      fetchProfile();
    }
  }, []);

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
      toast.success(newValue ? 'Weekly reports enabled' : 'Weekly reports disabled');
    }
  };

  const saveName = async () => {
    setSavingName(true);
    const { error } = await supabase
      .from('user_profiles')
      .update({ name })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);
    setSavingName(false);
    if (error) toast.error('Failed to save name');
    else toast.success('Name updated');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      toast.error('Not signed in');
      setUploadingAvatar(false);
      return;
    }

    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = publicUrlData.publicUrl;

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id);

    setUploadingAvatar(false);
    if (updateError) {
      toast.error('Failed to save avatar');
    } else {
      setProfile((prev) => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      setAvatarPreview(avatarUrl);
      toast.success('Profile picture updated');
    }
    setAvatarFile(null);
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
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Analyzer</span>
      </button>

      <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">Settings</h1>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50 mb-6"
      >
        <h2 className="text-lg font-semibold text-stone-800 mb-6 flex items-center gap-2">
          <Camera className="w-5 h-5 text-teal-600" />
          Profile
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-stone-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-teal-600" />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow border border-stone-200"
            >
              <Camera className="w-4 h-4 text-stone-500" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">
              {avatarFile ? 'New photo ready' : 'Profile picture'}
            </p>
            {avatarFile && (
              <button
                onClick={uploadAvatar}
                disabled={uploadingAvatar}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-1 disabled:opacity-50"
              >
                {uploadingAvatar ? 'Uploading...' : 'Save photo'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-stone-700">Display name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="flex-1 px-4 py-2.5 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700"
            />
            <button
              onClick={saveName}
              disabled={savingName}
              className="bg-teal-500 text-white px-4 py-2.5 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {savingName ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Account Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
              <p className="text-stone-500 text-sm capitalize">{profile?.tier || 'free'}</p>
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

          {profile?.tier === 'team' && (
            <div className="flex items-center justify-between py-3 border-t border-stone-200/50">
              <div>
                <p className="font-medium text-stone-700">Team</p>
                <p className="text-stone-500 text-sm">Manage your team and dashboard</p>
              </div>
              <a
                href="/team"
                className="flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium text-sm"
              >
                Manage <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Notifications Section – gated to Pro / Team */}
      {profile?.tier !== 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
      )}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
// app/team/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Trash2,
  Users,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BarChart3,
  Settings,
  Mail,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

interface Team {
  id: string;
  name: string;
  created_by: string;
  seats_total: number;
  seats_used: number;
  created_at: string;
}

interface Member {
  id: string;
  email: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserId && team ? team.created_by === currentUserId : false;

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tier, team_id')
      .eq('id', user.id)
      .single();

    setUserTier(profile?.tier || 'free');

    if (!profile || profile.tier !== 'team') {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/team/manage?userId=${user.id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not load team');
      } else {
        if (data.team) {
          setTeam(data.team);
          setMembers(data.members || []);
        } else {
          setTeam(null);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTeam();
  }, [fetchTeam]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setIsCreating(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const response = await fetch('/api/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', teamName, userId: user?.id }),
      });
      const data = await response.json();
      setIsCreating(false);

      if (data.team) {
        setTeam(data.team);
        if (user) {
          setMembers([{ id: user.id, email: user.email || '' }]);
        }
        toast.success('Team created!', {
          style: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
        });
      } else {
        toast.error(data.error || 'Failed');
      }
    } catch {
      setIsCreating(false);
      toast.error('Could not reach server. Please try again.');
    }
  };

  const handleAddOrInvite = async () => {
    if (!memberEmail.trim()) return;
    setIsAddingMember(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;

      const addResponse = await fetch('/api/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-member', memberEmail, userId: user?.id }),
      });
      const addData = await addResponse.json();

      if (addData.success) {
        setMembers((prev) => [...prev, { id: '', email: memberEmail }]);
        setMemberEmail('');
        toast.success('Member added!', {
          style: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
        });
        setIsAddingMember(false);
        return;
      }

      if (addData.canInvite) {
        toast.loading('Sending invitation…', { duration: 2000 });
        const invResponse = await fetch('/api/team/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'invite', memberEmail, userId: user?.id }),
        });
        const invData = await invResponse.json();
        setIsAddingMember(false);

        if (invData.success) {
          setMemberEmail('');
          toast.success(`Invitation sent to ${memberEmail}!`, {
            style: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
          });
        } else {
          toast.error(invData.error || 'Failed to send invite');
        }
        return;
      }

      setIsAddingMember(false);
      toast.error(addData.error || 'Failed');
    } catch {
      setIsAddingMember(false);
      toast.error('Could not reach server');
    }
  };

  const handleRemoveMember = async (email: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const response = await fetch('/api/team/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove-member', memberEmail: email, userId: user?.id }),
      });
      const data = await response.json();
      if (!data.success) {
        toast.error(data.error || 'Failed');
      } else {
        setMembers((prev) => prev.filter((m) => m.email !== email));
        toast.success('Member removed', {
          style: { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' },
        });
      }
    } catch {
      toast.error('Could not reach server. Please try again.');
    }
  };

  // ── RENDER: Loading ──
  if (loading) {
    return (
      <>
        <Navigation />
        <div className="pt-24 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-200 border-t-teal-500 rounded-full mx-auto mb-4" />
          <p className="text-stone-500">Loading team...</p>
        </div>
      </>
    );
  }

  // ── RENDER: Error ──
  if (error) {
    return (
      <>
        <Navigation />
        <div className="pt-24 text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-playfair font-bold text-stone-950 mb-2">Something went wrong</h2>
          <p className="text-stone-700 mb-6">{error}</p>
          <button onClick={fetchTeam} className="bg-teal-500 text-white px-4 py-2 rounded-2xl font-medium hover:bg-teal-600">
            Try Again
          </button>
        </div>
      </>
    );
  }

  // ── RENDER: Not on team tier ──
  if (userTier && userTier !== 'team') {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-3xl font-playfair font-bold text-stone-950 mb-4">Team Plan Required</h1>
            <p className="text-stone-700 mb-8 max-w-md mx-auto leading-relaxed">
              The Team feature is exclusively for team subscribers.
              Upgrade your plan to unlock team management, member analytics,
              and collaborative insights.
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => router.back()} className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-stone-200 text-stone-600 hover:border-stone-300 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Go Back
              </button>
              <Link href="/pricing" className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600 transition-colors">
                View Plans <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  // ── RENDER: No team yet (owner creates) ──
  if (!team) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-16 px-4 max-w-lg mx-auto">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Back</span>
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 rounded-3xl p-8 shadow-lg shadow-stone-300/60 border border-stone-300/70">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-teal-600" />
              </div>
              <h1 className="text-2xl font-playfair font-bold text-stone-950 mb-2">Create Your Team</h1>
              <p className="text-stone-700 text-sm">You&apos;re on the Team plan. Set up your team to start collaborating.</p>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-stone-700">Team Name</label>
              <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name" className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700" />
              <button onClick={handleCreateTeam} disabled={isCreating || !teamName.trim()} className="w-full bg-teal-500 text-white py-3 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors">
                {isCreating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </motion.div>
        </main>
      </>
    );
  }

  // ── RENDER: Team management (owner vs member) ──
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> <span className="text-sm font-medium">Back</span>
        </button>

        {/* Team header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 rounded-3xl p-8 shadow-lg shadow-stone-300/60 border border-stone-300/70 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-playfair font-bold text-stone-950">{team.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-stone-500 text-sm">
                <Users className="w-4 h-4" />
                <span>{members.length} / {team.seats_total} members</span>
                <span className="text-stone-300">•</span>
                <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard" className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-2xl font-medium hover:bg-teal-600 transition-colors text-sm whitespace-nowrap">
                <BarChart3 className="w-4 h-4" /> Dashboard
              </Link>
              {isOwner && (
                <Link href="/settings" className="flex items-center gap-2 bg-stone-100 text-stone-700 px-4 py-2 rounded-2xl font-medium hover:bg-stone-200 transition-colors text-sm whitespace-nowrap">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Add member – OWNER ONLY */}
        {isOwner && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/90 rounded-3xl p-6 shadow-lg shadow-stone-300/60 border border-stone-300/70 mb-6">
            <h2 className="text-lg font-semibold text-stone-950 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" /> Add Member
            </h2>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input type="email" placeholder="colleague@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500 text-stone-700" />
              </div>
              <button onClick={handleAddOrInvite} disabled={isAddingMember || !memberEmail.trim()} className="bg-teal-500 text-white px-6 py-3 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                {isAddingMember ? 'Adding...' : 'Add'}
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-3">
              Enter an email address. If they already have a Pause account, they&apos;ll be added immediately. If not, we&apos;ll send them an invitation.
            </p>
          </motion.div>
        )}

        {/* Members list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 rounded-3xl p-6 shadow-lg shadow-stone-300/60 border border-stone-300/70">
          <h2 className="text-lg font-semibold text-stone-950 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> Team Members
          </h2>
          <div className="divide-y divide-stone-100">
            {members.map((member) => (
              <div key={member.id + member.email} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                    <span className="text-sm font-medium text-teal-600">{member.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-stone-700">{member.email}</p>
                    <p className="text-xs text-stone-400">
                      {member.id === team.created_by ? 'Team Owner' : 'Member'}
                    </p>
                  </div>
                </div>
                {isOwner && member.id !== team.created_by && (
                  <button onClick={() => handleRemoveMember(member.email)} className="flex items-center gap-2 text-red-400 hover:text-red-600 transition-colors text-sm font-medium">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-stone-400 py-8">No members yet. Add your first team member above.</p>
            )}
          </div>
        </motion.div>
      </main>
    </>
  );
}
// app/team/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Users } from 'lucide-react';
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
}

interface Member {
  id: string;
  email: string;
}

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchTeam = useCallback(async () => {
    const response = await fetch('/api/team/manage');
    const data = await response.json();
    if (data.team) {
      setTeam(data.team);
      setMembers(data.members || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
  let ignore = false;
  (async () => {
    if (!ignore) await fetchTeam();
  })();
  return () => {
    ignore = true;
  };
}, [fetchTeam]);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    setIsCreating(true);
    const response = await fetch('/api/team/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', teamName }),
    });
    const data = await response.json();
    setIsCreating(false);
    if (data.team) {
      setTeam(data.team);
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setMembers([{ id: user.id, email: user.email || '' }]);
      }
      toast.success('Team created!');
    } else {
      toast.error(data.error || 'Failed');
    }
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    setIsAddingMember(true);
    const response = await fetch('/api/team/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add-member', memberEmail }),
    });
    const data = await response.json();
    setIsAddingMember(false);
    if (data.success) {
      setMembers((prev) => [...prev, { id: '', email: memberEmail }]);
      setMemberEmail('');
      toast.success('Member added');
    } else {
      toast.error(data.error || 'Failed');
    }
  };

  const handleRemoveMember = async (email: string) => {
    const response = await fetch('/api/team/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove-member', memberEmail: email }),
    });
    const data = await response.json();
    if (data.success) {
      setMembers((prev) => prev.filter((m) => m.email !== email));
      toast.success('Member removed');
    } else {
      toast.error(data.error || 'Failed');
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="pt-24 text-center">
          <p className="text-stone-600">Loading team...</p>
        </div>
      </>
    );
  }

  if (!team) {
    return (
      <>
        <Navigation />
        <main className="pt-24 pb-16 px-4 max-w-md mx-auto">
          <h1 className="text-3xl font-playfair font-bold text-stone-800 mb-4">
            Create Your Team
          </h1>
          <p className="text-stone-600 mb-6">
            You&apos;re on the Team plan. Set up your team to start collaborating.
          </p>
          <input
            type="text"
            placeholder="Team Name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-stone-200 rounded-2xl mb-4 focus:outline-none focus:border-teal-500"
          />
          <button
            onClick={handleCreateTeam}
            disabled={isCreating}
            className="w-full bg-teal-500 text-white py-3 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Team'}
          </button>
        </main>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-stone-800">
              {team.name}
            </h1>
            <p className="text-stone-500">
              Members: {members.length} / {team.seats_total}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="bg-teal-500 text-white px-4 py-2 rounded-2xl font-medium hover:bg-teal-600 transition-colors"
          >
            Open Dashboard
          </Link>
        </div>

        {/* Add member form */}
        <div className="bg-white/90 rounded-3xl p-6 mb-6 shadow-xl shadow-stone-300/40 border border-stone-300/50">
          <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-teal-600" />
            Add Member
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Email address"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={handleAddMember}
              disabled={isAddingMember}
              className="bg-teal-500 text-white px-5 py-2.5 rounded-2xl font-medium hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              {isAddingMember ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>

        {/* Members list */}
        <div className="bg-white/90 rounded-3xl p-6 shadow-xl shadow-stone-300/40 border border-stone-300/50">
          <h2 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Members
          </h2>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id + member.email}
                className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-stone-50 transition-colors"
              >
                <span className="text-stone-700">{member.email}</span>
                {member.id !== team.created_by && (
                  <button
                    onClick={() => handleRemoveMember(member.email)}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Remove member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
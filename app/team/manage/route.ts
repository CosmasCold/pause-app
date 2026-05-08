// app/api/team/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get user's team membership
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('team_id, tier')
    .eq('id', user.id)
    .single();

  if (!profile?.team_id) {
    return NextResponse.json({ team: null });
  }

  const { data: team } = await supabase
    .from('teams')
    .select('*')
    .eq('id', profile.team_id)
    .single();

  const { data: members } = await supabase
    .from('user_profiles')
    .select('id, email')
    .eq('team_id', profile.team_id);

  return NextResponse.json({ team, members: members || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check user is team tier and owner (or create team if not exists)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tier, team_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.tier !== 'team') {
    return NextResponse.json({ error: 'You must be on the Team plan' }, { status: 403 });
  }

  const { action, teamName, memberEmail } = await request.json();

  if (action === 'create') {
    if (!teamName) return NextResponse.json({ error: 'Team name required' }, { status: 400 });

    const { data: team, error } = await supabase
      .from('teams')
      .insert({ name: teamName, created_by: user.id, seats_total: 10, seats_used: 1 })
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Could not create team' }, { status: 500 });

    // Assign the creator to the team
    await supabase.from('user_profiles').update({ team_id: team.id }).eq('id', user.id);

    return NextResponse.json({ team });
  }

  if (action === 'add-member') {
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (!team) return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });

    // Find the member by email
    const { data: memberProfile } = await supabase
      .from('user_profiles')
      .select('id, team_id')
      .eq('email', memberEmail)
      .single();

    if (!memberProfile) return NextResponse.json({ error: 'User not found. They must sign up first.' }, { status: 404 });

    if (memberProfile.team_id) {
      return NextResponse.json({ error: 'User is already in a team' }, { status: 400 });
    }

    if (team.seats_used >= team.seats_total) {
      return NextResponse.json({ error: 'No seats available' }, { status: 400 });
    }

    await supabase.from('user_profiles').update({ team_id: team.id }).eq('id', memberProfile.id);
    await supabase.from('teams').update({ seats_used: team.seats_used + 1 }).eq('id', team.id);

    return NextResponse.json({ success: true });
  }

  if (action === 'remove-member') {
    const { data: team } = await supabase
      .from('teams')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (!team) return NextResponse.json({ error: 'Not the team owner' }, { status: 403 });

    // Remove member's team assignment
    await supabase.from('user_profiles').update({ team_id: null }).eq('email', memberEmail);
    await supabase.from('teams').update({ seats_used: team.seats_used - 1 }).eq('id', team.id);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
// app/api/team/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', userId)
      .single();

    if (!profile?.team_id) {
      return NextResponse.json({ team: null });
    }

    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', profile.team_id)
      .single();

    const { data: members } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('team_id', profile.team_id);

    return NextResponse.json({ team, members: members || [] });
  } catch (error) {
    console.error('GET team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, teamName, memberEmail, userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'create') {
      if (!teamName) return NextResponse.json({ error: 'Team name required' }, { status: 400 });

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (!profile || profile.tier !== 'team') {
        return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
      }

      const { data: team, error } = await supabaseAdmin
        .from('teams')
        .insert({ name: teamName, created_by: userId, seats_total: 10, seats_used: 1 })
        .select()
        .single();

      if (error) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: 'Could not create team' }, { status: 500 });
      }

      await supabaseAdmin.from('user_profiles').update({ team_id: team.id }).eq('id', userId);

      return NextResponse.json({ team });
    }

    if (action === 'add-member') {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (!team) return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });

      const { data: memberProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id')
        .eq('email', memberEmail)
        .single();

      if (!memberProfile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      if (memberProfile.team_id) return NextResponse.json({ error: 'User already in a team' }, { status: 400 });
      if (team.seats_used >= team.seats_total) return NextResponse.json({ error: 'No seats available' }, { status: 400 });

      await supabaseAdmin.from('user_profiles').update({ team_id: team.id }).eq('id', memberProfile.id);
      await supabaseAdmin.from('teams').update({ seats_used: team.seats_used + 1 }).eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    if (action === 'remove-member') {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (!team) return NextResponse.json({ error: 'Not the team owner' }, { status: 403 });

      await supabaseAdmin.from('user_profiles').update({ team_id: null }).eq('email', memberEmail);
      await supabaseAdmin.from('teams').update({ seats_used: team.seats_used - 1 }).eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
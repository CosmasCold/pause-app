// app/api/team/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service‑role client – will throw if env vars are missing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    console.log('GET /api/team/manage - userId:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', userId)
      .single();

    console.log('Profile:', profile, 'Error:', profileError);

    if (!profile?.team_id) {
      return NextResponse.json({ team: null });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', profile.team_id)
      .single();

    console.log('Team:', team, 'Error:', teamError);

    const { data: members, error: membersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('team_id', profile.team_id);

    console.log('Members count:', members?.length, 'Error:', membersError);

    return NextResponse.json({ team, members: members || [] });
  } catch (error) {
    console.error('GET team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, teamName, memberEmail, userId } = body;
    console.log('POST /api/team/manage - body:', body);

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'create') {
      // ... (full create logic from before, with logging)
    }

    if (action === 'add-member') {
      console.log('Add member - finding team for user:', userId);
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (teamError || !team) {
        console.error('Team not found or error:', teamError);
        return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });
      }

      console.log('Team found:', team.id);

      const { data: memberProfile, error: memberError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id')
        .eq('email', memberEmail)
        .single();

      if (memberError || !memberProfile) {
        console.error('Member not found:', memberError);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (memberProfile.team_id) {
        return NextResponse.json({ error: 'User already in a team' }, { status: 400 });
      }

      if (team.seats_used >= team.seats_total) {
        return NextResponse.json({ error: 'No seats available' }, { status: 400 });
      }

      await supabaseAdmin.from('user_profiles').update({ team_id: team.id }).eq('id', memberProfile.id);
      await supabaseAdmin.from('teams').update({ seats_used: team.seats_used + 1 }).eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    if (action === 'remove-member') {
      // ... full remove logic with logging
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
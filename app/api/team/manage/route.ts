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

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.team_id) {
      return NextResponse.json({ team: null, members: [] });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', profile.team_id)
      .single();

    if (teamError || !team) {
      return NextResponse.json({ team: null, members: [] });
    }

    const { data: members, error: membersError } = await supabaseAdmin
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
    const body = await request.json();
    const { action, teamName, memberEmail, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // ================== CREATE ==================
    if (action === 'create') {
      if (!teamName) {
        return NextResponse.json({ error: 'Team name required' }, { status: 400 });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (profileError || !profile || profile.tier !== 'team') {
        return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
      }

      const { data: team, error: createError } = await supabaseAdmin
        .from('teams')
        .insert({
          name: teamName,
          created_by: userId,
          seats_total: 10,
          seats_used: 1,
        })
        .select()
        .single();

      if (createError || !team) {
        console.error('Create team error:', createError);
        return NextResponse.json({ error: 'Could not create team' }, { status: 500 });
      }

      // Assign creator to the team
      await supabaseAdmin
        .from('user_profiles')
        .update({ team_id: team.id })
        .eq('id', userId);

      return NextResponse.json({ team });
    }

    // ================== ADD MEMBER ==================
    if (action === 'add-member') {
      if (!memberEmail) {
        return NextResponse.json({ error: 'Missing memberEmail' }, { status: 400 });
      }

      // Find the team owned by this user
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (teamError || !team) {
        return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });
      }

      if (team.seats_used >= team.seats_total) {
        return NextResponse.json({ error: 'No seats available' }, { status: 400 });
      }

      // Find the member by email
      const { data: memberProfile, error: memberError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id')
        .eq('email', memberEmail)
        .single();

      if (memberError || !memberProfile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (memberProfile.team_id) {
        return NextResponse.json({ error: 'User already in a team' }, { status: 400 });
      }

      // Add member to team
      await supabaseAdmin
        .from('user_profiles')
        .update({ team_id: team.id })
        .eq('id', memberProfile.id);

      await supabaseAdmin
        .from('teams')
        .update({ seats_used: team.seats_used + 1 })
        .eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    // ================== REMOVE MEMBER ==================
    if (action === 'remove-member') {
      if (!memberEmail) {
        return NextResponse.json({ error: 'Missing memberEmail' }, { status: 400 });
      }

      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (teamError || !team) {
        return NextResponse.json({ error: 'Not the team owner' }, { status: 403 });
      }

      const { data: memberProfile, error: memberError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id')
        .eq('email', memberEmail)
        .single();

      if (memberError || !memberProfile) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      if (memberProfile.team_id !== team.id) {
        return NextResponse.json({ error: 'User is not in this team' }, { status: 400 });
      }

      // Remove member from team
      await supabaseAdmin
        .from('user_profiles')
        .update({ team_id: null })
        .eq('id', memberProfile.id);

      await supabaseAdmin
        .from('teams')
        .update({ seats_used: team.seats_used - 1 })
        .eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    // Unknown action
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
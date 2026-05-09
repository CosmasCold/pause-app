// app/api/team/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Service‑role client that bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    console.log('GET /api/team/manage – starting');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('User ID:', user.id);

    // Get user profile with service role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('team_id, tier')
      .eq('id', user.id)
      .single();

    console.log('Profile query result:', profile, 'Error:', profileError);

    if (!profile?.team_id) {
      return NextResponse.json({ team: null });
    }

    const { data: team, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', profile.team_id)
      .single();

    console.log('Team query result:', team, 'Error:', teamError);

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
    console.log('POST /api/team/manage – starting');
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, teamName, memberEmail } = await request.json();
    console.log('Action:', action);

    if (action === 'create') {
      if (!teamName) return NextResponse.json({ error: 'Team name required' }, { status: 400 });

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (!profile || profile.tier !== 'team') {
        return NextResponse.json({ error: 'Team tier required' }, { status: 403 });
      }

      const { data: team, error } = await supabaseAdmin
        .from('teams')
        .insert({ name: teamName, created_by: user.id, seats_total: 10, seats_used: 1 })
        .select()
        .single();

      if (error) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: 'Could not create team' }, { status: 500 });
      }

      await supabaseAdmin.from('user_profiles').update({ team_id: team.id }).eq('id', user.id);

      return NextResponse.json({ team });
    }

    if (action === 'add-member') {
      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', user.id)
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
        .eq('created_by', user.id)
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
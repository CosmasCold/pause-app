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
    const body = await request.json();
    const { action, teamName, userId } = body;
    console.log('POST team body:', body);

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

      console.log('User tier:', profile?.tier);

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

    // … rest of the actions unchanged
  } catch (error) {
    console.error('POST team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
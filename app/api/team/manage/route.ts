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
      return NextResponse.json({ team: null, members: [] });
    }

    const { data: team } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', profile.team_id)
      .single();

    if (!team) {
      return NextResponse.json({ team: null, members: [] });
    }

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
    const { action, teamName, memberEmail, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // ================== CREATE ==================
    if (action === 'create') {
      if (!teamName) {
        return NextResponse.json({ error: 'Team name required' }, { status: 400 });
      }

      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('tier')
        .eq('id', userId)
        .single();

      if (!profile || profile.tier !== 'team') {
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

      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (!team) {
        return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });
      }

      if (team.seats_used >= team.seats_total) {
        return NextResponse.json({ error: 'No seats available' }, { status: 400 });
      }

      const { data: memberProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id, tier')
        .eq('email', memberEmail)
        .single();

      if (!memberProfile) {
        return NextResponse.json(
          { error: 'User not found', canInvite: true },
          { status: 404 }
        );
      }

      if (memberProfile.team_id) {
        return NextResponse.json({ error: 'User already in a team' }, { status: 400 });
      }

      await supabaseAdmin
        .from('user_profiles')
        .update({ team_id: team.id, tier: 'team' })
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

      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('created_by', userId)
        .single();

      if (!team) {
        return NextResponse.json({ error: 'Not the team owner' }, { status: 403 });
      }

      const { data: memberProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id, team_id')
        .eq('email', memberEmail)
        .single();

      if (!memberProfile) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      if (memberProfile.team_id !== team.id) {
        return NextResponse.json({ error: 'User is not in this team' }, { status: 400 });
      }

      await supabaseAdmin
        .from('user_profiles')
        .update({ team_id: null, tier: 'free' })
        .eq('id', memberProfile.id);

      await supabaseAdmin
        .from('teams')
        .update({ seats_used: team.seats_used - 1 })
        .eq('id', team.id);

      return NextResponse.json({ success: true });
    }

    // ================== INVITE ==================
    if (action === 'invite') {
      if (!memberEmail) {
        return NextResponse.json({ error: 'Missing memberEmail' }, { status: 400 });
      }

      const { data: team } = await supabaseAdmin
        .from('teams')
        .select('id, name')
        .eq('created_by', userId)
        .single();

      if (!team) {
        return NextResponse.json({ error: 'You are not the team owner' }, { status: 403 });
      }

      
      const inviteUrl = `https://pauseapp.space?teamId=${team.id}&email=${encodeURIComponent(memberEmail)}`;

      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        console.error('RESEND_API_KEY not set');
        return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Pause Team <noreply@pauseapp.space>',
          to: memberEmail,
          subject: `You've been invited to join "${team.name}" on Pause`,
          html: `
            <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
              <div style="background:#0d9488;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                <h1 style="color:white;margin:0">⏸️ Pause</h1>
              </div>
              <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                <h2 style="color:#1c1917">You've been invited to join "${team.name}"</h2>
                <p style="color:#57534e;line-height:1.6">
                  Click the button below to accept the invitation. If you already have a Pause account, you'll be added to the team automatically. If not, you'll create a free account and then join the team.
                </p>
                <a href="${inviteUrl}" style="display:inline-block;background:#0d9488;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;margin:16px 0">
                  Accept Invitation
                </a>
                <p style="color:#a8a29e;font-size:12px;margin-top:24px">
                  If you didn't expect this invitation, you can safely ignore this email.
                </p>
              </div>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Resend error:', response.status, errText);
        return NextResponse.json({ error: 'Failed to send invite email' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST team error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
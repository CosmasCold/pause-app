// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists
        await supabase
          .from('user_profiles')
          .upsert(
            {
              id: user.id,
              email: user.email,
              tier: 'free',
              analyses_today: 0,
              last_analysis_date: new Date().toISOString().split('T')[0],
            },
            { onConflict: 'id' }
          );

        // 1. Check query params (magic link)
        let teamId = requestUrl.searchParams.get('teamId');
        let inviteEmail = requestUrl.searchParams.get('email');

        // 2. Fallback: check cookie (Google OAuth)
        if (!teamId || !inviteEmail) {
          const cookieHeader = request.headers.get('cookie') || '';
          const pauseInviteCookie = cookieHeader
            .split(';')
            .find((c) => c.trim().startsWith('pause_invite='));

          if (pauseInviteCookie) {
            try {
              const encodedData = pauseInviteCookie.split('=')[1].trim();
              const data = JSON.parse(decodeURIComponent(encodedData));
              teamId = data.teamId;
              inviteEmail = data.email;
            } catch (parseError) {
              console.error('Failed to parse pause_invite cookie:', parseError);
            }
          }
        }

        // 3. Process invite if data is valid
        if (teamId && inviteEmail && user.email === inviteEmail) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          // Add user to team and upgrade tier
          await supabaseAdmin
            .from('user_profiles')
            .update({ team_id: teamId, tier: 'team' })
            .eq('id', user.id);

          // Increment seats used
          const { data: team } = await supabaseAdmin
            .from('teams')
            .select('seats_used')
            .eq('id', teamId)
            .single();

          if (team) {
            await supabaseAdmin
              .from('teams')
              .update({ seats_used: team.seats_used + 1 })
              .eq('id', teamId);
          }

          // Clear the invite cookie
          const response = NextResponse.redirect(requestUrl.origin);
          response.headers.set(
            'Set-Cookie',
            'pause_invite=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
          );
          return response;
        }
      }
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
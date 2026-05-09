// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  let next = requestUrl.searchParams.get('next') ?? '/';

  if (!next.startsWith('/')) {
    next = '/';
  }

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Upsert user profile
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

        // Check for team invite
        const teamId = requestUrl.searchParams.get('teamId');
        const inviteEmail = requestUrl.searchParams.get('email');

        if (teamId && inviteEmail && user.email === inviteEmail) {
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          // Add user to the team
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
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const redirectUrl = isLocalEnv
        ? `${requestUrl.origin}${next}`
        : forwardedHost
          ? `https://${forwardedHost}${next}`
          : `${requestUrl.origin}${next}`;

      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`);
}
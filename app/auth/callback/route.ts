// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);

    // Create user profile if it doesn't exist
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
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
    }
  }

  return NextResponse.redirect(requestUrl.origin);
}
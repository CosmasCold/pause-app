// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Create user profile if missing
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
            tier: 'free',
            analyses_today: 0,
            last_analysis_date: new Date().toISOString().split('T')[0],
          }, { onConflict: 'id' });
      }

      // Redirect to home page using the request origin (which is the deployed domain)
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If something went wrong, redirect to home anyway
  return NextResponse.redirect(`${origin}/`);
}
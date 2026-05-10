// app/api/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Remove from public subscribers
    const { error: publicError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .delete()
      .eq('email', email);

    // Also disable email reports for any matching user account
    const { error: userError } = await supabaseAdmin
      .from('user_profiles')
      .update({ email_reports: false })
      .eq('email', email);

    if (publicError && userError) {
      // Both failed – maybe the email doesn't exist
      return NextResponse.json({ message: 'Email not found in our list.' });
    }

    return NextResponse.json({ message: 'Unsubscribed successfully.' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
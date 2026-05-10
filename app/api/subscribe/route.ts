// app/api/subscribe/route.ts
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

    const { error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({ email });

    if (error) {
      // Unique violation – already subscribed
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already subscribed' });
      }
      throw error;
    }

    // Send welcome email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Pause Weekly <noreply@pauseapp.space>',
            to: email,
            subject: 'Welcome to Pause Weekly!',
            html: `
              <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
                <div style="background:#0d9488;padding:24px;border-radius:12px 12px 0 0;text-align:center">
                  <h1 style="color:white;margin:0">⏸️ Pause Weekly</h1>
                </div>
                <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
                  <h2 style="color:#1c1917">You're in!</h2>
                  <p style="color:#57534e;line-height:1.6">
                    Thanks for subscribing to Pause Weekly. Every Monday, you'll get one practical communication tip to help you write clearer, kinder messages.
                  </p>
                  <p style="color:#57534e;line-height:1.6">
                    Until then, you can try Pause for free at <a href="https://pauseapp.space" style="color:#0d9488">pauseapp.space</a>.
                  </p>
                  <p style="color:#a8a29e;font-size:12px;margin-top:24px">
                    If you no longer want these emails, you can <a href="https://pauseapp.space/settings?unsubscribe=true" style="color:#a8a29e">unsubscribe here</a>.
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription – they're still in the database
      }
    }

    return NextResponse.json({ message: 'Subscribed! Check your inbox.' });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
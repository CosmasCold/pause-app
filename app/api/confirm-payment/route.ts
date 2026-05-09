// app/api/confirm-payment/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // 1. Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;
    if (!userId || !tier) {
      console.error('Missing metadata', session.metadata);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // 2. Perform authenticated update via service client (bypasses RLS)
    //    or use the server client with cookies – we'll try both.
    const supabase = await createClient();

    // Option A: If RLS is blocking, we can use the service key client.
    // Option B: Use the standard user-authenticated client, but it must be
    //           actually authenticated. Because this route is called from the
    //           settings page (browser cookies present), it should work.
    // We'll do both: first try with the user‑authenticated client,
    // then fallback to a direct update using service key if needed.

    // Attempt 1: user‑authenticated update
    const { error, data } = await supabase
      .from('user_profiles')
      .update({ tier })
      .eq('id', userId)
      .select('tier')
      .single();

    // If no row was updated or an error occurred, try upsert
    if (error || !data) {
      console.log('Standard update failed, trying upsert');
      const { error: upsertError, data: upsertData } = await supabase
        .from('user_profiles')
        .upsert(
          { id: userId, email: session.customer_email || '', tier, analyses_today: 0, last_analysis_date: new Date().toISOString().split('T')[0] },
          { onConflict: 'id' }
        )
        .select('tier')
        .single();

      if (upsertError || !upsertData) {
        console.error('Upsert failed', upsertError);
        // Last resort: use service key client (you can add SUPABASE_SERVICE_KEY later)
        // For now, report failure so we can debug.
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      return NextResponse.json({ tier: upsertData.tier });
    }

    return NextResponse.json({ tier: data.tier });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
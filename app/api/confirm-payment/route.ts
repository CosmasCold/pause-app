// app/api/confirm-payment/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

    // 2. Extract metadata
    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      console.error('Missing metadata in session', session.metadata);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // 3. Update the user's tier using service‑role (bypasses RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .upsert(
        {
          id: userId,
          email: session.customer_details?.email || '',
          tier,
          analyses_today: 0,
          last_analysis_date: new Date().toISOString().split('T')[0],
        },
        { onConflict: 'id' }
      );

    if (updateError) {
      console.error('Upsert failed:', updateError);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }

    // 4. Verify the tier was actually saved
    const { data: verify } = await supabaseAdmin
      .from('user_profiles')
      .select('tier')
      .eq('id', userId)
      .single();

    console.log('Tier updated to:', verify?.tier);

    return NextResponse.json({ tier: verify?.tier || tier });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
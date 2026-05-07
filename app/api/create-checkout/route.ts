// app/api/create-checkout/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { tier, userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing user ID or email' }, { status: 400 });
    }

    const priceId =
      tier === 'pro'
        ? process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_TEAM_PRICE_ID;

    const supabase = await createClient();

    // Ensure user_profile exists with real email
    await supabase.from('user_profiles').upsert(
      {
        id: userId,
        email,
        tier: 'free',
        analyses_today: 0,
        last_analysis_date: new Date().toISOString().split('T')[0],
      },
      { onConflict: 'id' }
    );

    // Retrieve or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId },
      });
      customerId = customer.id;

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    } else {
      // Update existing customer email if changed
      await stripe.customers.update(customerId, { email });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        userId,
        tier,
      },
      success_url: `${process.env.NEXT_PUBLIC_URL}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
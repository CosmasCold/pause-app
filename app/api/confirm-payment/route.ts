// app/api/confirm-payment/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const supabase = await createClient();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const { userId, tier } = session.metadata ?? {};
    if (userId && tier) {
      await supabase
        .from('user_profiles')
        .update({ tier })
        .eq('id', userId);
    }

    return NextResponse.json({ tier });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Failed to confirm payment' }, { status: 500 });
  }
}
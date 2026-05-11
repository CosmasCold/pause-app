// app/api/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('stripe_customer_id, tier, team_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { stripe_customer_id, tier } = profile;

    if (tier === 'free') {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    if (!stripe_customer_id) {
      return NextResponse.json({ error: 'No payment method on file' }, { status: 400 });
    }

    // Determine which subscription to cancel
    let priceId: string;
    if (tier === 'pro') {
      priceId = process.env.STRIPE_PRO_PRICE_ID!;
    } else if (tier === 'team') {
      priceId = process.env.STRIPE_TEAM_PRICE_ID!;

      // Team cancellation: only the owner can do it
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('id, created_by')
        .eq('created_by', userId)
        .single();

      if (teamError || !team) {
        return NextResponse.json({ error: 'Only the team owner can cancel the subscription' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Unknown tier' }, { status: 400 });
    }

    // Find the active subscription for that price
    const subscriptions = await stripe.subscriptions.list({
      customer: stripe_customer_id,
      price: priceId,
      status: 'active',
      limit: 1,
    });

    const subscription = subscriptions.data[0];
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel at period end (user keeps access until expiry)
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // For Team: immediately downgrade all team members and delete the team
    if (tier === 'team' && profile.team_id) {
      await supabaseAdmin
        .from('user_profiles')
        .update({ tier: 'free', team_id: null })
        .eq('team_id', profile.team_id);

      await supabaseAdmin
        .from('teams')
        .delete()
        .eq('id', profile.team_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled. You will have access until the end of the billing period.',
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}
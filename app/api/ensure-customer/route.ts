// app/api/ensure-customer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing user info' }, { status: 400 });
    }

    // Create a new Stripe Customer in live mode
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });

    return NextResponse.json({ customerId: customer.id });
  } catch (error) {
    console.error('Ensure customer error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For occasional checking',
    features: [
      '3 analyses per day',
      '1,000 character limit',
      'Cognitive bias detection',
      'Emotional tone analysis',
      'Rephrasing suggestions',
      'Reflective questions',
      'All writing contexts',
    ],
    cta: 'Free Plan',
    popular: false,
    priceId: '',
  },
  {
    name: 'Pro',
    price: '$8',
    period: 'per month',
    description: 'For professionals who communicate daily',
    features: [
      'Unlimited analyses',
      'Unlimited text length',
      'Save & review history',
      'Everything in Free, unrestricted',
    ],
      cta: 'Subscribe',
    popular: true,
    priceId: 'pro',
  },
  {
  name: 'Team',
  price: '$19',
  period: 'per month',
  description: 'For organizations and teams',
  features: [
    'Up to 10 team members',
    'Everything in Pro',
    'Team analytics dashboard',
    'Admin controls',
    'Priority support',
  ],
  cta: 'Subscribe',
  popular: false,
  priceId: 'team',
},
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    if (!tier) return; // Free plan

    setLoadingTier(tier);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) {
      toast.error('Please sign in first');
      setLoadingTier(null);
      return;
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user.id, email: user.email }),
      });

      const { url, error } = await response.json();

      if (error) {
        toast.error(error);
      } else if (url) {
        router.push(url);
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-playfair font-bold mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-xl text-stone-600">
              Start free, upgrade when you need more clarity
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white/90 rounded-3xl p-8 ${
                  plan.popular
                    ? 'ring-2 ring-teal-500 shadow-2xl shadow-teal-100'
                    : 'border border-stone-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <p className="text-stone-600 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-stone-500">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-stone-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Free plan button: disabled, no action */}
                {!plan.priceId ? (
  <Link
    href="/"
    className="w-full inline-block text-center py-3.5 rounded-2xl font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
  >
    Go to Pause
  </Link>
) : (
                  <button
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={loadingTier === plan.priceId}
                    className={`w-full py-3.5 rounded-2xl font-medium transition-all ${
                      plan.popular
                        ? 'bg-stone-900 text-white hover:bg-stone-800'
                        : 'bg-stone-100 text-stone-900 hover:bg-stone-200'
                    } disabled:opacity-50`}
                  >
                    {loadingTier === plan.priceId ? (
                      'Loading...'
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {plan.cta}
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
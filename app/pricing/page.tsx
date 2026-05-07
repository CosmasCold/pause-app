// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';

const plans = [
  // ... plans array unchanged
];

export default function PricingPage() {
  const router = useRouter();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleSubscribe = async (tier: string) => {
    setLoadingTier(tier);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in first');
      setLoadingTier(null);
      return;
    }

    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId: user.id }),
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

  // JSX stays the same
}
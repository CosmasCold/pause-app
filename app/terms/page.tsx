import Navigation from '@/components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service – Pause',
  description:
    'Terms of service for using Pause, the AI communication coach. Includes acceptable use, subscription terms, and liability limitations.',
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">
          Terms of Service
        </h1>
        <div className="prose prose-stone max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using Pause (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree, you may not use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Pause provides an AI‑powered communication analysis tool that helps users detect cognitive
            biases, emotional tone, and hidden assumptions in their written messages. The Service is
            offered on a free or paid subscription basis.
          </p>

          <h2>3. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to provide accurate and complete information when creating an account.
          </p>

          <h2>4. Payment & Subscriptions</h2>
          <p>
            Paid plans are billed monthly through Stripe. You may cancel at any time; cancellation
            takes effect at the end of the current billing period. Refunds are provided at our sole
            discretion.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>
            You agree not to use the Service for any unlawful purpose or to transmit any content that is
            illegal, harmful, or abusive. We reserve the right to suspend or terminate accounts that
            violate this policy.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            The Pause name, logo, and software are the property of Pause. User data and uploaded content
            remain the property of the user.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. Pause shall
            not be liable for any indirect, incidental, or consequential damages arising from the use
            of the Service.
          </p>

          <h2>8. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the new Terms.
          </p>

          <h2>9. Contact</h2>
          <p>
            For questions about these Terms, visit our{' '}
            <Link href="/contact" className="text-teal-600 underline">
              contact page
            </Link>.
          </p>
        </div>
      </main>
    </>
  );
}
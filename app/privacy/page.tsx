import Navigation from '@/components/Navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy – Pause',
  description:
    'How Pause collects, uses, and protects your data. Your text is never stored unless you choose to save it. No human ever reads your messages.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">
          Privacy Policy
        </h1>
        <div className="prose prose-stone max-w-none">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <p>
            Pause (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting
            your privacy. This Privacy Policy explains how we collect, use, and safeguard your
            information when you visit our website and use our services.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li>
              <strong>Account Information:</strong> When you sign in via Google or email, we receive
              your email address and name (if available). We also store your display name and profile
              picture if you provide them.
            </li>
            <li>
              <strong>Usage Data:</strong> We store the text you choose to analyze and save to your
              history. This data is only accessible to you and is never shared with other users.
            </li>
            <li>
              <strong>Payment Information:</strong> If you upgrade to a paid plan, Stripe processes your
              payment details. We do not see or store your credit card information.
            </li>
            <li>
              <strong>Cookies:</strong> We use essential cookies to maintain your session and remember
              your preferences.
            </li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve our services.</li>
            <li>To send you optional weekly communication reports (if enabled).</li>
            <li>To communicate with you about your account and support inquiries.</li>
            <li>To comply with legal obligations and enforce our Terms of Service.</li>
          </ul>

          <h2>Data Storage & Security</h2>
          <p>
            Your data is stored on Supabase, a GDPR‑compliant cloud database. We implement reasonable
            security measures to protect your personal information. Your saved analyses are encrypted at
            rest and in transit.
          </p>

          <h2>Third‑Party Services</h2>
          <p>We use the following third‑party services:</p>
          <ul>
            <li><strong>Supabase</strong> – authentication and database storage.</li>
            <li><strong>Stripe</strong> – payment processing.</li>
            <li><strong>Resend</strong> – transactional email delivery.</li>
          </ul>
          <p>
            Each of these services has its own privacy policy, and we encourage you to review them.
          </p>

          <p>
  <strong>AI Processing:</strong> When you analyze a message, the text is sent to Groq for processing. Groq does not use customer data for training models and deletes it after inference. No human reviews your messages.
</p>

          <h2>Your Rights</h2>
          <p>
            You can request deletion of your data at any time through your Settings page, or by
            contacting us. We will comply within 30 days. You also have the right to access, rectify,
            or export your data.
          </p>

          <h2>Children&rsquo;s Privacy</h2>
          <p>
            Our Service is not intended for children under 13. We do not knowingly collect personal
            information from children.
          </p>

          <h2>Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page
            with an updated revision date.
          </p>

          <h2>Contact</h2>
          <p>
            If you have questions about this policy, visit our{' '}
            <Link href="/contact" className="text-teal-600 underline">
              contact page
            </Link>.
          </p>
        </div>
      </main>
    </>
  );
}
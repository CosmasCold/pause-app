// app/privacy/page.tsx
import Navigation from '@/components/Navigation';

export default function PrivacyPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-playfair font-bold text-stone-800 mb-8">Privacy Policy</h1>
        <div className="prose prose-stone">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <p>
            Pause (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our services.
          </p>
          <h2>Information We Collect</h2>
          <ul>
            <li><strong>Account Information:</strong> When you sign in via Google or email, we receive your email address and name (if available).</li>
            <li><strong>Usage Data:</strong> We store the text you choose to analyze and save to your history. This data is only accessible to you and is never shared.</li>
            <li><strong>Cookies:</strong> We use essential cookies to maintain your session and remember your preferences.</li>
          </ul>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide, maintain, and improve our services.</li>
            <li>To send you optional weekly communication reports (if enabled).</li>
            <li>To communicate with you about your account and support inquiries.</li>
          </ul>
          <h2>Data Storage & Security</h2>
          <p>
            Your data is stored on Supabase, a GDPR‑compliant cloud database. We implement reasonable security measures to protect your personal information.
          </p>
          <h2>Third-Party Services</h2>
          <p>
            We use the following third‑party services:
          </p>
          <ul>
            <li><strong>Supabase</strong> for authentication and database storage.</li>
            <li><strong>Stripe</strong> for payment processing (if you upgrade). Stripe handles your payment details securely; we never see your credit card information.</li>
            <li><strong>Resend</strong> for sending transactional emails (reports).</li>
          </ul>
          <h2>Your Rights</h2>
          <p>
            You can request deletion of your data at any time through your Settings page, or by contacting us. We will comply within 30 days.
          </p>
          <h2>Contact</h2>
          <p>
            If you have questions about this policy, contact us through our <a href="/contact" className="text-teal-600 underline">contact page</a>.
          </p>
        </div>
      </main>
    </>
  );
}
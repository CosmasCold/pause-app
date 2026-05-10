// app/api/send-newsletter/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    // Read newsletter Markdown
    const filePath = path.join(process.cwd(), 'content', 'newsletter', 'latest.md');
    const rawContent = fs.readFileSync(filePath, 'utf-8');

    // Convert simple Markdown to HTML
    const htmlContent = rawContent
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const emailHtml = `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif">
        <div style="background:#0d9488;padding:24px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0">⏸️ Pause Weekly</h1>
        </div>
        <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p>${htmlContent}</p>
        </div>
      </div>
    `;

    // 1. Paid users with reports enabled
    const { data: paidUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email')
      .eq('email_reports', true)
      .neq('tier', 'free');

    // 2. Public newsletter subscribers
    const { data: publicSubscribers } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email');

    // Combine and deduplicate
    const allEmails = new Map<string, string>();

    (paidUsers || []).forEach((u) => {
      if (u.email) allEmails.set(u.email, u.email);
    });

    (publicSubscribers || []).forEach((sub) => {
      if (sub.email) allEmails.set(sub.email, sub.email);
    });

    const recipients = Array.from(allEmails.values());

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No subscribers found' });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
    }

    const results = await Promise.allSettled(
      recipients.map(async (email) => {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Pause Weekly <noreply@pauseapp.space>',
            to: email,
            subject: 'Pause Weekly – Communication Tip',
            html: emailHtml,
          }),
        });
      })
    );

    const successes = results.filter((r) => r.status === 'fulfilled').length;
    const failures = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({
      message: `Newsletter sent: ${successes} successful, ${failures} failed`,
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
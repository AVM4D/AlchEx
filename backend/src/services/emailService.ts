import nodemailer from 'nodemailer';
import { config } from '../utils/config';

// Create reusable transporter – only if SMTP is configured
const isSmtpConfigured = !!(config.smtp.host && config.smtp.user && config.smtp.pass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    })
  : null;

const FROM_ADDRESS = config.smtp.user || 'noreply@alchex.edu';

// ─── Welcome Email ──────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  if (!transporter) {
    console.log(`[Email] SMTP not configured – skipping welcome email to ${to}`);
    return;
  }

  const subject = '🔮 Welcome to AlchEx – Your Student Exchange Journey Begins!';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f1a; color: #e0e0e0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #2a2a4a; }
    .header h1 { margin: 0; font-size: 28px; background: linear-gradient(135deg, #a78bfa, #6d28d9); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .header p { color: #9ca3af; font-size: 14px; margin-top: 4px; }
    .content { padding: 32px 0; }
    .greeting { font-size: 20px; font-weight: 600; color: #c4b5fd; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.7; color: #d1d5db; margin-bottom: 20px; }
    .features { list-style: none; padding: 0; margin: 24px 0; }
    .features li { padding: 12px 16px; margin-bottom: 8px; background: #1a1a2e; border-radius: 8px; border-left: 3px solid #7c3aed; font-size: 14px; }
    .features li strong { color: #a78bfa; }
    .cta { text-align: center; padding: 24px 0; }
    .cta a { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .footer { text-align: center; padding-top: 24px; border-top: 1px solid #2a2a4a; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚗️ AlchEx</h1>
      <p>Non-Monetary Student Exchange Platform</p>
    </div>

    <div class="content">
      <p class="greeting">Welcome aboard, ${firstName}! 🎉</p>

      <p class="text">
        You've just joined <strong>AlchEx</strong> — a platform built exclusively
        for university students to exchange skills, items, and knowledge without
        any money involved. Think of it as academic alchemy!
      </p>

      <p class="text">Here's what you can do right away:</p>

      <ul class="features">
        <li><strong>📦 Create Posts</strong> — List items, skills, or services you'd like to exchange</li>
        <li><strong>🤝 Make & Receive Offers</strong> — Browse the marketplace and propose trades</li>
        <li><strong>💬 Real-Time Chat</strong> — Negotiate with fellow students instantly</li>
        <li><strong>⭐ Build Reputation</strong> — Complete exchanges and earn ratings to climb the leaderboard</li>
        <li><strong>🏆 Leaderboard</strong> — Compete to be the top alchemist on campus</li>
        <li><strong>🔒 Verified Community</strong> — Everyone here is a verified .edu student, just like you</li>
      </ul>

      <div class="cta">
        <a href="${config.cors.origin}/dashboard">Go to Your Dashboard →</a>
      </div>

      <p class="text" style="font-size: 13px; color: #9ca3af;">
        Tip: Start by creating your first post or browsing the marketplace.
        The more you exchange, the higher your reputation grows!
      </p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} AlchEx · Built for students, by students</p>
      <p>You received this email because you signed up at AlchEx.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Welcome to AlchEx, ${firstName}!

You've just joined AlchEx — a platform built exclusively for university students
to exchange skills, items, and knowledge without any money involved.

Here's what you can do:
• Create Posts — List items, skills, or services you'd like to exchange
• Make & Receive Offers — Browse the marketplace and propose trades
• Real-Time Chat — Negotiate with fellow students instantly
• Build Reputation — Complete exchanges and earn ratings
• Leaderboard — Compete to be the top alchemist on campus

Get started: ${config.cors.origin}/dashboard

Happy exchanging!
— The AlchEx Team
  `.trim();

  try {
    await transporter.sendMail({
      from: `"AlchEx" <${FROM_ADDRESS}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error) {
    // Don't block registration if email fails
    console.error(`[Email] Failed to send welcome email to ${to}:`, error);
  }
}

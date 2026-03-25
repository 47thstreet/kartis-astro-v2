import type { APIRoute } from 'astro';
import { transporter } from '../../lib/email';

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const { name, email, venue, message } = body ?? {};
  if (!name || !email) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });

  const to = process.env.DEMO_EMAIL_TO || process.env.SMTP_USER || 'demo@localhost.local';

  await transporter.sendMail({
    from: 'Kartis Demo <noreply@kartis.app>',
    to,
    subject: `Demo request from ${name}`,
    text: `Name: ${name}\nEmail: ${email}\nVenue: ${venue}\n${message ?? ''}`,
  });

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

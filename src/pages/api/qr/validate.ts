import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { publish } from '../../../lib/pusher';
import { rateLimit } from '../../../lib/rate-limit';

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!rateLimit('qr-validate', ip, 60, 60_000)) return new Response(JSON.stringify({ ok: false, error: 'Rate limit' }), { status: 429 });

  let body: any;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 }); }

  const { qrToken } = body ?? {};
  if (!qrToken) return new Response(JSON.stringify({ ok: false, error: 'Missing qrToken' }), { status: 400 });

  const pass = await prisma.guestPass.findUnique({ where: { qrToken }, include: { order: { include: { event: true } } } });
  if (!pass) return new Response(JSON.stringify({ ok: false, valid: false, message: 'Token not found' }), { status: 404 });
  if (pass.usedAt) return new Response(JSON.stringify({ ok: true, valid: false, message: 'Already used', usedAt: pass.usedAt }));

  await prisma.guestPass.update({ where: { id: pass.id }, data: { usedAt: new Date() } });

  // Push real-time check-in event to live ops
  const eventId = pass.order.eventId;
  publish(`event-${eventId}`, 'guest-checkin', {
    passId: pass.id,
    attendeeName: pass.attendeeName,
  }).catch(() => {});

  return new Response(JSON.stringify({ ok: true, valid: true, message: `Welcome, ${pass.attendeeName ?? 'guest'}!` }));
};

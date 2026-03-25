import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getStripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { rateLimit } from '../../../lib/rate-limit';
import * as Sentry from '@sentry/node';

const schema = z.object({
  eventId: z.string().min(1),
  email: z.string().email(),
  locale: z.string().default('en'),
  tickets: z.array(z.object({
    ticketTypeId: z.string().min(1),
    quantity: z.number().int().min(1).max(10),
  })).default([]),
  tables: z.array(z.object({
    tablePackageId: z.string().min(1),
    quantity: z.number().int().min(1).max(4),
  })).default([]),
});

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  if (!rateLimit('checkout', ip, 10, 60_000)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: JSON_HEADERS });
  }

  const { eventId, email, locale, tickets, tables } = parsed.data;

  if (tickets.length === 0 && tables.length === 0) {
    return new Response(JSON.stringify({ error: 'Select at least one ticket or table' }), { status: 400, headers: JSON_HEADERS });
  }

  const stripe = getStripe();
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 503, headers: JSON_HEADERS });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: true, tablePackages: true },
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: JSON_HEADERS });
    }

    const lineItems: any[] = [];

    for (const item of tickets) {
      const tt = event.ticketTypes.find((t: any) => t.id === item.ticketTypeId);
      if (!tt) {
        return new Response(JSON.stringify({ error: `Ticket type not found: ${item.ticketTypeId}` }), { status: 400, headers: JSON_HEADERS });
      }
      const remaining = tt.capacity - tt.soldCount;
      if (item.quantity > remaining) {
        return new Response(JSON.stringify({ error: `Not enough tickets for ${tt.name}. ${remaining} remaining.` }), { status: 400, headers: JSON_HEADERS });
      }
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: event.currency.toLowerCase(),
          unit_amount: tt.priceCents,
          product_data: { name: `${tt.name} — ${event.name}` },
        },
      });
    }

    for (const item of tables) {
      const tp = event.tablePackages.find((t: any) => t.id === item.tablePackageId);
      if (!tp) {
        return new Response(JSON.stringify({ error: `Table package not found: ${item.tablePackageId}` }), { status: 400, headers: JSON_HEADERS });
      }
      lineItems.push({
        quantity: item.quantity,
        price_data: {
          currency: event.currency.toLowerCase(),
          unit_amount: tp.priceCents,
          product_data: { name: `${tp.name} — ${event.name}` },
        },
      });
    }

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3031';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: lineItems,
      metadata: {
        eventId,
        email,
        orderType: 'kartis',
        ticketItems: JSON.stringify(tickets),
        tableItems: JSON.stringify(tables),
      },
      success_url: `${appUrl}/${locale}/checkout/external/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/event/${eventId}?canceled=1`,
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), { headers: JSON_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    Sentry.captureException(err, { tags: { source: 'checkout_create_session' } });
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: JSON_HEADERS });
  }
};

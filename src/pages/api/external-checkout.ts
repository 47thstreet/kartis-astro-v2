import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getStripe } from '../../lib/stripe';

const schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  eventName: z.string().min(1),
  priceCents: z.number().int().nonnegative(),
  currency: z.string().length(3),
  supplierRef: z.string().optional(),
});

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });

  const { fullName, email, phone, eventName, priceCents, currency, supplierRef } = parsed.data;
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3031';

  // Free RSVP flow — skip Stripe
  if (priceCents === 0) {
    const params = new URLSearchParams({
      rsvp: '1',
      name: fullName,
      email,
      phone,
      event: eventName,
    });
    return new Response(
      JSON.stringify({ checkoutUrl: `${appUrl}/en/checkout/external/success?${params}` }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Paid flow — Stripe checkout
  const stripe = getStripe();
  if (!stripe) return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 503 });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    line_items: [{ quantity: 1, price_data: { currency: currency.toLowerCase(), unit_amount: priceCents, product_data: { name: eventName } } }],
    metadata: { orderType: 'external', customerName: fullName, customerEmail: email, customerPhone: phone, eventName, supplierRef: supplierRef ?? '' },
    success_url: `${appUrl}/en/checkout/external/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/en/checkout/external?canceled=1`,
  });

  return new Response(JSON.stringify({ checkoutUrl: session.url }), { headers: { 'Content-Type': 'application/json' } });
};

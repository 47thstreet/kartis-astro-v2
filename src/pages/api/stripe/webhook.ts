import type { APIRoute } from 'astro';
import { getStripe } from '../../../lib/stripe';
import { prisma } from '../../../lib/prisma';
import { transporter } from '../../../lib/email';
import { writeAuditLog } from '../../../lib/audit';
import { publish } from '../../../lib/pusher';
import { getCommissionRate } from '../../../lib/commission';
import * as Sentry from '@sentry/node';
import crypto from 'node:crypto';

export const POST: APIRoute = async ({ request }) => {
  const stripe = getStripe();
  if (!stripe) {
    return new Response('Stripe not configured', { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown';
    Sentry.captureException(err, { tags: { source: 'stripe_webhook', step: 'signature_verification' } });
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;
      default:
        // Unhandled event type — ignore silently
        break;
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { source: 'stripe_webhook', event_type: event.type } });
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};

// --- checkout.session.completed ---
async function handleCheckoutCompleted(session: any) {
  const meta = session.metadata ?? {};

  if (meta.orderType === 'external') {
    // External checkout — no Order row to update
    Sentry.addBreadcrumb({ message: 'External checkout completed', data: { sessionId: session.id } });
    return;
  }

  if (meta.orderType !== 'kartis') return;

  // Find or create the Order
  const { eventId, email } = meta;
  const ticketItems = JSON.parse(meta.ticketItems || '[]');
  const tableItems = JSON.parse(meta.tableItems || '[]');

  // Check if order already exists for this session
  let order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (order && order.status === 'PAID') {
    // Already processed (idempotent)
    return;
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { ticketTypes: true, tablePackages: true },
  });

  if (!event) {
    Sentry.captureMessage(`Webhook: Event not found: ${eventId}`, 'warning');
    return;
  }

  // Build order items and calculate totals
  const orderItems: Array<{
    type: 'TICKET' | 'TABLE';
    ticketTypeId?: string;
    tablePackageId?: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }> = [];

  for (const item of ticketItems) {
    const tt = event.ticketTypes.find((t) => t.id === item.ticketTypeId);
    if (!tt) continue;
    orderItems.push({
      type: 'TICKET',
      ticketTypeId: tt.id,
      quantity: item.quantity,
      unitPriceCents: tt.priceCents,
      totalCents: tt.priceCents * item.quantity,
    });
  }

  for (const item of tableItems) {
    const tp = event.tablePackages.find((t) => t.id === item.tablePackageId);
    if (!tp) continue;
    orderItems.push({
      type: 'TABLE',
      tablePackageId: tp.id,
      quantity: item.quantity,
      unitPriceCents: tp.priceCents,
      totalCents: tp.priceCents * item.quantity,
    });
  }

  const subtotalCents = orderItems.reduce((sum, i) => sum + i.totalCents, 0);

  // Create or update order in a transaction
  const result = await prisma.$transaction(async (tx) => {
    let ord;

    if (order) {
      // Update existing PENDING order
      ord = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          stripePaymentIntentId: session.payment_intent,
        },
      });
    } else {
      // Create new order
      ord = await tx.order.create({
        data: {
          eventId,
          email,
          status: 'PAID',
          subtotalCents,
          feesCents: 0,
          taxCents: 0,
          totalCents: subtotalCents,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          items: {
            create: orderItems.map((item) => ({
              type: item.type,
              ticketTypeId: item.ticketTypeId ?? null,
              tablePackageId: item.tablePackageId ?? null,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              totalCents: item.totalCents,
            })),
          },
        },
      });
    }

    // Update sold counts for tickets
    for (const item of ticketItems) {
      await tx.ticketType.update({
        where: { id: item.ticketTypeId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    // Generate QR guest passes (one per ticket)
    const passes: Array<{ attendeeName: string; attendeeEmail: string; qrToken: string }> = [];
    for (const item of ticketItems) {
      for (let i = 0; i < item.quantity; i++) {
        passes.push({
          attendeeName: email.split('@')[0],
          attendeeEmail: email,
          qrToken: crypto.randomUUID(),
        });
      }
    }
    // One pass per table package too
    for (const item of tableItems) {
      for (let i = 0; i < item.quantity; i++) {
        passes.push({
          attendeeName: email.split('@')[0],
          attendeeEmail: email,
          qrToken: crypto.randomUUID(),
        });
      }
    }

    if (passes.length > 0) {
      await tx.guestPass.createMany({
        data: passes.map((p) => ({ orderId: ord.id, ...p })),
      });
    }

    // Update promoter link stats if applicable
    if (ord.promoterLinkId) {
      await tx.promoterLink.update({
        where: { id: ord.promoterLinkId },
        data: {
          conversions: { increment: 1 },
          revenueCents: { increment: subtotalCents },
        },
      });

      // Create commission ledger entry
      const link = await tx.promoterLink.findUnique({
        where: { id: ord.promoterLinkId },
        include: { event: { include: { commissionRuleProfile: true } } },
      });

      if (link) {
        const rules = (link.event.commissionRuleProfile?.rulesJson as any[]) ?? [];
        const rate = getCommissionRate(rules, subtotalCents);
        if (rate > 0) {
          const commissionCents = Math.round(subtotalCents * rate);
          await tx.commissionLedger.create({
            data: {
              promoterId: link.promoterId,
              orderId: ord.id,
              amountCents: commissionCents,
              status: 'PENDING',
            },
          });
        }
      }
    }

    return { order: ord, passCount: passes.length };
  });

  // Send confirmation email (non-blocking)
  sendConfirmationEmail(email, event.name, result.passCount, result.order.id).catch((err) =>
    Sentry.captureException(err, { tags: { source: 'stripe_webhook', step: 'email_send' } })
  );

  await writeAuditLog({
    action: 'ORDER_PAID',
    entityType: 'Order',
    entityId: result.order.id,
    payload: { sessionId: session.id, totalCents: subtotalCents },
  });

  // Push real-time update to live ops dashboard
  publish(`event-${eventId}`, 'order-paid', {
    orderId: result.order.id,
    totalCents: subtotalCents,
    passCount: result.passCount,
    email,
  }).catch((err) => Sentry.captureException(err, { tags: { source: 'stripe_webhook', step: 'pusher_publish' } }));

  Sentry.addBreadcrumb({ message: `Order ${result.order.id} paid — ${result.passCount} passes generated` });
}

// --- checkout.session.expired ---
async function handleCheckoutExpired(session: any) {
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });

  if (order && order.status === 'PENDING') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    });

    await writeAuditLog({
      action: 'ORDER_EXPIRED',
      entityType: 'Order',
      entityId: order.id,
      payload: { sessionId: session.id },
    });
  }
}

// --- charge.refunded ---
async function handleRefund(charge: any) {
  const paymentIntentId = charge.payment_intent;
  if (!paymentIntentId) return;

  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (order && order.status === 'PAID') {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'REFUNDED' },
    });

    await writeAuditLog({
      action: 'ORDER_REFUNDED',
      entityType: 'Order',
      entityId: order.id,
      payload: { chargeId: charge.id },
    });
  }
}

// --- Helpers ---

async function sendConfirmationEmail(
  to: string,
  eventName: string,
  passCount: number,
  orderId: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Kartis <hello@kartis.app>',
    to,
    subject: `Your tickets for ${eventName} ✓`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>You're in! 🎉</h2>
        <p>Your order for <strong>${eventName}</strong> is confirmed.</p>
        <p>You have <strong>${passCount}</strong> pass${passCount !== 1 ? 'es' : ''}.</p>
        <p>Order ID: <code>${orderId}</code></p>
        <p>Your QR pass${passCount !== 1 ? 'es' : ''} will be at the door. Show your email at check-in.</p>
        <p style="margin-top: 24px; color: #888;">— Kartis</p>
      </div>
    `,
  });
}

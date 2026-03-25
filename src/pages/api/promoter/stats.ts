import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// GET — promoter dashboard stats (links, clicks, conversions, commission balance)
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const promoter = await prisma.promoter.findUnique({
    where: { userId: user.id },
    include: {
      links: {
        include: { event: { select: { id: true, name: true, startsAt: true } } },
        orderBy: { createdAt: 'desc' },
      },
      ledgers: true,
    },
  });

  if (!promoter) {
    return new Response(JSON.stringify({ error: 'Promoter profile not found' }), { status: 404, headers: JSON_HEADERS });
  }

  const totalClicks = promoter.links.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = promoter.links.reduce((s, l) => s + l.conversions, 0);
  const totalRevenueCents = promoter.links.reduce((s, l) => s + l.revenueCents, 0);

  const pendingCommissionCents = promoter.ledgers
    .filter((l) => l.status === 'PENDING')
    .reduce((s, l) => s + l.amountCents, 0);

  const paidCommissionCents = promoter.ledgers
    .filter((l) => l.status === 'PAID')
    .reduce((s, l) => s + l.amountCents, 0);

  return new Response(JSON.stringify({
    data: {
      promoterId: promoter.id,
      displayName: promoter.displayName,
      payoutMethod: promoter.payoutMethod,
      totalClicks,
      totalConversions,
      totalRevenueCents,
      pendingCommissionCents,
      paidCommissionCents,
      links: promoter.links.map((l) => ({
        id: l.id,
        code: l.code,
        eventId: l.eventId,
        eventName: l.event.name,
        eventDate: l.event.startsAt,
        clicks: l.clicks,
        conversions: l.conversions,
        revenueCents: l.revenueCents,
      })),
    },
  }), { headers: JSON_HEADERS });
};

import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// GET /api/reports/event?eventId=xxx — event sales report
export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const eventId = url.searchParams.get('eventId');
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'eventId required' }), { status: 400, headers: JSON_HEADERS });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      venue: { select: { name: true } },
      ticketTypes: true,
      tablePackages: true,
      orders: {
        include: { items: true, passes: true, promoterLink: { select: { code: true, promoter: { select: { displayName: true } } } } },
      },
      promoterLinks: {
        include: { promoter: { select: { displayName: true } } },
      },
    },
  });

  if (!event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: JSON_HEADERS });
  }

  const paidOrders = event.orders.filter((o) => o.status === 'PAID');
  const refundedOrders = event.orders.filter((o) => o.status === 'REFUNDED');

  // Revenue
  const grossRevenueCents = paidOrders.reduce((s, o) => s + o.totalCents, 0);
  const refundedCents = refundedOrders.reduce((s, o) => s + o.totalCents, 0);
  const netRevenueCents = grossRevenueCents - refundedCents;

  // Tickets sold by type
  const ticketSales = event.ticketTypes.map((tt) => ({
    id: tt.id,
    name: tt.name,
    priceCents: tt.priceCents,
    capacity: tt.capacity,
    sold: tt.soldCount,
    revenueCents: tt.priceCents * tt.soldCount,
    utilization: tt.capacity > 0 ? Math.round((tt.soldCount / tt.capacity) * 100) : 0,
  }));

  // Table packages sold
  const tableSales = event.tablePackages.map((tp) => {
    const sold = paidOrders.reduce((s, o) =>
      s + o.items.filter((i) => i.tablePackageId === tp.id).reduce((ss, i) => ss + i.quantity, 0), 0);
    return {
      id: tp.id,
      name: tp.name,
      priceCents: tp.priceCents,
      sold,
      revenueCents: tp.priceCents * sold,
    };
  });

  // Check-in stats
  const totalPasses = paidOrders.reduce((s, o) => s + o.passes.length, 0);
  const checkedIn = paidOrders.reduce((s, o) => s + o.passes.filter((p) => p.usedAt).length, 0);

  // Promoter performance
  const promoterStats = event.promoterLinks.map((link) => ({
    code: link.code,
    promoterName: link.promoter.displayName,
    clicks: link.clicks,
    conversions: link.conversions,
    revenueCents: link.revenueCents,
    conversionRate: link.clicks > 0 ? Math.round((link.conversions / link.clicks) * 100) : 0,
  }));

  // Orders over time (group by day)
  const ordersByDay: Record<string, { count: number; revenueCents: number }> = {};
  for (const order of paidOrders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    if (!ordersByDay[day]) ordersByDay[day] = { count: 0, revenueCents: 0 };
    ordersByDay[day].count++;
    ordersByDay[day].revenueCents += order.totalCents;
  }

  return new Response(JSON.stringify({
    data: {
      event: { id: event.id, name: event.name, venue: event.venue.name, startsAt: event.startsAt, endsAt: event.endsAt, capacity: event.capacity },
      revenue: { grossCents: grossRevenueCents, refundedCents, netCents: netRevenueCents },
      orders: { total: event.orders.length, paid: paidOrders.length, pending: event.orders.filter((o) => o.status === 'PENDING').length, refunded: refundedOrders.length, failed: event.orders.filter((o) => o.status === 'FAILED').length },
      ticketSales,
      tableSales,
      checkIn: { totalPasses, checkedIn, rate: totalPasses > 0 ? Math.round((checkedIn / totalPasses) * 100) : 0 },
      promoterStats,
      ordersByDay: Object.entries(ordersByDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, data]) => ({ date, ...data })),
    },
  }), { headers: JSON_HEADERS });
};

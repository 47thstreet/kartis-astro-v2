import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';
import { writeAuditLog } from '../../../lib/audit';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const createEventSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).default(''),
  venueId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  capacity: z.number().int().min(1).max(100000),
  currency: z.string().length(3).default('USD'),
  flyerImage: z.string().url().optional(),
  tickets: z.array(z.object({
    name: z.string().min(1),
    description: z.string().default(''),
    priceCents: z.number().int().nonnegative(),
    capacity: z.number().int().min(1),
    saleStart: z.string().min(1),
    saleEnd: z.string().min(1),
  })).default([]),
});

// GET — list events for organizer
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const events = await prisma.event.findMany({
    include: { venue: true, ticketTypes: true, _count: { select: { orders: true } } },
    orderBy: { startsAt: 'desc' },
  });

  return new Response(JSON.stringify({ data: events }), { headers: JSON_HEADERS });
};

// POST — create event with ticket types
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: JSON_HEADERS });
  }

  const data = parsed.data;

  // Verify venue exists
  const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
  if (!venue) {
    return new Response(JSON.stringify({ error: 'Venue not found' }), { status: 404, headers: JSON_HEADERS });
  }

  // Generate slug from name
  const baseSlug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const event = await prisma.event.create({
    data: {
      name: data.name,
      slug,
      description: data.description,
      venueId: data.venueId,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      capacity: data.capacity,
      currency: data.currency,
      flyerImage: data.flyerImage ?? null,
      isPublished: false,
      ticketTypes: {
        create: data.tickets.map((t) => ({
          name: t.name,
          description: t.description,
          priceCents: t.priceCents,
          capacity: t.capacity,
          saleStart: new Date(t.saleStart),
          saleEnd: new Date(t.saleEnd),
        })),
      },
    },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'EVENT_CREATED',
    entityType: 'Event',
    entityId: event.id,
    payload: { name: event.name, venueId: data.venueId },
  });

  return new Response(JSON.stringify({ data: event }), { status: 201, headers: JSON_HEADERS });
};

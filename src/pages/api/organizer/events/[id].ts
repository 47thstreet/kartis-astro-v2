import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';
import { getSession } from 'auth-astro/server';
import { writeAuditLog } from '../../../../lib/audit';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const updateEventSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  capacity: z.number().int().min(1).max(100000).optional(),
  flyerImage: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
});

// PUT — update event
export const PUT: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const { id } = params;
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: JSON_HEADERS });
  }

  const data = parsed.data;
  const updateData: any = { ...data };
  if (data.startsAt) updateData.startsAt = new Date(data.startsAt);
  if (data.endsAt) updateData.endsAt = new Date(data.endsAt);

  const event = await prisma.event.update({ where: { id }, data: updateData });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'EVENT_UPDATED',
    entityType: 'Event',
    entityId: event.id,
    payload: data,
  });

  return new Response(JSON.stringify({ data: event }), { headers: JSON_HEADERS });
};

// DELETE — delete event
export const DELETE: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const { id } = params;
  await prisma.event.delete({ where: { id } });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'EVENT_DELETED',
    entityType: 'Event',
    entityId: id!,
    payload: {},
  });

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

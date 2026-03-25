import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const saveSchema = z.object({
  layoutId: z.string().min(1),
  zones: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
  })),
  tables: z.array(z.object({
    id: z.string(),
    x: z.number(),
    y: z.number(),
    number: z.string(),
    status: z.string(),
  })),
});

// POST — save layout (zones + tables positions)
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400 });
  }

  const { layoutId, zones, tables } = parsed.data;

  // Verify layout exists
  const layout = await prisma.venueMapLayout.findUnique({ where: { id: layoutId } });
  if (!layout) {
    return new Response(JSON.stringify({ error: 'Layout not found' }), { status: 404 });
  }

  // Update zone and table positions in a transaction
  await prisma.$transaction(async (tx) => {
    for (const zone of zones) {
      await tx.venueZone.update({
        where: { id: zone.id },
        data: { x: zone.x, y: zone.y, width: zone.width, height: zone.height },
      });
    }

    for (const table of tables) {
      await tx.venueTable.update({
        where: { id: table.id },
        data: { x: table.x, y: table.y },
      });
    }

    await tx.venueMapLayout.update({
      where: { id: layoutId },
      data: { updatedAt: new Date() },
    });
  });

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

// GET — load layout by id (?layoutId=xxx)
export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const layoutId = url.searchParams.get('layoutId');
  if (!layoutId) {
    return new Response(JSON.stringify({ error: 'layoutId required' }), { status: 400, headers: JSON_HEADERS });
  }

  const layout = await prisma.venueMapLayout.findUnique({
    where: { id: layoutId },
    include: { zones: true, tables: true },
  });

  if (!layout) {
    return new Response(JSON.stringify({ error: 'Layout not found' }), { status: 404, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ data: layout }), { headers: JSON_HEADERS });
};

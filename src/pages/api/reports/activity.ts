import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// GET /api/reports/activity?limit=50&cursor=xxx
export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const limit = Math.min(Number(url.searchParams.get('limit') || 50), 100);
  const cursor = url.searchParams.get('cursor') || undefined;

  const logs = await prisma.auditLog.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { name: true, email: true } } },
  });

  const hasMore = logs.length > limit;
  const items = hasMore ? logs.slice(0, limit) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return new Response(JSON.stringify({
    data: items.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      actor: log.actor ? { name: log.actor.name, email: log.actor.email } : null,
      createdAt: log.createdAt,
    })),
    nextCursor,
  }), { headers: JSON_HEADERS });
};

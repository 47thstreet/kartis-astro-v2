import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';
import { writeAuditLog } from '../../../lib/audit';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// POST — promoter requests payout of pending commissions
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  const promoter = await prisma.promoter.findUnique({ where: { userId: user.id } });
  if (!promoter) {
    return new Response(JSON.stringify({ error: 'Promoter profile not found' }), { status: 404, headers: JSON_HEADERS });
  }

  if (!promoter.payoutMethod) {
    return new Response(JSON.stringify({ error: 'Set a payout method before requesting payout' }), { status: 400, headers: JSON_HEADERS });
  }

  // Mark all PENDING ledger entries as PROCESSING
  const pendingEntries = await prisma.commissionLedger.findMany({
    where: { promoterId: promoter.id, status: 'PENDING' },
  });

  if (pendingEntries.length === 0) {
    return new Response(JSON.stringify({ error: 'No pending commissions' }), { status: 400, headers: JSON_HEADERS });
  }

  const totalCents = pendingEntries.reduce((s, e) => s + e.amountCents, 0);

  await prisma.commissionLedger.updateMany({
    where: { promoterId: promoter.id, status: 'PENDING' },
    data: { status: 'PROCESSING' },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'PAYOUT_REQUESTED',
    entityType: 'Promoter',
    entityId: promoter.id,
    payload: { totalCents, entryCount: pendingEntries.length },
  });

  return new Response(JSON.stringify({
    data: {
      totalCents,
      entryCount: pendingEntries.length,
      status: 'PROCESSING',
    },
  }), { headers: JSON_HEADERS });
};

// PATCH — organizer/admin approves payout (marks PROCESSING → PAID)
const approveSchema = z.object({
  promoterId: z.string().min(1),
});

export const PATCH: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: JSON_HEADERS });
  }

  const { promoterId } = parsed.data;

  const result = await prisma.commissionLedger.updateMany({
    where: { promoterId, status: 'PROCESSING' },
    data: { status: 'PAID' },
  });

  await writeAuditLog({
    actorUserId: user.id,
    action: 'PAYOUT_APPROVED',
    entityType: 'Promoter',
    entityId: promoterId,
    payload: { entriesUpdated: result.count },
  });

  return new Response(JSON.stringify({
    data: { entriesUpdated: result.count, status: 'PAID' },
  }), { headers: JSON_HEADERS });
};

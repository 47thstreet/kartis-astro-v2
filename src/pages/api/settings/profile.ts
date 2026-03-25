import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';
import bcrypt from 'bcryptjs';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(128).optional(),
}).refine((data) => {
  if (data.newPassword && !data.currentPassword) return false;
  return true;
}, { message: 'Current password required to set new password' });

// PATCH — update user profile
export const PATCH: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || 'Invalid request' }), { status: 400, headers: JSON_HEADERS });
  }

  const data = parsed.data;
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: JSON_HEADERS });
  }

  const updates: any = {};

  if (data.name) {
    updates.name = data.name;
  }

  if (data.newPassword && data.currentPassword) {
    if (!dbUser.passwordHash) {
      return new Response(JSON.stringify({ error: 'No password set on this account' }), { status: 400, headers: JSON_HEADERS });
    }
    const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
    if (!valid) {
      return new Response(JSON.stringify({ error: 'Current password is incorrect' }), { status: 400, headers: JSON_HEADERS });
    }
    updates.passwordHash = await bcrypt.hash(data.newPassword, 10);
  }

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ error: 'Nothing to update' }), { status: 400, headers: JSON_HEADERS });
  }

  await prisma.user.update({ where: { id: user.id }, data: updates });

  return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
};

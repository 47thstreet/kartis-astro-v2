import type { APIRoute } from 'astro';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma';
import { getSession } from 'auth-astro/server';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const siteSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  tagline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  heroImage: z.string().url().nullable().optional(),
  logoImage: z.string().url().nullable().optional(),
  socialLinks: z.record(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

// GET — get promoter's site config
export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['PROMOTER', 'ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const promoter = await prisma.promoter.findUnique({
    where: { userId: user.id },
    include: { site: true },
  });

  if (!promoter) {
    return new Response(JSON.stringify({ error: 'Promoter not found' }), { status: 404, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ data: promoter.site }), { headers: JSON_HEADERS });
};

// POST — create or update promoter site
export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  const user = session?.user as any;
  if (!user?.id || !['PROMOTER', 'ORGANIZER', 'SUPER_ADMIN'].includes(user.role)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: JSON_HEADERS });
  }

  const promoter = await prisma.promoter.findUnique({ where: { userId: user.id } });
  if (!promoter) {
    return new Response(JSON.stringify({ error: 'Promoter not found' }), { status: 404, headers: JSON_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: JSON_HEADERS });
  }

  const parsed = siteSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }), { status: 400, headers: JSON_HEADERS });
  }

  const data = parsed.data;

  const site = await prisma.promoterSite.upsert({
    where: { promoterId: promoter.id },
    create: { promoterId: promoter.id, ...data },
    update: data,
  });

  return new Response(JSON.stringify({ data: site }), { headers: JSON_HEADERS });
};

import type { APIRoute } from 'astro';
import { updateEvent, deleteEvent } from '../../../../lib/cms-db';

const SECRET = import.meta.env.ADMIN_SECRET ?? 'tbp-admin-2024';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function authorized(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${SECRET}`;
}

const unauth = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const PUT: APIRoute = async ({ params, request }) => {
  if (!authorized(request)) return unauth();
  const { id } = params;
  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400, headers: CORS_HEADERS });
  const ok = await updateEvent(id!, body);
  if (!ok) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: CORS_HEADERS });
  return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  if (!authorized(request)) return unauth();
  const { id } = params;
  const ok = await deleteEvent(id!);
  if (!ok) return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: CORS_HEADERS });
  return new Response(JSON.stringify({ success: true }), { headers: CORS_HEADERS });
};

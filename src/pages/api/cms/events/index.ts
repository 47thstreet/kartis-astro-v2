import type { APIRoute } from 'astro';
import { readEvents, createEvent } from '../../../../lib/cms-db';

const SECRET = import.meta.env.ADMIN_SECRET ?? 'tbp-admin-2024';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function authorized(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${SECRET}`;
}

const unauth = () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) return unauth();
  const events = await readEvents();
  return new Response(JSON.stringify(events), { headers: CORS_HEADERS });
};

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) return unauth();
  const body = await request.json().catch(() => null);
  if (!body || !body.name || !body.date) {
    return new Response(JSON.stringify({ error: 'name and date are required' }), { status: 400, headers: CORS_HEADERS });
  }
  const newEvent = await createEvent(body);
  return new Response(JSON.stringify(newEvent), { status: 201, headers: CORS_HEADERS });
};

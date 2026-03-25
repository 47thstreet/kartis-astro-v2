import type { APIRoute } from 'astro';
import { readEvents } from '../../../lib/cms-db';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=30',
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const GET: APIRoute = async () => {
  const events = await readEvents();
  return new Response(JSON.stringify(events), { headers: CORS_HEADERS });
};

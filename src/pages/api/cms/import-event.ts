import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';

const SECRET = import.meta.env.ADMIN_SECRET ?? 'tbp-admin-2024';

const CORS_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function authorized(request: Request): boolean {
  const auth = request.headers.get('authorization') ?? '';
  return auth === `Bearer ${SECRET}`;
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS_HEADERS });

export const POST: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS_HEADERS });
  }

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS });
  }

  const url = body?.url;
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: CORS_HEADERS });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; KartisBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr('content') ?? '';
    const meta = (name: string) => $(`meta[name="${name}"]`).attr('content') ?? '';

    const name = og('title') || $('title').text().trim() || '';
    const description = og('description') || meta('description') || '';
    const imageUrl = og('image') || '';

    const startTime = $('meta[property="event:start_time"]').attr('content')
      ?? $('meta[property="article:published_time"]').attr('content')
      ?? '';

    let locationName = $('meta[property="event:location"]').attr('content') ?? '';

    let date = '';
    let time = '';
    if (startTime) {
      try {
        const d = new Date(startTime);
        date = d.toISOString().slice(0, 10);
        time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      } catch { /* ignore */ }
    }

    // Try JSON-LD structured data
    const jsonLdScripts = $('script[type="application/ld+json"]');
    jsonLdScripts.each((_, el) => {
      try {
        const data = JSON.parse($(el).html() ?? '');
        const events = Array.isArray(data) ? data : [data];
        for (const item of events) {
          if (item['@type'] === 'Event' || item['@type']?.includes?.('Event')) {
            if (!date && item.startDate) {
              try {
                const d = new Date(item.startDate);
                date = d.toISOString().slice(0, 10);
                time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              } catch { /* ignore */ }
            }
            if (item.location && !locationName) {
              locationName = typeof item.location === 'string' ? item.location : item.location.name ?? '';
            }
          }
        }
      } catch { /* ignore malformed JSON-LD */ }
    });

    const result: Record<string, any> = {};
    if (name) result.name = name;
    if (description) result.description = description;
    if (imageUrl) result.imageUrl = imageUrl;
    if (date) result.date = date;
    if (time) result.time = time;
    if (locationName) result.venue = locationName;

    return new Response(JSON.stringify(result), { headers: CORS_HEADERS });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: `Failed to fetch URL: ${message}` }), { status: 500, headers: CORS_HEADERS });
  }
};

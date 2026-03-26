import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };

export const GET: APIRoute = async () => {
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  // Check database connectivity
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = { status: 'error', latencyMs: Date.now() - dbStart, error: err instanceof Error ? err.message : 'DB unreachable' };
  }

  // Check Stripe API key is configured
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  checks.stripe = stripeKey ? { status: 'ok' } : { status: 'error', error: 'STRIPE_SECRET_KEY not configured' };

  // Check auth secret
  const authSecret = process.env.AUTH_SECRET;
  checks.auth = authSecret ? { status: 'ok' } : { status: 'error', error: 'AUTH_SECRET not configured' };

  const overall = Object.values(checks).every(c => c.status === 'ok') ? 'healthy' : 'degraded';

  return new Response(JSON.stringify({
    service: 'kartis',
    status: overall,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    checks,
  }), {
    status: overall === 'healthy' ? 200 : 503,
    headers: JSON_HEADERS,
  });
};

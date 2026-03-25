const buckets = new Map<string, Map<string, { count: number; ts: number }>>();

/**
 * In-memory rate limiter. Returns true if allowed, false if over limit.
 * @param namespace - Separate bucket per endpoint (e.g. 'auth', 'checkout')
 * @param key - Unique key per client (usually IP)
 * @param maxRequests - Max requests per window (default 10)
 * @param windowMs - Time window in ms (default 60s)
 */
export function rateLimit(
  namespace: string,
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
): boolean {
  if (!buckets.has(namespace)) buckets.set(namespace, new Map());
  const bucket = buckets.get(namespace)!;
  const now = Date.now();
  const rec = bucket.get(key);

  if (!rec || now - rec.ts > windowMs) {
    bucket.set(key, { count: 1, ts: now });
    return true;
  }
  if (rec.count >= maxRequests) return false;
  rec.count += 1;
  return true;
}

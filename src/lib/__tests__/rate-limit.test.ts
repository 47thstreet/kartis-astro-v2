import { describe, it, expect } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    for (let i = 0; i < 5; i++) {
      expect(rateLimit('test-allow', 'ip-1', 5, 60_000)).toBe(true);
    }
  });

  it('blocks requests over the limit', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('test-block', 'ip-2', 3, 60_000);
    }
    expect(rateLimit('test-block', 'ip-2', 3, 60_000)).toBe(false);
  });

  it('tracks different keys independently', () => {
    for (let i = 0; i < 2; i++) {
      rateLimit('test-keys', 'ip-a', 2, 60_000);
    }
    expect(rateLimit('test-keys', 'ip-a', 2, 60_000)).toBe(false);
    expect(rateLimit('test-keys', 'ip-b', 2, 60_000)).toBe(true);
  });

  it('tracks different namespaces independently', () => {
    for (let i = 0; i < 2; i++) {
      rateLimit('ns-1', 'ip-x', 2, 60_000);
    }
    expect(rateLimit('ns-1', 'ip-x', 2, 60_000)).toBe(false);
    expect(rateLimit('ns-2', 'ip-x', 2, 60_000)).toBe(true);
  });
});

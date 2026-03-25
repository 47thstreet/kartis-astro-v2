import { describe, it, expect } from 'vitest';
import { getCommissionRate } from '../commission';

describe('getCommissionRate', () => {
  it('returns 0 for empty rules', () => {
    expect(getCommissionRate([], 10000)).toBe(0);
    expect(getCommissionRate(null as any, 10000)).toBe(0);
  });

  it('returns flat rate when single rule with no threshold', () => {
    const rules = [{ rate: 0.1 }];
    expect(getCommissionRate(rules, 5000)).toBe(0.1);
  });

  it('applies tiered rates based on revenue', () => {
    const rules = [
      { thresholdCents: 0, rate: 0.05 },
      { thresholdCents: 10000, rate: 0.1 },
      { thresholdCents: 50000, rate: 0.15 },
    ];

    expect(getCommissionRate(rules, 5000)).toBe(0.05);   // under 100$
    expect(getCommissionRate(rules, 10000)).toBe(0.1);    // exactly 100$
    expect(getCommissionRate(rules, 30000)).toBe(0.1);    // between tiers
    expect(getCommissionRate(rules, 50000)).toBe(0.15);   // exactly 500$
    expect(getCommissionRate(rules, 100000)).toBe(0.15);  // above top tier
  });

  it('handles rules in unsorted order', () => {
    const rules = [
      { thresholdCents: 50000, rate: 0.15 },
      { thresholdCents: 0, rate: 0.05 },
      { thresholdCents: 10000, rate: 0.1 },
    ];

    expect(getCommissionRate(rules, 30000)).toBe(0.1);
  });

  it('returns 0 when revenue is below all thresholds', () => {
    const rules = [{ thresholdCents: 10000, rate: 0.1 }];
    expect(getCommissionRate(rules, 5000)).toBe(0);
  });
});

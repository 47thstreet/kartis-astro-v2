/**
 * Given tiered commission rules and a revenue amount, returns the applicable rate.
 * Rules are sorted by threshold ascending — highest matching tier wins.
 */
export function getCommissionRate(rules: any[], revenueCents: number): number {
  if (!rules || rules.length === 0) return 0;
  const sorted = [...rules].sort((a, b) => (a.thresholdCents ?? 0) - (b.thresholdCents ?? 0));
  let rate = 0;
  for (const rule of sorted) {
    if (revenueCents >= (rule.thresholdCents ?? 0)) {
      rate = rule.rate ?? 0;
    }
  }
  return rate;
}

/**
 * Partner tiers shown on dashboards and profiles. The API does not model tiers yet, so they are derived
 * from lifetime points (plumbers) or 30-day sales achievement (retailers). Thresholds are POC values.
 */
export interface Tier {
  name: string;
  multiplier: string;
  next?: { name: string; at: number };
}

const PLUMBER_TIERS = [
  { name: 'Silver Partner', min: 0, multiplier: '1.0x' },
  { name: 'Gold Partner', min: 2000, multiplier: '1.25x' },
  { name: 'Platinum Partner', min: 10000, multiplier: '1.5x' },
];

export function plumberTier(lifetimePoints: number): Tier {
  const index = PLUMBER_TIERS.findLastIndex((t) => lifetimePoints >= t.min);
  const tier = PLUMBER_TIERS[Math.max(0, index)];
  const next = PLUMBER_TIERS[index + 1];
  return { name: tier.name, multiplier: tier.multiplier, next: next ? { name: next.name, at: next.min } : undefined };
}

export function retailerTier(achievementPct: number): Tier {
  if (achievementPct >= 100) return { name: 'Diamond Dealer', multiplier: '+4%' };
  if (achievementPct >= 75) return { name: 'Platinum Dealer', multiplier: '+3%', next: { name: 'Diamond Dealer', at: 100 } };
  if (achievementPct >= 50) return { name: 'Gold Dealer', multiplier: '+2%', next: { name: 'Platinum Dealer', at: 75 } };
  return { name: 'Silver Dealer', multiplier: '+1%', next: { name: 'Gold Dealer', at: 50 } };
}

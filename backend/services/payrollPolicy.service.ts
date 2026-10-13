// payrollPolicy.service.ts
import { PayrollPolicy,ISlab } from '../models/payrollPolicy.model';
const policyCache = new Map<string, { doc: any; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min — fine since policies change rarely

export function normalizeStateName(state: string): string {
  return state.trim().toLowerCase();
}

/**
 * Returns the active policy for a given type/date/state, or null if none exists.
 * Callers decide whether "no policy" is a hard error or a fallback case —
 * this function never throws, so PF/ESI/TDS/PT can each handle it differently.
 */
export async function getActivePolicy(
  policyType: string,
  asOf: Date = new Date(),
  state?: string
): Promise<any | null> {
  const normalizedState = state ? normalizeStateName(state) : undefined;

  // state included in cache key — otherwise a Maharashtra lookup and a
  // Karnataka lookup for the same policyType/date would collide and one
  // would silently return the other's rates
  const cacheKey = normalizedState
    ? `${policyType}:${normalizedState}:${asOf.toISOString().slice(0, 10)}`
    : `${policyType}:${asOf.toISOString().slice(0, 10)}`;

  const cached = policyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.doc;

  const query: any = {
    policyType,
    effectiveFrom: { $lte: asOf },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: asOf } }],
    isActive: true,
  };
  if (normalizedState) query.state = normalizedState;

  const doc = await PayrollPolicy.findOne(query).sort({ effectiveFrom: -1 });

  if (doc) {
    policyCache.set(cacheKey, { doc, expiresAt: Date.now() + CACHE_TTL_MS });
  }
  // no doc found — cache nothing, return null, let the caller decide
  return doc;
}

export function invalidatePolicyCache() {
  policyCache.clear();
}

export function calculateSlabTax(taxableIncome: number, slabs: ISlab[]): number {
  let tax = 0;
  for (const slab of slabs) {
    if (taxableIncome > slab.min) {
      const upper = slab.max === null ? taxableIncome : slab.max;
      tax += (Math.min(taxableIncome, upper) - slab.min) * (slab.rate / 100);
    }
  }
  return Math.round(tax);
}
export function getFlatSlabAmount(income: number, slabs: ISlab[]): number {
  for (const slab of slabs) {
    if (income > slab.min && (slab.max === null || income <= slab.max)) {
      return slab.rate;
    }
  }
  return 0;
}
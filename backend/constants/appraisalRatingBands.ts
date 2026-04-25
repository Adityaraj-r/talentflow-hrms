/**
 * Canonical bands for appraisal → payroll bonus mapping (integration layer maps numeric/overallRating).
 */
export enum AppraisalRatingBand {
  EXCEEDS_EXPECTATIONS = 'EXCEEDS_EXPECTATIONS',
  MEETS_EXPECTATIONS = 'MEETS_EXPECTATIONS',
  BELOW_EXPECTATIONS = 'BELOW_EXPECTATIONS',
}

/** Percent of base used when applying bonus (business rule — single source for services). */
export const APPRAISAL_BONUS_PERCENT_BY_BAND: Record<AppraisalRatingBand, number> = {
  [AppraisalRatingBand.EXCEEDS_EXPECTATIONS]: 20,
  [AppraisalRatingBand.MEETS_EXPECTATIONS]: 10,
  [AppraisalRatingBand.BELOW_EXPECTATIONS]: 0,
};

/** Maps 1–5 overall rating to bonus band (tunable thresholds). */
export function mapOverallRatingToBand(overallRating: number): AppraisalRatingBand {
  const r = Number(overallRating);
  if (!Number.isFinite(r) || r <= 0) return AppraisalRatingBand.BELOW_EXPECTATIONS;
  if (r >= 4.25) return AppraisalRatingBand.EXCEEDS_EXPECTATIONS;
  if (r >= 3) return AppraisalRatingBand.MEETS_EXPECTATIONS;
  return AppraisalRatingBand.BELOW_EXPECTATIONS;
}

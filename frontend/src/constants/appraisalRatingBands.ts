/** Mirrors backend `constants/appraisalRatingBands.ts` for UI labels and mapping. */
export enum AppraisalRatingBand {
  EXCEEDS_EXPECTATIONS = "EXCEEDS_EXPECTATIONS",
  MEETS_EXPECTATIONS = "MEETS_EXPECTATIONS",
  BELOW_EXPECTATIONS = "BELOW_EXPECTATIONS",
}

export const APPRAISAL_BONUS_PERCENT_BY_BAND: Record<AppraisalRatingBand, number> = {
  [AppraisalRatingBand.EXCEEDS_EXPECTATIONS]: 20,
  [AppraisalRatingBand.MEETS_EXPECTATIONS]: 10,
  [AppraisalRatingBand.BELOW_EXPECTATIONS]: 0,
};

export function mapOverallRatingToBand(overallRating: number): AppraisalRatingBand {
  const r = Number(overallRating);
  if (!Number.isFinite(r) || r <= 0) return AppraisalRatingBand.BELOW_EXPECTATIONS;
  if (r >= 4.25) return AppraisalRatingBand.EXCEEDS_EXPECTATIONS;
  if (r >= 3) return AppraisalRatingBand.MEETS_EXPECTATIONS;
  return AppraisalRatingBand.BELOW_EXPECTATIONS;
}

export function formatRatingBandLabel(band: AppraisalRatingBand | string): string {
  switch (band) {
    case AppraisalRatingBand.EXCEEDS_EXPECTATIONS:
      return "Exceeds expectations";
    case AppraisalRatingBand.MEETS_EXPECTATIONS:
      return "Meets expectations";
    case AppraisalRatingBand.BELOW_EXPECTATIONS:
      return "Below expectations";
    default:
      return String(band).replace(/_/g, " ").toLowerCase();
  }
}

import { describe, it, expect } from 'vitest';
import {
  canonicalStatus,
  WorkflowStage,
  assertCalibrationOrder,
  assertFinalizeOrder,
  computeOverallFromCompetencies,
} from '../services/pmsWorkflow.service';

describe('pmsWorkflow', () => {
  it('canonicalStatus maps legacy and canonical strings', () => {
    expect(canonicalStatus('pending')).toBe(WorkflowStage.GOALS_PENDING);
    expect(canonicalStatus('self assessment done')).toBe(WorkflowStage.SELF_ASSESSMENT_DONE);
    expect(canonicalStatus('hr reviewed')).toBe(WorkflowStage.HR_REVIEWED);
    expect(canonicalStatus('final_approved')).toBe(WorkflowStage.FINAL_APPROVED);
    expect(canonicalStatus('feedback_released')).toBe(WorkflowStage.FEEDBACK_RELEASED);
  });

  it('computeOverallFromCompetencies averages ratings', () => {
    expect(computeOverallFromCompetencies([{ rating: 4 }, { rating: 2 }])).toBe(3);
    expect(computeOverallFromCompetencies([])).toBe(0);
  });

  it('assertCalibrationOrder enforces CEO gate when required', () => {
    expect(() =>
      assertCalibrationOrder(WorkflowStage.HR_REVIEWED, true)
    ).toThrow(/CEO review/);
    expect(() =>
      assertCalibrationOrder(WorkflowStage.CEO_REVIEWED, true)
    ).not.toThrow();
    expect(() =>
      assertCalibrationOrder(WorkflowStage.HR_REVIEWED, false)
    ).not.toThrow();
  });

  it('assertFinalizeOrder requires calibrated', () => {
    expect(() => assertFinalizeOrder(WorkflowStage.HR_REVIEWED)).toThrow(/Calibration/);
    expect(() => assertFinalizeOrder(WorkflowStage.CALIBRATED)).not.toThrow();
  });
});

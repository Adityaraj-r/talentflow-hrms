# PMS module

## Manager Team-Complete Notification — Wiring

**Trigger:** Called after every successful `PerformanceReview.status` persist via `review.save()` in:

| Function | Notes |
|----------|--------|
| `PerformanceController.confirmGoals` | Locks goals (`goals_locked`) |
| `PerformanceController.submitReview` | Legacy PUT manager submit → `manager_review_done` |
| `PerformanceController.submitSelfAssessment` | `self_assessment_done` |
| `PerformanceController.submitManagerReview` | POST manager submit → `manager_review_done` |
| `PerformanceController.submitHRReview` | `hr_reviewed` |
| `PerformanceController.submitCeoReview` | `ceo_reviewed` |
| `PerformanceController.submitCalibration` | `calibrated` |
| `PerformanceController.finalApprove` | Also used by `finalizeReview` and `approveReview` routes → `final_approved` |
| `PerformanceController.releaseFeedback` | `feedback_released` |

Implementation: local helper `scheduleTeamCompleteNotification(review.cycleId)` in `controllers/performanceController.ts` invokes `evaluateAndNotifyManagersTeamComplete` with the performance cycle id (same as `PerformanceReview.cycleId`).

**Behaviour:** Fire-and-forget (`void … .catch`). Errors are logged via `logger.error` from `utils/logger.ts` and swallowed — the review update response is never affected.

**De-duplication:** At most one `team_appraisals_complete` notification per manager per appraisal cycle — enforced in `notification.service.ts` (`NotificationModel.exists` before creating a new doc).

import { WorkflowStage } from './workflowTemplates';

export class WorkflowEngine {
  /**
   * Get only enabled stages sorted by order
   */
  static getActiveStages(job: any): WorkflowStage[] {
    if (!job?.workflow?.stages) return [];
    return job.workflow.stages
      .filter((s: any) => s.enabled)
      .sort((a: any, b: any) => a.order - b.order);
  }

  /**
   * Get the current stage object from the job workflow
   */
  static getCurrentStage(job: any, application: any): WorkflowStage | null {
    const stages = this.getActiveStages(job);
    const currentKey = application.workflowState?.currentStageKey;
    if (!currentKey) return stages[0] || null;
    return stages.find((s: any) => s.key === currentKey) || null;
  }

  /**
   * Get the next enabled stage after the current one
   */
  static getNextStage(job: any, application: any): WorkflowStage | null {
    const stages = this.getActiveStages(job);
    const currentKey = application.workflowState?.currentStageKey;
    if (!currentKey) return stages[0] || null;
    const currentIndex = stages.findIndex((s: any) => s.key === currentKey);
    if (currentIndex === -1 || currentIndex >= stages.length - 1) return null;
    return stages[currentIndex + 1];
  }

  /**
   * Initialize workflow state for a new application
   */
  static initializeWorkflow(job: any, application: any): void {
    const stages = this.getActiveStages(job);
    if (stages.length === 0) return;
    const firstStage = stages[0];
    application.workflowState = {
      currentStageKey: firstStage.key,
      currentStageIndex: 0,
      stageHistory: [{
        stageKey: firstStage.key,
        stageName: firstStage.name,
        enteredAt: new Date(),
        outcome: "in_progress",
        score: 0,
        notes: "",
      }],
      finalScore: 0,
      isComplete: false,
    };
    application.status = firstStage.name;
  }

  /**
   * Advance candidate to the next stage
   */
  static advanceCandidate(job: any, application: any, stageOutcome: { score?: number; notes?: string } = {}): { advanced: boolean; newStage: string | null; isComplete: boolean } {
    const stages = this.getActiveStages(job);
    const currentKey = application.workflowState?.currentStageKey;
    if (!currentKey) return { advanced: false, newStage: null, isComplete: false };
    
    const currentIndex = stages.findIndex((s: any) => s.key === currentKey);
    if (currentIndex === -1) return { advanced: false, newStage: null, isComplete: false };
    
    // Mark current stage as completed
    const history = application.workflowState.stageHistory || [];
    const currentHistoryEntry = history.find((h: any) => h.stageKey === currentKey && !h.completedAt);
    if (currentHistoryEntry) {
      currentHistoryEntry.completedAt = new Date();
      currentHistoryEntry.outcome = "passed";
      if (stageOutcome.score !== undefined) currentHistoryEntry.score = stageOutcome.score;
      if (stageOutcome.notes) currentHistoryEntry.notes = stageOutcome.notes;
    }
    
    // Move to next stage
    const nextIndex = currentIndex + 1;
    if (nextIndex >= stages.length) {
      // Workflow complete
      application.workflowState.isComplete = true;
      application.workflowState.finalScore = this.computeFinalScore(job, application);
      application.status = "Hired";
      return { advanced: true, newStage: null, isComplete: true };
    }
    
    const nextStage = stages[nextIndex];
    application.workflowState.currentStageKey = nextStage.key;
    application.workflowState.currentStageIndex = nextIndex;
    application.status = nextStage.name;
    
    // Add new history entry
    history.push({
      stageKey: nextStage.key,
      stageName: nextStage.name,
      enteredAt: new Date(),
      outcome: "in_progress",
      score: 0,
      notes: "",
    });
    application.workflowState.stageHistory = history;
    application.workflowState.finalScore = this.computeFinalScore(job, application);
    
    return { advanced: true, newStage: nextStage.name, isComplete: false };
  }

  /**
   * Reject candidate from any stage
   */
  static rejectCandidate(job: any, application: any, reason: string = ""): void {
    const currentKey = application.workflowState?.currentStageKey;
    const history = application.workflowState?.stageHistory || [];
    const currentEntry = history.find((h: any) => h.stageKey === currentKey && !h.completedAt);
    if (currentEntry) {
      currentEntry.completedAt = new Date();
      currentEntry.outcome = "failed";
      currentEntry.notes = reason;
    }
    application.status = "Rejected";
    application.workflowState.isComplete = true;
  }

  /**
   * Compute weighted final score
   */
  static computeFinalScore(job: any, application: any): number {
    const stages = this.getActiveStages(job);
    const history = application.workflowState?.stageHistory || [];
    const formula = job.workflow?.scoringFormula || "weighted_average";
    
    if (formula === "weighted_average") {
      let totalWeight = 0;
      let weightedSum = 0;
      for (const stage of stages) {
        if (stage.weightage <= 0) continue;
        const historyEntry = history.find((h: any) => h.stageKey === stage.key && h.outcome === "passed");
        if (historyEntry) {
          weightedSum += (historyEntry.score || 0) * (stage.weightage / 100);
          totalWeight += stage.weightage;
        }
      }
      return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) : 0;
    }
    
    // pass_fail: percentage of stages passed
    if (formula === "pass_fail") {
      const scoredStages = stages.filter(s => s.weightage > 0);
      const passedCount = scoredStages.filter(s => {
        const h = history.find((h: any) => h.stageKey === s.key);
        return h && h.outcome === "passed";
      }).length;
      return scoredStages.length > 0 ? Math.round((passedCount / scoredStages.length) * 100) : 0;
    }
    
    return 0;
  }

  /**
   * Get workflow progress
   */
  static getWorkflowProgress(job: any, application: any): { completedStages: number; totalStages: number; percentage: number; currentStageName: string } {
    const stages = this.getActiveStages(job);
    const history = application.workflowState?.stageHistory || [];
    const completed = history.filter((h: any) => h.completedAt && h.outcome === "passed").length;
    const currentStage = this.getCurrentStage(job, application);
    return {
      completedStages: completed,
      totalStages: stages.length,
      percentage: stages.length > 0 ? Math.round((completed / stages.length) * 100) : 0,
      currentStageName: currentStage?.name || "Not Started",
    };
  }

  /**
   * Map legacy status to workflow stage key
   */
  static mapLegacyStatus(status: string, job: any): string {
    const stages = this.getActiveStages(job);
    if (stages.length === 0) return "";
    
    const normalized = (status || "").toLowerCase().replace(/[_\-]+/g, " ").trim();
    
    // Try exact match first
    const exact = stages.find(s => s.name.toLowerCase() === normalized);
    if (exact) return exact.key;
    
    // Try partial match
    const partial = stages.find(s => normalized.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(normalized));
    if (partial) return partial.key;
    
    // Type-based fallback
    if (normalized.includes("screen") || normalized.includes("ats") || normalized.includes("review")) {
      const screening = stages.find(s => s.type === "screening");
      if (screening) return screening.key;
    }
    if (normalized.includes("interview")) {
      const interview = stages.find(s => s.type === "interview");
      if (interview) return interview.key;
    }
    if (normalized.includes("offer") || normalized.includes("select")) {
      const offer = stages.find(s => s.type === "offer");
      if (offer) return offer.key;
    }
    if (normalized.includes("bgv") || normalized.includes("background")) {
      const bgv = stages.find(s => s.type === "bgv");
      if (bgv) return bgv.key;
    }
    
    return stages[0].key;
  }
}

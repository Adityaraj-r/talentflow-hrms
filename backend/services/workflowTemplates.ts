export interface WorkflowStage {
  key: string;
  name: string;
  type: "screening" | "assignment" | "interview" | "review" | "offer" | "bgv" | "custom";
  order: number;
  enabled: boolean;
  config: {
    interviewType?: string;
    requiredSkills?: string[];
    passingScore?: number;
    assignmentTemplate?: string;
    assignmentDeadlineDays?: number;
    bgvChecks?: string[];
    autoProgress?: boolean;
    emailTemplateKey?: string;
  };
  weightage: number;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: WorkflowStage[];
  scoringFormula: "weighted_average" | "pass_fail" | "custom";
  autoProgressionEnabled: boolean;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "frontend_developer",
    name: "Frontend Developer",
    description: "Full-cycle frontend hiring with assignment and two technical rounds",
    stages: [
      { key: "ats_screening", name: "ATS Screening", type: "screening", order: 1, enabled: true, config: { autoProgress: true }, weightage: 10 },
      { key: "assignment", name: "Assignment", type: "assignment", order: 2, enabled: true, config: { assignmentDeadlineDays: 5 }, weightage: 25 },
      { key: "technical_interview_1", name: "Technical Interview 1", type: "interview", order: 3, enabled: true, config: { interviewType: "Technical", passingScore: 3 }, weightage: 25 },
      { key: "technical_interview_2", name: "Technical Interview 2", type: "interview", order: 4, enabled: true, config: { interviewType: "Technical", passingScore: 3 }, weightage: 20 },
      { key: "hr_interview", name: "HR Interview", type: "interview", order: 5, enabled: true, config: { interviewType: "HR", passingScore: 3 }, weightage: 10 },
      { key: "offer", name: "Offer", type: "offer", order: 6, enabled: true, config: {}, weightage: 0 },
      { key: "bgv", name: "Background Verification", type: "bgv", order: 7, enabled: true, config: { bgvChecks: ["identity", "education", "employment", "criminal"] }, weightage: 10 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  },
  {
    id: "backend_developer",
    name: "Backend Developer",
    description: "4 stages: ATS → Technical Interview → Manager Discussion → Offer",
    stages: [
      { key: "ats_screening", name: "ATS Screening", type: "screening", order: 1, enabled: true, config: { autoProgress: true }, weightage: 10 },
      { key: "technical_interview", name: "Technical Interview", type: "interview", order: 2, enabled: true, config: { interviewType: "Technical", passingScore: 3 }, weightage: 50 },
      { key: "manager_discussion", name: "Manager Discussion", type: "interview", order: 3, enabled: true, config: { interviewType: "Manager", passingScore: 3 }, weightage: 40 },
      { key: "offer", name: "Offer", type: "offer", order: 4, enabled: true, config: {}, weightage: 0 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  },
  {
    id: "uiux_designer",
    name: "UI/UX Designer",
    description: "4 stages: Portfolio Review → Design Assignment → Design Interview → Offer",
    stages: [
      { key: "portfolio_review", name: "Portfolio Review", type: "review", order: 1, enabled: true, config: {}, weightage: 20 },
      { key: "design_assignment", name: "Design Assignment", type: "assignment", order: 2, enabled: true, config: { assignmentDeadlineDays: 7 }, weightage: 40 },
      { key: "design_interview", name: "Design Interview", type: "interview", order: 3, enabled: true, config: { interviewType: "Technical", passingScore: 3 }, weightage: 40 },
      { key: "offer", name: "Offer", type: "offer", order: 4, enabled: true, config: {}, weightage: 0 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  },
  {
    id: "hr_executive",
    name: "HR Executive",
    description: "4 stages: ATS Screening → HR Interview → Manager Interview → Offer",
    stages: [
      { key: "ats_screening", name: "ATS Screening", type: "screening", order: 1, enabled: true, config: { autoProgress: true }, weightage: 20 },
      { key: "hr_interview", name: "HR Interview", type: "interview", order: 2, enabled: true, config: { interviewType: "HR", passingScore: 3 }, weightage: 40 },
      { key: "manager_interview", name: "Manager Interview", type: "interview", order: 3, enabled: true, config: { interviewType: "Manager", passingScore: 3 }, weightage: 40 },
      { key: "offer", name: "Offer", type: "offer", order: 4, enabled: true, config: {}, weightage: 0 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  },
  {
    id: "customer_support",
    name: "Customer Support",
    description: "4 stages: Application Review → Communication Assessment → HR Interview → Offer",
    stages: [
      { key: "application_review", name: "Application Review", type: "review", order: 1, enabled: true, config: {}, weightage: 20 },
      { key: "communication_assessment", name: "Communication Assessment", type: "assignment", order: 2, enabled: true, config: { assignmentDeadlineDays: 2 }, weightage: 40 },
      { key: "hr_interview", name: "HR Interview", type: "interview", order: 3, enabled: true, config: { interviewType: "HR", passingScore: 3 }, weightage: 40 },
      { key: "offer", name: "Offer", type: "offer", order: 4, enabled: true, config: {}, weightage: 0 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  },
  {
    id: "default",
    name: "Default Workflow",
    description: "6 stages: ATS → HR Screening → Interview → Manager Review → Offer → BGV",
    stages: [
      { key: "ats_screening", name: "ATS Screening", type: "screening", order: 1, enabled: true, config: { autoProgress: true }, weightage: 10 },
      { key: "hr_screening", name: "HR Screening", type: "screening", order: 2, enabled: true, config: {}, weightage: 10 },
      { key: "interview", name: "Interview", type: "interview", order: 3, enabled: true, config: { passingScore: 3 }, weightage: 40 },
      { key: "manager_review", name: "Manager Review", type: "review", order: 4, enabled: true, config: {}, weightage: 30 },
      { key: "offer", name: "Offer", type: "offer", order: 5, enabled: true, config: {}, weightage: 0 },
      { key: "bgv", name: "Background Verification", type: "bgv", order: 6, enabled: true, config: { bgvChecks: ["identity", "education", "employment", "criminal"] }, weightage: 10 },
    ],
    scoringFormula: "weighted_average",
    autoProgressionEnabled: false,
  }
];

export const getWorkflowTemplate = (templateId: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(t => t.id === templateId);
};

export const getDefaultWorkflow = () => {
  return WORKFLOW_TEMPLATES.find(t => t.id === "default")!;
};

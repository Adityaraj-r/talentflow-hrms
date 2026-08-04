import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
{
  jobTitle: { type: String, required: true },
  jobCode: { type: String, unique: true },
  requisitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Requisition",
    default: null
  },
  department: { type: String, required: true },
  designation: { type: String, default: "" },
  positions: { type: Number, required: true },
  
  employmentType: { type: String, required: true },
  workMode: { type: String, default: "On-site" }, // Remote, Hybrid, On-site
  officeLocation: { type: String, default: "" },

  minExperience: { type: Number, default: 0 },
  maxExperience: { type: Number, default: 0 },
  educationRequired: { type: String, default: "" },
  minSalary: { type: Number },
  maxSalary: { type: Number },
  currency: { type: String, default: "USD" },

  primarySkills: [{ type: String }],
  secondarySkills: [{ type: String }],
  customTags: [{ type: String }],

  aboutRole: { type: String, default: "" },
  keyResponsibilities: { type: String, default: "" },
  requiredSkills: { type: String, default: "" },
  preferredSkills: { type: String, default: "" },
  qualifications: { type: String, default: "" },
  benefitsPerks: { type: String, default: "" },

  hiringManager: { type: String, default: "" },
  recruiter: { type: String, default: "" },
  vacancyType: { type: String, default: "New Position" }, // New Position / Replacement
  priority: { type: String, default: "Medium" }, // Low / Medium / High / Urgent
  
  replaceEmployee: { type: String, default: "" },
  replacementReason: { type: String, default: "" },

  expectedJoiningDate: { type: Date },
  deadline: { type: Date },

  uploadJd: { type: String, default: "" }, // File path
  supportingDocuments: { type: String, default: "" }, // File path
  internalNotes: { type: String, default: "" },

  description: { type: String, default: "" }, // Legacy compatibility

  hiringRoles: [
    {
      roleName: { type: String, required: true },
      openings: { type: Number, required: true, min: 1 },
      minSalary: { type: Number },
      maxSalary: { type: Number },
      experience: { type: String, default: "" },
      skills: { type: String, default: "" },
      filled: { type: Number, default: 0, min: 0 },
      status: {
        type: String,
        enum: ["Open", "Closed"],
        default: "Open"
      }
    }
  ],
  workflow: {
    stages: [{
      key: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, enum: ["screening", "assignment", "interview", "review", "offer", "bgv", "custom"], default: "custom" },
      order: { type: Number, required: true },
      enabled: { type: Boolean, default: true },
      config: {
        interviewType: { type: String, default: "" },
        requiredSkills: [{ type: String }],
        passingScore: { type: Number, default: 3, min: 1, max: 5 },
        assignmentTemplate: { type: String, default: "" },
        assignmentDeadlineDays: { type: Number, default: 7 },
        bgvChecks: [{ type: String }],
        autoProgress: { type: Boolean, default: false },
        emailTemplateKey: { type: String, default: "" },
      },
      weightage: { type: Number, default: 0, min: 0, max: 100 },
    }],
    scoringFormula: { type: String, enum: ["weighted_average", "pass_fail", "custom"], default: "weighted_average" },
    autoProgressionEnabled: { type: Boolean, default: false },
  },

  hasAssignment: { type: Boolean, default: false },
  assignmentName: { type: String, default: "Technical Assignment" },
  interviewRounds: [{ type: String }],

  status: {
    type: String,
    enum: ["Draft", "Published", "Closed"],
    default: "Draft"
  },
  autoClosedByHiringProgress: { type: Boolean, default: false }
},
{ timestamps: true }
);

export default mongoose.models.Job || mongoose.model("Job", jobSchema);

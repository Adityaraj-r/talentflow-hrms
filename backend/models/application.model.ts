import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
{
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  hiringRoleId: {
    type: String,
    default: ""
  },

  hiringRoleName: {
    type: String,
    default: ""
  },

  selectedPositionId: {
    type: String,
    default: ""
  },

  selectedPositionTitle: {
    type: String,
    default: ""
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: false
  },

  resume: {
    type: String
  },

  currentLocation: {
    type: String,
    default: ""
  },

  yearsOfExperience: {
    type: Number,
    default: 0
  },

  currentCompany: {
    type: String,
    default: ""
  },

  currentCtc: {
    type: String,
    default: ""
  },

  expectedCtc: {
    type: String,
    default: ""
  },

  noticePeriod: {
    type: String,
    default: ""
  },

  linkedin: {
    type: String,
    default: ""
  },

  portfolio: {
    type: String,
    default: ""
  },

  coverLetter: {
    type: String,
    default: ""
  },

  currentDesignation: {
    type: String,
    default: ""
  },

  highestEducation: {
    type: String,
    default: ""
  },

  employmentTypePreference: {
    type: String,
    default: ""
  },

  githubProfile: {
    type: String,
    default: ""
  },

  additionalDocuments: {
    type: String,
    default: ""
  },

  matchScore: {
    type: Number,
    default: 0
  },

  aiFitScore: {
    type: Number,
    default: 0
  },

  aiRank: {
    type: Number,
    default: null
  },

  aiRecommendationLabel: {
    type: String,
    enum: ["Excellent Match", "Strong Match", "Moderate Match", "Weak Match"],
    default: "Weak Match"
  },

  skillsScore: {
    type: Number,
    default: 0
  },

  experienceScore: {
    type: Number,
    default: 0
  },

  roleScore: {
    type: Number,
    default: 0
  },

  educationScore: {
    type: Number,
    default: 0
  },

  resumeQualityScore: {
    type: Number,
    default: 0
  },

  jobRequirementScore: {
    type: Number,
    default: 0
  },

  hiringProbability: {
    type: Number,
    default: 0
  },

  hiringProbabilityLabel: {
    type: String,
    enum: ["Likely Hire", "Potential Hire", "Uncertain"],
    default: "Uncertain"
  },

  riskLevel: {
    type: String,
    enum: ["Low Risk", "Medium Risk", "High Risk"],
    default: "Medium Risk"
  },

  riskSignals: {
    type: [String],
    default: []
  },

  suggestedNextAction: {
    type: String,
    enum: ["Move To Screening", "Schedule Interview", "Issue Offer", "Manual Review", "Reject"],
    default: "Manual Review"
  },

  rating: {
    type: Number,
    default: 0
  },

  matchedSkills: {
    type: [String],
    default: []
  },

  missingSkills: {
    type: [String],
    default: []
  },

  strengths: {
    type: [String],
    default: []
  },

  recommendationStage: {
    type: String,
    enum: ["Excellent Match", "Strong Match", "Moderate Match", "Weak Match"],
    default: "Weak Match"
  },

  fitSummary: {
    type: String,
    default: ""
  },

  status: {
    type: String,
    default: "Applied"
  },

  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    default: null
  },

  interviewDetails: {
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    date: { type: String },
    startTime: { type: String },
    endTime: { type: String },
    mode: { type: String, enum: ["Online", "Offline"] },
    meetingLink: { type: String },
    location: { type: String },
    instructions: { type: [String], default: [] },
    status: { type: String, enum: ["Upcoming", "In Progress", "Completed", "Cancelled"], default: "Upcoming" }
  }

},
{ timestamps: true }
)

export default mongoose.model("Application", applicationSchema)

import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
{
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  resume: {
    type: String
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
  }

},
{ timestamps: true }
)

export default mongoose.model("Application", applicationSchema)

import fs from "fs/promises"
import path from "path"
import zlib from "zlib"

type JobLike = {
  jobTitle?: string
  department?: string
  employmentType?: string
  description?: string
  requirements?: string
  skills?: string[] | string
}

type FitResult = {
  matchScore: number
  aiFitScore: number
  aiRecommendationLabel: "Excellent Match" | "Strong Match" | "Moderate Match" | "Weak Match"
  skillsScore: number
  experienceScore: number
  roleScore: number
  educationScore: number
  resumeQualityScore: number
  jobRequirementScore: number
  hiringProbability: number
  hiringProbabilityLabel: "Likely Hire" | "Potential Hire" | "Uncertain"
  riskLevel: "Low Risk" | "Medium Risk" | "High Risk"
  riskSignals: string[]
  suggestedNextAction: "Move To Screening" | "Schedule Interview" | "Issue Offer" | "Manual Review" | "Reject"
  rating: number
  matchedSkills: string[]
  missingSkills: string[]
  strengths: string[]
  recommendationStage: "Excellent Match" | "Strong Match" | "Moderate Match" | "Weak Match"
  fitSummary: string
}

const ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: ["react", "javascript", "typescript", "html", "css", "tailwind", "redux", "vite", "next.js", "frontend", "web", "developer"],
  backend: ["node", "nodejs", "express", "mongodb", "mongoose", "api", "rest", "sql", "postgres", "backend", "server", "web", "developer"],
  fullstack: ["react", "node", "nodejs", "express", "mongodb", "javascript", "typescript", "api", "full stack", "fullstack", "web", "developer"],
  hr: ["recruitment", "hr", "employee relations", "payroll", "onboarding", "talent", "human resources"],
  finance: ["accounting", "finance", "gst", "tax", "audit", "excel", "budget", "payroll"],
  sales: ["sales", "crm", "lead generation", "negotiation", "pipeline", "business development"],
  marketing: ["seo", "sem", "campaign", "analytics", "content", "marketing", "social media"],
  designer: ["figma", "ui", "ux", "wireframe", "prototype", "design system", "photoshop"],
  qa: ["testing", "automation", "selenium", "cypress", "playwright", "test cases", "qa"],
}

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const unique = (items: string[]) => [...new Set(items.map(normalize).filter(Boolean))]
const displayUnique = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))]

const extractPdfLiteralText = (value: string) => {
  const chunks = []
  const literalMatches = value.matchAll(/\((?:\\.|[^\\)]){2,}\)/g)
  for (const match of literalMatches) {
    chunks.push(match[0].slice(1, -1).replace(/\\[nrtbf()\\]/g, " "))
  }

  const hexMatches = value.matchAll(/<([0-9a-fA-F\s]{8,})>/g)
  for (const match of hexMatches) {
    const hex = match[1].replace(/\s+/g, "")
    const decoded = hex.match(/.{1,4}/g)?.map((part) => String.fromCharCode(Number.parseInt(part, 16))).join(" ") || ""
    chunks.push(decoded)
  }

  return chunks.join(" ")
}

const extractPdfText = (buffer: Buffer) => {
  const textChunks: string[] = []
  const raw = buffer.toString("latin1")
  textChunks.push(raw)
  textChunks.push(extractPdfLiteralText(raw))

  const streams = raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)
  for (const match of streams) {
    try {
      const inflated = zlib.inflateSync(Buffer.from(match[1], "latin1"))
      const inflatedText = inflated.toString("utf8")
      textChunks.push(inflatedText)
      textChunks.push(extractPdfLiteralText(inflatedText))
    } catch {
      textChunks.push(match[1])
    }
  }

  return textChunks.join(" ")
}

const getRoleKeywords = (job: JobLike) => {
  const title = normalize(job.jobTitle)
  const department = normalize(job.department)
  const requirements = normalize(
    `${job.description || ""} ${job.requirements || ""} ${Array.isArray(job.skills) ? job.skills.join(" ") : job.skills || ""}`
  )
  const tokens = unique([...title.split(" "), ...department.split(" "), ...requirements.split(" ")])
    .filter((token) => token.length > 2)
  const mapped = Object.entries(ROLE_KEYWORDS)
    .filter(([key]) => title.includes(key) || department.includes(key) || requirements.includes(key))
    .flatMap(([, skills]) => skills)

  return unique([...tokens, ...mapped]).slice(0, 18)
}

const extractReadableResumeText = async (resume?: string) => {
  if (!resume) return ""

  try {
    const filePath = path.resolve(process.cwd(), "uploads", resume)
    const buffer = await fs.readFile(filePath)
    const limited = buffer.subarray(0, 2_000_000)
    const isPdf = limited.subarray(0, 5).toString("latin1") === "%PDF-"
    const extracted = isPdf ? extractPdfText(limited) : limited.toString("utf8")
    const latin = limited.toString("latin1")

    return normalize(`${resume} ${extracted} ${latin}`)
  } catch {
    return normalize(resume)
  }
}

const extractExperienceYears = (text: string) => {
  const matches = [
    ...text.matchAll(/(\d{1,2})(?:\+)?\s*(?:years?|yrs?)\s+(?:of\s+)?(?:experience|exp)?/g),
    ...text.matchAll(/experience\s*(?:of)?\s*(\d{1,2})(?:\+)?\s*(?:years?|yrs?)/g),
  ]
  const years = matches.map((match) => Number(match[1])).filter(Number.isFinite)
  return years.length ? Math.max(...years) : 0
}

const score = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const getMatchLabel = (value: number): FitResult["aiRecommendationLabel"] => {
  if (value >= 90) return "Excellent Match"
  if (value >= 75) return "Strong Match"
  if (value >= 60) return "Moderate Match"
  return "Weak Match"
}

const getEducationScore = (text: string) => {
  const educationTerms = ["degree", "bachelor", "master", "b.tech", "m.tech", "mba", "bsc", "msc", "university", "college", "diploma", "certification"]
  const hits = educationTerms.filter((term) => text.includes(term)).length
  return hits ? score(45 + hits * 14) : 35
}

const getResumeQualityScore = (text: string, readableResume: boolean, hasResume: boolean) => {
  if (!hasResume) return 0
  if (!readableResume) return 35
  const lengthScore = text.length > 4000 ? 100 : text.length > 2200 ? 88 : text.length > 1100 ? 72 : text.length > 450 ? 55 : 30
  const structureTerms = ["experience", "skills", "education", "project", "summary", "certification", "responsibilities"]
  const structureScore = score((structureTerms.filter((term) => text.includes(term)).length / structureTerms.length) * 100)
  return score(lengthScore * 0.65 + structureScore * 0.35)
}

const getRiskSignals = (params: {
  text: string
  hasResume: boolean
  readableResume: boolean
  missingSkills: string[]
  experienceYears: number
  resumeQualityScore: number
}) => {
  const signals: string[] = []
  if (!params.hasResume) signals.push("Empty resume")
  if (params.hasResume && !params.readableResume) signals.push("Low confidence extraction")
  if (params.text.length > 0 && params.text.length < 650) signals.push("Very short resume")
  if (params.missingSkills.length >= 5) signals.push("Missing skills")
  if (params.experienceYears === 0) signals.push("Missing experience")

  const shortTenures = [...params.text.matchAll(/(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\s*[-–]\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})/g)].length
  if (shortTenures >= 5) signals.push("Possible job hopping")
  if (params.resumeQualityScore < 40 && params.hasResume) signals.push("Low confidence extraction")

  return displayUnique(signals)
}

const getSuggestedAction = (label: FitResult["aiRecommendationLabel"], status?: string): FitResult["suggestedNextAction"] => {
  const stage = normalize(status)
  if (stage.includes("offer") || stage.includes("selected")) return "Issue Offer"
  if (stage.includes("interview") || label === "Excellent Match" || label === "Strong Match") return "Schedule Interview"
  if (label === "Moderate Match") return "Move To Screening"
  return "Manual Review"
}

const calibrateForStage = (value: number, status?: string) => {
  const stage = normalize(status)
  if (stage.includes("hired") || stage.includes("offer") || stage.includes("selected")) return Math.max(value, 75)
  if (stage.includes("interview")) return Math.max(value, 68)
  if (stage.includes("screen") || stage.includes("shortlist")) return Math.max(value, 60)
  return value
}

export const calculateResumeFit = async (params: {
  resume?: string
  candidateName?: string
  candidateEmail?: string
  job?: JobLike | null
  status?: string
}): Promise<FitResult> => {
  const job = params.job || {}
  const resumeText = await extractReadableResumeText(params.resume)
  const candidateText = normalize(`${params.candidateName || ""} ${params.candidateEmail || ""}`)
  const text = normalize(`${resumeText} ${candidateText}`)
  const requiredSkills = getRoleKeywords(job)
  const matchedSkills = requiredSkills.filter((skill) => text.includes(skill))
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 6)
  const readableResume = text.length > normalize(params.resume || "").length + 20
  const hasResume = Boolean(params.resume)

  const skillsScore = requiredSkills.length
    ? score((matchedSkills.length / requiredSkills.length) * 100)
    : readableResume
      ? 50
      : 0

  const titleTokens = unique((job.jobTitle || "").split(/\s+/)).filter((token) => token.length > 2)
  const roleHits = titleTokens.filter((token) => text.includes(normalize(token))).length
  const roleScore = titleTokens.length ? score((roleHits / titleTokens.length) * 100) : skillsScore

  const years = extractExperienceYears(text)
  const experienceScore = years >= 5 ? 100 : years >= 3 ? 82 : years >= 1 ? 64 : readableResume ? 45 : 0
  const educationScore = getEducationScore(text)
  const resumeQualityScore = getResumeQualityScore(text, readableResume, hasResume)
  const jobRequirementScore = requiredSkills.length
    ? score(skillsScore * 0.55 + roleScore * 0.45)
    : score(roleScore * 0.65 + resumeQualityScore * 0.35)
  const baseScore = score(
    skillsScore * 0.34 +
    roleScore * 0.22 +
    experienceScore * 0.18 +
    educationScore * 0.1 +
    jobRequirementScore * 0.1 +
    resumeQualityScore * 0.06
  )
  const extractedScore = readableResume ? baseScore : Math.max(baseScore, hasResume ? 35 : 0)
  const matchScore = calibrateForStage(extractedScore, params.status)
  const aiFitScore = matchScore
  const rating = Math.max(0, Math.min(5, Number((matchScore / 20).toFixed(1))))
  const aiRecommendationLabel = getMatchLabel(matchScore)
  const recommendationStage = aiRecommendationLabel
  const riskSignals = getRiskSignals({ text, hasResume, readableResume, missingSkills, experienceYears: years, resumeQualityScore })
  const riskLevel = riskSignals.length >= 3 || !hasResume ? "High Risk" : riskSignals.length >= 1 ? "Medium Risk" : "Low Risk"
  const hiringProbability = score(matchScore * 0.68 + experienceScore * 0.12 + skillsScore * 0.12 + roleScore * 0.08)
  const hiringProbabilityLabel = hiringProbability >= 75 ? "Likely Hire" : hiringProbability >= 55 ? "Potential Hire" : "Uncertain"
  const suggestedNextAction = getSuggestedAction(aiRecommendationLabel, params.status)
  const strengths = displayUnique([
    ...matchedSkills.slice(0, 6),
    roleScore >= 70 ? "Role alignment" : "",
    experienceScore >= 70 ? "Relevant experience" : "",
    educationScore >= 70 ? "Education relevance" : "",
    resumeQualityScore >= 70 ? "Resume quality" : "",
  ]).slice(0, 8)
  const fitSummary = `${matchScore}% fit (${aiRecommendationLabel}) for ${job.jobTitle || "this role"}. Skills ${skillsScore}%, experience ${experienceScore}%, education ${educationScore}%, resume quality ${resumeQualityScore}%.`

  return {
    matchScore,
    aiFitScore,
    aiRecommendationLabel,
    skillsScore,
    experienceScore,
    roleScore,
    educationScore,
    resumeQualityScore,
    jobRequirementScore,
    hiringProbability,
    hiringProbabilityLabel,
    riskLevel,
    riskSignals,
    suggestedNextAction,
    rating,
    matchedSkills,
    missingSkills,
    strengths,
    recommendationStage,
    fitSummary,
  }
}

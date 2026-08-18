import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Briefcase,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  UploadCloud,
  FileText,
  Loader2,
  Sparkles,
  ShieldCheck,
  Send,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

export default function ReferralApplyLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [tokenData, setTokenData] = useState(null);

  const [showApplicationForm, setShowApplicationForm] = useState(false);

  // Candidate Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentLocation: "",
    yearsOfExperience: "",
    currentCompany: "",
    currentDesignation: "",
    highestEducation: "",
    noticePeriod: "",
    currentCtc: "",
    expectedCtc: "",
    linkedin: "",
    portfolio: "",
    githubProfile: "",
    coverLetter: "",
    hiringRoleId: "",
  });

  const [resume, setResume] = useState(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No referral token provided in link.");
      setLoadingToken(false);
      return;
    }

    const verifyToken = async () => {
      try {
        setLoadingToken(true);
        const res = await axios.get(`${API_BASE}/referrals/verify-token/${token}`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        });
        if (res.data?.success && res.data?.data) {
          const data = res.data.data;
          setTokenData(data);
          if (data.jobId) {
            navigate(`/apply/${data.jobId}?referralToken=${token}`, { replace: true });
            return;
          }
        } else {
          setTokenError("This referral link is invalid or no longer available.");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.error || "This referral invitation is invalid, expired, or cancelled.";
        setTokenError(errorMsg);
      } finally {
        setLoadingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleStartApplication = () => {
    setShowApplicationForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleFileChange = (file) => {
    if (!file) return;
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      toast.error("Please upload a PDF or DOCX resume document.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume file size must be under 10MB.");
      return;
    }
    setResume(file);
    toast.success(`Resume attached: ${file.name}`);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();

    if (!privacyConsent) {
      toast.error("Please agree to the recruitment privacy consent before submitting.");
      return;
    }

    if (!resume) {
      toast.error("Please upload your resume to complete the application.");
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = new FormData();
      submitData.append("referralToken", token);
      submitData.append("jobId", tokenData.jobId);
      const activeRoleId = formData.hiringRoleId || tokenData?.jobDetails?.hiringRoles?.[0]?._id || "";
      if (activeRoleId) submitData.append("hiringRoleId", activeRoleId);
      submitData.append("name", formData.name.trim());
      submitData.append("email", formData.email.trim());
      submitData.append("phone", formData.phone.trim());
      submitData.append("currentLocation", formData.currentLocation.trim());
      submitData.append("yearsOfExperience", formData.yearsOfExperience);
      submitData.append("currentCompany", formData.currentCompany.trim());
      submitData.append("currentDesignation", formData.currentDesignation.trim());
      submitData.append("highestEducation", formData.highestEducation.trim());
      submitData.append("noticePeriod", formData.noticePeriod.trim());
      submitData.append("currentCtc", formData.currentCtc.trim());
      submitData.append("expectedCtc", formData.expectedCtc.trim());
      submitData.append("linkedin", formData.linkedin.trim());
      submitData.append("portfolio", formData.portfolio.trim());
      submitData.append("githubProfile", formData.githubProfile.trim());
      submitData.append("coverLetter", formData.coverLetter.trim());
      submitData.append("privacyConsent", privacyConsent ? "true" : "false");
      submitData.append("resume", resume);

      const res = await axios.post(`${API_BASE}/applications/apply`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (res.status === 201 || res.data?._id) {
        setIsSubmittedSuccess(true);
        toast.success("Application submitted successfully!");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to submit application. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading Screen
  if (loadingToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">Validating Referral Invitation...</h3>
          <p className="text-xs text-slate-500">Connecting to enterprise portal</p>
        </div>
      </div>
    );
  }

  // Token Error Screen
  if (tokenError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-rose-200 dark:border-rose-900/50 shadow-xl bg-white dark:bg-slate-900">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Invitation Unavailable
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Referral verification notice
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-lg border text-balance">
              {tokenError}
            </p>
            <p className="text-xs text-slate-500">
              If you believe this is an error, please reach out to the colleague who referred you or contact our recruitment team.
            </p>
            <Button variant="outline" className="w-full text-xs" onClick={() => navigate("/careers")}>
              Browse Open Careers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const job = tokenData?.jobDetails || {};
  const referrer = tokenData?.referredBy || {};

  // Application Success Screen
  if (isSubmittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-emerald-200 dark:border-emerald-900/50 shadow-xl bg-white dark:bg-slate-900">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Application Submitted!
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Your referral application has been received
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-xs md:text-sm">
            <p className="text-slate-700 dark:text-slate-300">
              Thank you for applying for the <span className="font-semibold text-slate-900 dark:text-slate-100">{job.jobTitle}</span> position at InternsLand.
            </p>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-left text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" /> Referred by {referrer.name}
              </div>
              <p className="text-[11px] opacity-90">
                Your application is linked to your referral record. Our talent acquisition team will review your profile shortly.
              </p>
            </div>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer" onClick={() => navigate("/careers")}>
              Explore More Roles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active Referral Landing Page Screen
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Header */}
      <header className="border-b bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-base">
              I
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
              InternsLand <span className="text-xs font-normal text-slate-500">Careers</span>
            </span>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 text-xs py-1">
            <Sparkles className="h-3 w-3 mr-1" /> Referred Opportunity
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Referral Hero Banner */}
        <Card className="border-cyan-200 dark:border-cyan-900/50 bg-gradient-to-br from-cyan-50/80 via-white to-purple-50/50 dark:from-slate-900 dark:to-slate-950 shadow-md">
          <CardContent className="p-6 md:p-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-200 text-xs font-semibold">
              <UserCheck className="h-3.5 w-3.5 text-cyan-600" />
              You've Been Referred by <span className="underline">{referrer.name}</span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {job.jobTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">
                {job.department && (
                  <span className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-cyan-600" /> {job.department}
                  </span>
                )}
                {job.officeLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-cyan-600" /> {job.officeLocation}
                  </span>
                )}
                {job.employmentType && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-cyan-600" /> {job.employmentType}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {referrer.name} thinks you would be a great fit for the <span className="font-semibold">{job.jobTitle}</span> position at InternsLand. Review the role details below and complete your official application.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md cursor-pointer text-sm"
                onClick={handleStartApplication}
              >
                Start Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Job Details Card */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-cyan-600" /> About this Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-xs md:text-sm text-slate-700 dark:text-slate-300">
            {job.aboutRole && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">Role Description</h3>
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 leading-relaxed">{job.aboutRole}</p>
              </div>
            )}

            {job.keyResponsibilities && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-sm">Key Responsibilities</h3>
                <p className="whitespace-pre-line text-slate-600 dark:text-slate-400 leading-relaxed">{job.keyResponsibilities}</p>
              </div>
            )}

            {(() => {
              const skillsList = Array.isArray(job.requiredSkills)
                ? job.requiredSkills.filter(Boolean)
                : typeof job.requiredSkills === "string" && job.requiredSkills.trim()
                ? job.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

              if (skillsList.length === 0) return null;

              return (
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2 text-sm">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsList.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs py-1 px-3">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Candidate Application Form Section */}
        {showApplicationForm && (
          <div ref={formRef}>
            <Card className="bg-white dark:bg-slate-900 border-cyan-200 dark:border-cyan-900/40 shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600" /> Complete Referral Application
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Fill in your candidate information below. Details pre-filled from your referral link.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs md:text-sm">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name <span className="text-rose-500">*</span></Label>
                      <Input
                        id="name"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address <span className="text-rose-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="candidate@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number <span className="text-rose-500">*</span></Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="currentLocation">Current Location</Label>
                      <Input
                        id="currentLocation"
                        placeholder="e.g. Pune, India"
                        value={formData.currentLocation}
                        onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                      <Input
                        id="yearsOfExperience"
                        type="number"
                        min="0"
                        placeholder="e.g. 4"
                        value={formData.yearsOfExperience}
                        onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="currentCompany">Current / Last Company</Label>
                      <Input
                        id="currentCompany"
                        placeholder="e.g. TechCorp Solutions"
                        value={formData.currentCompany}
                        onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        value={formData.linkedin}
                        onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="portfolio">Portfolio / Website URL</Label>
                      <Input
                        id="portfolio"
                        placeholder="https://github.com/username or portfolio link"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Resume Upload Box */}
                  <div className="space-y-1.5 pt-2">
                    <Label>Upload Resume (PDF or DOCX) <span className="text-rose-500">*</span></Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                        dragActive ? "border-cyan-500 bg-cyan-50/50" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
                      }}
                    >
                      <UploadCloud className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                      {resume ? (
                        <div className="space-y-1">
                          <p className="font-semibold text-cyan-700 dark:text-cyan-300 text-xs">{resume.name}</p>
                          <p className="text-[11px] text-slate-500">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
                          <Button type="button" size="sm" variant="ghost" className="h-6 text-[11px] text-rose-600" onClick={() => setResume(null)}>
                            Change Resume
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs text-slate-700 dark:text-slate-300">Drag & drop your resume here, or click to browse</p>
                          <p className="text-[11px] text-slate-500">PDF, DOC, DOCX up to 10MB</p>
                          <input
                            type="file"
                            id="resumeFileInput"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="mt-2 h-7 text-xs"
                            onClick={() => document.getElementById("resumeFileInput")?.click()}
                          >
                            Browse File
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="coverLetter">Cover Letter / Note to Recruiter (Optional)</Label>
                    <Textarea
                      id="coverLetter"
                      rows={3}
                      placeholder="Briefly introduce yourself or highlight key accomplishments..."
                      value={formData.coverLetter}
                      onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                    />
                  </div>

                  {/* Privacy Consent Checkbox */}
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/70 rounded-lg border space-y-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 h-4 w-4"
                        checked={privacyConsent}
                        onChange={(e) => setPrivacyConsent(e.target.checked)}
                      />
                      <span>
                        <strong className="text-slate-900 dark:text-slate-100">Recruitment Privacy Consent:</strong> I consent to the processing of my personal details and resume data for recruitment evaluation purposes at InternsLand.
                      </span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold cursor-pointer px-6"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                      Submit Application
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  Linkedin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function CandidateVerificationModal({ open, onClose, extractedData, matchPreview, onConfirm }) {
  const [formData, setFormData] = useState({
    candidateName: "",
    candidateEmail: "",
    candidatePhone: "",
    skillsStr: "",
    experienceYears: 3,
    educationStr: "",
    currentRole: "",
    location: "",
    linkedinUrl: "",
  });

  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (extractedData) {
      setFormData({
        candidateName: extractedData.name || "",
        candidateEmail: extractedData.email || "",
        candidatePhone: extractedData.phone || "",
        skillsStr: Array.isArray(extractedData.skills) ? extractedData.skills.join(", ") : "",
        experienceYears: extractedData.experienceYears || 3,
        educationStr: Array.isArray(extractedData.education)
          ? extractedData.education.map((e) => `${e.degree || ""} ${e.field || ""}`).join(", ")
          : "B.Tech",
        currentRole: extractedData.currentRole || "Software Professional",
        location: extractedData.location || "On-site",
        linkedinUrl: extractedData.linkedinUrl || "",
      });
      setVerified(false);
    }
  }, [extractedData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!verified) return;

    onConfirm({
      candidateName: formData.candidateName.trim(),
      candidateEmail: formData.candidateEmail.trim(),
      candidatePhone: formData.candidatePhone.trim(),
      skills: formData.skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      experienceYears: Number(formData.experienceYears) || 0,
      educationStr: formData.educationStr,
      currentRole: formData.currentRole,
      location: formData.location,
      linkedinUrl: formData.linkedinUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950">
        <DialogHeader>
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" />
                Verify Candidate Information
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Review and edit AI-extracted candidate details before proceeding to referral creation.
              </DialogDescription>
            </div>
            {matchPreview && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs font-bold">
                Match: {matchPreview.matchScore}%
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Match Explanation Card */}
        {matchPreview && (
          <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/40 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-purple-950 dark:text-purple-200">
              <span>AI Job Fit Preview: {matchPreview.matchScore}% Match Score</span>
              <span className="text-[11px] text-purple-700">Skills Fit: {matchPreview.skillsScore}%</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] whitespace-pre-line">{matchPreview.explanation}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Candidate Full Name</Label>
              <div className="relative">
                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pl-8 h-9 text-xs"
                  value={formData.candidateName}
                  onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Candidate Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="email"
                  className="pl-8 h-9 text-xs"
                  value={formData.candidateEmail}
                  onChange={(e) => setFormData({ ...formData, candidateEmail: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  className="pl-8 h-9 text-xs"
                  value={formData.candidatePhone}
                  onChange={(e) => setFormData({ ...formData, candidatePhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Experience (Years)</Label>
              <Input
                type="number"
                className="h-9 text-xs"
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Current / Latest Role</Label>
              <Input
                className="h-9 text-xs"
                value={formData.currentRole}
                onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Location</Label>
              <Input
                className="h-9 text-xs"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="font-semibold text-slate-700 dark:text-slate-300">Key Skills (Comma separated)</Label>
            <Input
              className="h-9 text-xs"
              value={formData.skillsStr}
              onChange={(e) => setFormData({ ...formData, skillsStr: e.target.value })}
            />
          </div>

          {/* Mandatory Verification Checkbox */}
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-start gap-2 text-amber-900 dark:text-amber-300">
            <input
              type="checkbox"
              id="verifyCheck"
              className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
            />
            <label htmlFor="verifyCheck" className="cursor-pointer text-xs font-semibold leading-tight">
              I confirm that I have verified the candidate information above and accept responsibility for accuracy before submitting.
            </label>
          </div>

          <DialogFooter className="pt-2 border-t flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!verified}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" /> Continue Referral
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  User, Mail, Phone, Building, ShieldCheck, Clock, Briefcase,
  Copy, Check, Pencil, ChevronDown, ChevronUp, Camera, Key,
  UserCog, Calendar, Shield, Hash, Users, Loader2, AlertCircle,
  Eye, EyeOff,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import profileService from "@/services/profileService"

const formatRole = (role) => {
  if (!role) return "N/A"
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const safeFormat = (dateStr, fmt) => {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return null
    return format(d, fmt)
  } catch {
    return null
  }
}

const InfoRow = ({ label, value, canCopy = false, canEdit = false, onEdit, preserveCase = false }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center py-3.5 px-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
      <span className="text-sm font-medium text-muted-foreground sm:w-48 lg:w-56 shrink-0">
        {label}
      </span>
      <div className="flex items-center justify-between flex-1 mt-1 sm:mt-0 gap-4 overflow-hidden">

        <span className={`text-sm text-foreground font-medium truncate ${preserveCase ? "" : "capitalize"}`}>
          {value || (
            <span className="text-muted-foreground font-normal italic lowercase">Not provided</span>
          )}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canCopy && value && (
            <button
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Copy ${label}`}
            >
              {copied
                ? <Check className="w-3.5 h-3.5 text-green-500" />
                : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {canEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label={`Edit ${label}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


const ProfileSection = ({ title, icon: Icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden shadow-sm border-slate-200 dark:border-slate-800 transition-all">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="px-2 pb-3 pt-0 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="mt-2 flex flex-col gap-0.5">{children}</div>
        </div>
      )}
    </Card>
  )
}


const getPasswordStrength = (pw) => {
  if (!pw) return null
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "w-1/4" }
  if (score === 2) return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" }
  if (score === 3) return { label: "Good", color: "bg-blue-500", width: "w-3/4" }
  return { label: "Strong", color: "bg-emerald-500", width: "w-full" }
}


const Profile = () => {
  const { user: authUser, logout } = useAuth()

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      const res = await profileService.getProfile()
      const data = res?.data ?? res
      setProfile(data)
    } catch (err) {
      console.error("Profile fetch failed:", err)
      setProfileError(true)

      setProfile(authUser)
    } finally {
      setProfileLoading(false)
    }
  }, [authUser])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const user = profile ?? authUser
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isPhoneOpen, setIsPhoneOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)

  const [phoneLoading, setPhoneLoading] = useState(false)
  const [profileSaveLoading, setProfileSaveLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)

  const [phoneInput, setPhoneInput] = useState("")
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "" })
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  if (profileLoading) {
    return (
      <div className="w-full space-y-6 animate-pulse p-4">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-4 h-96 bg-muted rounded-xl" />
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-muted rounded-xl" />
            <div className="h-48 bg-muted rounded-xl" />
            <div className="h-36 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A"
  const roleDisplay = formatRole(user.role) // FIX #3
  const initials = `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase()


  const handlePhoneUpdate = async () => {
    if (phoneInput.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }
    setPhoneLoading(true) // FIX #5
    try {
      const res = await profileService.updateProfile({ phoneNumber: phoneInput })
      setProfile((prev) => ({ ...prev, phoneNumber: phoneInput }))
      toast.success("Phone number updated successfully")
      setIsPhoneOpen(false)
      setPhoneInput("")
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to update phone number")
    } finally {
      setPhoneLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    const firstName = profileData.firstName.trim() || user.firstName
    const lastName = profileData.lastName.trim() || user.lastName
    if (!firstName && !lastName) {
      toast.error("Name cannot be empty")
      return
    }
    setProfileSaveLoading(true)
    try {
      await profileService.updateProfile({ firstName, lastName })

      setProfile((prev) => ({ ...prev, firstName, lastName }))
      toast.success("Profile details updated successfully")
      setIsEditProfileOpen(false)
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to update profile details")
    } finally {
      setProfileSaveLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {

    if (passwordData.new.length < 8) {
      toast.error("New password must be at least 8 characters")
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match")
      return
    }
    if (passwordData.current === passwordData.new) {
      toast.error("New password must be different from current password")
      return
    }
    setPasswordLoading(true)

    try {
      await profileService.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new,
      })
      toast.success("Password changed successfully! Redirecting to login...")
      setIsPasswordOpen(false)
      setPasswordData({ current: "", new: "", confirm: "" })
      setTimeout(() => {
        if (logout) logout()
      }, 1500)
    } catch (error) {
      const msg =
        error?.error ||
        error?.response?.data?.error ||
        error?.message ||
        "Incorrect current password. Please try again."
      toast.error(msg)
    } finally {
      setPasswordLoading(false)
    }
  }
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB.")
      return
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.")
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      toast.error("Please select an image first.")
      return
    }
    setAvatarLoading(true)
    try {
      const formData = new FormData()
      formData.append("avatar", avatarFile)
      const res = await profileService.uploadAvatar(formData)
      const newAvatarUrl = res?.data?.avatarUrl ?? res?.avatarUrl
      setProfile((prev) => ({ ...prev, avatarUrl: newAvatarUrl }))
      toast.success("Avatar updated successfully")
      setIsAvatarOpen(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      toast.error(error?.error || error?.message || "Failed to upload avatar")
    } finally {
      setAvatarLoading(false)
    }
  }

  const togglePassword = (field) =>
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))

  const pwStrength = getPasswordStrength(passwordData.new)

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-10">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your personal and employment details.
          </p>
        </div>
        {profileError && (
          <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 px-3 py-2 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Some details may be incomplete. Could not fetch full profile.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <Card className="shadow-sm rounded-2xl overflow-hidden border-slate-200 dark:border-slate-800 w-full">
            <div className="h-28 w-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50" />

            <CardContent className="px-6 pb-6 pt-0 relative text-center">
              <div className="flex justify-center -mt-14 mb-4">
                <div className="h-28 w-28 shrink-0 rounded-full bg-background p-1.5 border-4 border-background shadow-sm relative group">
                  <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider overflow-hidden">
                    {user.avatarUrl
                      ? <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      : (initials || "?")}
                  </div>
                  <button
                    onClick={() => setIsAvatarOpen(true)}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    aria-label="Upload avatar"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                <p className="text-sm font-semibold text-primary tracking-wide">{roleDisplay}</p>
                <p className="text-sm text-muted-foreground">{user.department || "No Department"}</p>
                {user.employeeCode && (
                  <p className="text-xs text-muted-foreground/70 font-mono">{user.employeeCode}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <Badge
                  variant="outline"
                  className={`px-3 py-1 text-xs font-medium border ${user.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {user.isActive ? "Active Employee" : "Inactive"}
                </Badge>

                {user.isEmailVerified && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 px-3 py-1 text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 shrink-0" /> Verified
                  </Badge>
                )}
              </div>

              <div className="space-y-3 mb-8 text-left bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1 text-muted-foreground font-medium">Joined</span>
                  <span className="font-semibold text-foreground">
                    {safeFormat(user.createdAt, "MMM dd, yyyy") ?? "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1 text-muted-foreground font-medium">Last Login</span>
                  <span className="font-semibold text-foreground">
                    {safeFormat(user.lastLogin, "MMM dd, yyyy") ?? "N/A"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setProfileData({ firstName: user.firstName || "", lastName: user.lastName || "" })
                    setIsEditProfileOpen(true)
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors shadow-sm"
                >
                  <UserCog className="w-4 h-4" /> Edit Profile Details
                </button>
                <button
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); setIsAvatarOpen(true) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Upload Avatar
                </button>
                <button
                  onClick={() => { setPasswordData({ current: "", new: "", confirm: "" }); setIsPasswordOpen(true) }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <Key className="w-4 h-4" /> Change Password
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">

          <ProfileSection title="Personal Information" icon={User} defaultOpen>
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Email Address" value={user.email} canCopy preserveCase />
            <InfoRow
              label="Phone Number"
              value={user.phoneNumber || ""}
              canCopy
              canEdit
              onEdit={() => { setPhoneInput(user.phoneNumber || ""); setIsPhoneOpen(true) }}
            />
            <InfoRow
              label="Gender"
              value={user.gender && user.gender !== "N/A" ? user.gender : null}
            />
          </ProfileSection>

          <ProfileSection title="Employment Information" icon={Briefcase} defaultOpen>
            <InfoRow label="Role" value={roleDisplay} />
            <InfoRow label="Department" value={user.department || ""} />
            <InfoRow label="Employee Code" value={user.employeeCode || ""} canCopy preserveCase />
            <InfoRow
              label="Join Date"
              value={safeFormat(user.createdAt, "dd MMMM yyyy") ?? ""}
            />
            <InfoRow
              label="Employment Status"
              value={user.isActive ? "Active" : "Inactive"}
            />
          </ProfileSection>

          <ProfileSection title="Account & Security" icon={Shield} defaultOpen={false}>
            <InfoRow label="Account Status" value={user.isActive ? "Enabled" : "Disabled"} />
            <InfoRow
              label="Email Verification"
              value={user.isEmailVerified ? "Verified" : "Pending"}
            />
            <InfoRow
              label="Last Login"
              value={safeFormat(user.lastLogin, "dd MMM yyyy, HH:mm") ?? ""}
            />
            <InfoRow label="Login Attempts" value={user.loginAttempts != null ? String(user.loginAttempts) : ""} />
          </ProfileSection>

        </div>
      </div>

      <Dialog open={isPhoneOpen} onOpenChange={setIsPhoneOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Phone Number</DialogTitle>
            <DialogDescription>Enter your new 10-digit contact number.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Phone Number</Label>
            <Input
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="e.g. 9876543210"
              className="mt-2"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground mt-1.5">{phoneInput.length}/10 digits</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhoneOpen(false)} disabled={phoneLoading}>
              Cancel
            </Button>

            <Button onClick={handlePhoneUpdate} disabled={phoneLoading || phoneInput.length !== 10}>
              {phoneLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Details</DialogTitle>
            <DialogDescription>Update your primary personal information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                placeholder={user.firstName || "First name"}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                placeholder={user.lastName || "Last name"}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={profileSaveLoading}>
              Cancel
            </Button>
            <Button onClick={handleProfileUpdate} disabled={profileSaveLoading}>
              {profileSaveLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Ensure your account remains secure.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current */}
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordData.new && pwStrength && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${pwStrength.color} ${pwStrength.width}`} />
                  </div>
                  <p className={`text-xs font-medium ${pwStrength.label === "Weak" ? "text-red-500" :
                      pwStrength.label === "Fair" ? "text-yellow-600" :
                        pwStrength.label === "Good" ? "text-blue-600" : "text-emerald-600"
                    }`}>
                    {pwStrength.label} — {passwordData.new.length < 8 ? "minimum 8 characters required" : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className={`pr-10 ${passwordData.confirm && passwordData.new !== passwordData.confirm
                      ? "border-red-400 focus-visible:ring-red-400"
                      : ""
                    }`}
                />
                <button
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordData.confirm && passwordData.new !== passwordData.confirm && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Passwords do not match
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)} disabled={passwordLoading}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordUpdate}
              disabled={
                passwordLoading ||
                !passwordData.current ||
                passwordData.new.length < 8 ||
                passwordData.new !== passwordData.confirm
              }
            >
              {passwordLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
            <DialogDescription>Choose a professional photo. Square JPG/PNG, max 2MB.</DialogDescription>
          </DialogHeader>

          <div className="py-4 flex flex-col items-center gap-4">
            {avatarPreview ? (
              <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-border shadow">
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-muted">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            <label className="cursor-pointer w-full">
              <div className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Camera className="w-4 h-4" />
                {avatarFile ? "Change Selection" : "Choose Photo"}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileSelect}
                className="hidden"
              />
            </label>

            {avatarFile && (
              <p className="text-xs text-muted-foreground text-center">
                Selected: <span className="font-medium">{avatarFile.name}</span>
                {" "}({(avatarFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsAvatarOpen(false); setAvatarFile(null); setAvatarPreview(null) }}
              disabled={avatarLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAvatarUpload} disabled={!avatarFile || avatarLoading}>
              {avatarLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : "Upload Avatar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default Profile
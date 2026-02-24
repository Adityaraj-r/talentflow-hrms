import React, { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { 
  User, Mail, Phone, Building, ShieldCheck, Clock, Briefcase,
  Copy, Check, Pencil, ChevronDown, ChevronUp, Camera, Key, UserCog, Calendar, Shield
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import profileService from "@/services/profileService"

const InfoRow = ({ label, value, canCopy = false, canEdit = false, onEdit }) => {
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
        <span className="text-sm text-foreground font-medium truncate capitalize">
          {value || <span className="text-muted-foreground font-normal italic lowercase">Not provided</span>}
        </span>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canCopy && value && (
            <button 
              onClick={handleCopy}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {canEdit && (
            <button 
              onClick={onEdit}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
            <Icon className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      
      {isOpen && (
        <div className="px-2 pb-3 pt-0 border-t border-border animate-in slide-in-from-top-2 duration-200">
          <div className="mt-2 flex flex-col gap-0.5">
            {children}
          </div>
        </div>
      )}
    </Card>
  )
}

const Profile = () => {
  const { user, logout } = useAuth()
  
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isPhoneOpen, setIsPhoneOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [isAvatarOpen, setIsAvatarOpen] = useState(false)

  const [phoneInput, setPhoneInput] = useState("")
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "" })
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  const [isLoading, setIsLoading] = useState(false)

  if (!user) {
    return (
      <div className="w-full space-y-6 animate-pulse p-4">
        <div className="h-8 w-48 bg-muted rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
          <div className="lg:col-span-4 h-96 bg-muted rounded-xl"></div>
          <div className="lg:col-span-8 space-y-4 h-96 bg-muted rounded-xl"></div>
        </div>
      </div>
    )
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'
  const roleDisplay = user.role ? user.role.replace('_', ' ').toLowerCase() : 'n/a'
  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`

  const handlePhoneUpdate = async () => {
    if (phoneInput.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }
    setIsLoading(true)
    try {
      await profileService.updateProfile({ phoneNumber: phoneInput })
      toast.success("Phone number updated successfully")
      setIsPhoneOpen(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error.error || "Failed to update phone number")
    } finally {
      setIsLoading(false)
    }
  }

  const handleProfileUpdate = async () => {
    setIsLoading(true)
    try {
      await profileService.updateProfile({ 
        firstName: profileData.firstName || user.firstName,
        lastName: profileData.lastName || user.lastName 
      })
      toast.success("Profile details updated successfully")
      setIsEditProfileOpen(false)
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      toast.error(error.error || "Failed to update profile details")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match")
      return
    }
    setIsLoading(true)
    try {
      await profileService.changePassword({
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      })
      
      toast.success("Password changed successfully! Redirecting to login...")
      setIsPasswordOpen(false)
      
      setTimeout(() => {
        if (logout) logout()
      }, 1500)
      
    } catch (error) {
      const errorMessage = 
        error?.error || 
        error?.response?.data?.error || 
        error?.message || 
        "Incorrect current password. Please try again."
        
      toast.error(errorMessage)
      setIsLoading(false) 
    }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      toast.success(`Avatar ${file.name} selected for upload`)
      setIsAvatarOpen(false)
    }
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your personal and employment details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <Card className="shadow-sm rounded-2xl overflow-hidden border-slate-200 dark:border-slate-800 w-full">
            <div className="h-28 w-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-800/50" />
            
            <CardContent className="px-6 pb-6 pt-0 relative text-center">
              <div className="flex justify-center -mt-14 mb-4">
                <div className="h-28 w-28 shrink-0 rounded-full bg-background p-1.5 border-4 border-background shadow-sm relative group">
                  <div className="h-full w-full rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider overflow-hidden">
                    {initials || '?'}
                  </div>
                  <button 
                    onClick={() => setIsAvatarOpen(true)}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                <p className="text-sm font-semibold text-primary capitalize tracking-wide">{roleDisplay}</p>
                <p className="text-sm text-muted-foreground">{user.department || 'No Department'}</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
                <Badge 
                  variant="outline" 
                  className={`px-3 py-1 text-xs font-medium border ${
                    user.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                      : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${user.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  {user.isActive ? 'Active Employee' : 'Inactive'}
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
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="flex-1 text-muted-foreground font-medium">Last Login</span>
                  <span className="font-semibold text-foreground">
                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'N/A'}
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
                  onClick={() => setIsAvatarOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <Camera className="w-4 h-4" /> Upload Avatar
                </button>
                <button 
                  onClick={() => setIsPasswordOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors shadow-sm"
                >
                  <Key className="w-4 h-4" /> Change Password
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <ProfileSection title="Personal Information" icon={User} defaultOpen={true}>
            <InfoRow label="Full Name" value={fullName} canEdit={false} />
            <InfoRow label="Email Address" value={user.email} canCopy canEdit={false} />
            <InfoRow 
              label="Phone Number" 
              value={user.phoneNumber || ''} 
              canCopy 
              canEdit={true} 
              onEdit={() => {
                setPhoneInput(user.phoneNumber || "")
                setIsPhoneOpen(true)
              }} 
            />
          </ProfileSection>

          <ProfileSection title="Employment Information" icon={Briefcase} defaultOpen={true}>
            <InfoRow label="Role" value={roleDisplay} canEdit={false} />
            <InfoRow label="Department" value={user.department || ''} canEdit={false} />
            <InfoRow 
              label="Join Date" 
              value={user.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy') : ''} 
              canEdit={false} 
            />
            <InfoRow 
              label="Employment Status" 
              value={user.isActive ? "Active" : "Inactive"} 
              canEdit={false} 
            />
          </ProfileSection>

          <ProfileSection title="Account & Security" icon={Shield} defaultOpen={false}>
            <InfoRow label="Account Status" value={user.isActive ? "Enabled" : "Disabled"} canEdit={false} />
            <InfoRow label="Email Verification" value={user.isEmailVerified ? "Verified" : "Pending"} canEdit={false} />
            <InfoRow 
              label="Last Login" 
              value={user.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm') : ''} 
              canEdit={false} 
            />
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
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPhoneOpen(false)}>Cancel</Button>
            <Button onClick={handlePhoneUpdate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile Details</DialogTitle>
            <DialogDescription>
              Update your primary personal information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input 
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input 
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
            <Button onClick={handleProfileUpdate} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Ensure your account remains secure.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password" 
                value={passwordData.current}
                onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={passwordData.new}
                onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type="password" 
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordUpdate} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAvatarOpen} onOpenChange={setIsAvatarOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Upload Avatar</DialogTitle>
            <DialogDescription>Choose a professional photo for your profile.</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-lg bg-slate-50 dark:bg-slate-900">
            <Camera className="w-10 h-10 text-muted-foreground mb-4" />
            <Input 
              type="file" 
              accept="image/*"
              onChange={handleAvatarUpload}
              className="max-w-[250px]"
            />
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Recommended: Square JPG or PNG, max 2MB.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAvatarOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default Profile
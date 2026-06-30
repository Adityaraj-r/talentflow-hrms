import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import apiClient from "@/services/apiClient"
import { useTheme } from "@/contexts/ThemeContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Briefcase, Eye, EyeOff, KeyRound, Moon, RefreshCw, Sun } from "lucide-react"
import { toast } from "sonner"

const passwordRules = [
  { label: "At least 12 characters", test: (value) => value.length >= 12 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One lowercase letter", test: (value) => /[a-z]/.test(value) },
  { label: "One number", test: (value) => /\d/.test(value) },
  { label: "One special character", test: (value) => /[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/.test(value) },
]

const strengthLabels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"]
const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-600"]

const generateStrongPassword = (length = 16) => {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%^&*_-+=",
  ]
  const allChars = groups.join("")
  const bytes = new Uint32Array(length)
  window.crypto.getRandomValues(bytes)

  const required = groups.map((group, index) => group[bytes[index] % group.length])
  const rest = Array.from({ length: length - required.length }, (_, index) => {
    const value = bytes[index + required.length]
    return allChars[value % allChars.length]
  })

  const password = [...required, ...rest]
  for (let i = password.length - 1; i > 0; i -= 1) {
    const j = bytes[i] % (i + 1)
    const current = password[i]
    password[i] = password[j]
    password[j] = current
  }

  return password.join("")
}

const ResetPassword = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ""
  const otp = location.state?.otp || ""

  useEffect(() => {
    if (!email || !otp) navigate("/forgot-password", { replace: true })
  }, [email, otp, navigate])

  const passedRules = useMemo(
    () => passwordRules.filter((rule) => rule.test(password)).length,
    [password]
  )
  const strengthIndex = Math.max(0, Math.min(4, passedRules - 1))
  const strengthValue = password ? passedRules * 20 : 0
  const isPasswordValid = passedRules === passwordRules.length

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword()
    setPassword(generated)
    setConfirmPassword(generated)
    toast.success("Strong password generated")
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isPasswordValid) {
      toast.error("Please choose a stronger password")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Confirm password must match")
      return
    }

    setIsLoading(true)
    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
        otp,
        password,
        confirmPassword,
      })
      toast.success(response.message || "Password reset successfully")
      navigate("/login", { replace: true })
    } catch (error) {
      toast.error(error?.error || error?.message || "Unable to reset password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Button variant="ghost" size="icon" onClick={toggleTheme} className="absolute top-4 right-4">
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>Create a strong new password for {email || "your account"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="pl-9 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Strength</span>
                <span>{password ? strengthLabels[strengthIndex] : "Very Weak"}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full transition-all ${strengthColors[strengthIndex]}`}
                  style={{ width: `${strengthValue}%` }}
                />
              </div>
              <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                {passwordRules.map((rule) => {
                  const passes = rule.test(password)
                  return (
                    <span key={rule.label} className={passes ? "text-green-600 dark:text-green-400" : ""}>
                      {passes ? "OK" : "--"} {rule.label}
                    </span>
                  )
                })}
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGeneratePassword} disabled={isLoading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Strong Password
            </Button>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ResetPassword

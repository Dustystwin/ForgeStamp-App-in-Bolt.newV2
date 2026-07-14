import { useState } from "react"
import { Eye, EyeOff, Loader as Loader2, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { checkPasswordBreach } from "@/lib/password-check"

type Mode = "sign-in" | "sign-up" | "reset-password"

interface AuthModalProps {
  open: boolean
  defaultMode?: Mode
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ open, defaultMode = "sign-in", onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Reset fields when modal opens/mode changes
  const switchMode = (m: Mode) => {
    setMode(m)
    setEmail("")
    setPassword("")
    setShowPassword(false)
  }

  const handleClose = () => {
    switchMode(defaultMode)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    try {
      if (mode === "reset-password") {
        const { error } = await resetPassword(email.trim())
        if (error) {
          toast.error(error)
        } else {
          toast.success("Password reset email sent. Check your inbox.")
          handleClose()
        }
        return
      }

      if (mode === "sign-in") {
        const { error } = await signIn(email.trim(), password)
        if (error) {
          toast.error(error)
        } else {
          toast.success("Signed in successfully.")
          handleClose()
          onSuccess?.()
        }
        return
      }

      if (mode === "sign-up") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.")
          return
        }
        const { compromised, occurrences } = await checkPasswordBreach(password)
        if (compromised) {
          toast.error(
            `This password has been found in ${occurrences.toLocaleString()} known data breaches. Please choose a different password.`,
          )
          return
        }
        const { error } = await signUp(email.trim(), password)
        if (error) {
          toast.error(error)
        } else {
          toast.success("Account created! You are now signed in.")
          handleClose()
          onSuccess?.()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const title = mode === "sign-in" ? "Sign In" : mode === "sign-up" ? "Create Account" : "Reset Password"
  const description =
    mode === "sign-in"
      ? "Sign in to save your watermarked images for 30 days."
      : mode === "sign-up"
      ? "Create a free account to save and manage your watermarked images."
      : "Enter your email and we'll send you a reset link."

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
      <DialogContent className="w-full max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="auth-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          {mode !== "reset-password" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "sign-up" ? "Min. 6 characters" : "Your password"}
                  autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {mode === "sign-in" && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground self-end transition-colors"
              onClick={() => switchMode("reset-password")}
            >
              Forgot password?
            </button>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : title}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-1 pt-1 text-sm text-muted-foreground">
          {mode === "sign-in" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => switchMode("sign-up")}
              >
                Sign up free
              </button>
            </>
          ) : mode === "sign-up" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => switchMode("sign-in")}
              >
                Sign in
              </button>
            </>
          ) : (
            <button
              type="button"
              className="font-medium text-primary hover:underline"
              onClick={() => switchMode("sign-in")}
            >
              Back to sign in
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

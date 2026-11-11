import { useState } from "react"
import { Eye, EyeOff, Loader as Loader2, Lock } from "lucide-react"
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

interface SetNewPasswordModalProps {
  open: boolean
}

function calmPasswordError(message: string): string {
  if (/session missing|invalid claim|jwt expired|auth session/i.test(message)) {
    return "This reset link has expired. Request a new password email."
  }
  return message
}

export function SetNewPasswordModal({ open }: SetNewPasswordModalProps) {
  const { session, updatePassword, dismissPasswordRecovery } = useAuth()
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      return
    }
    setLoading(true)
    try {
      const { compromised, occurrences } = await checkPasswordBreach(password)
      if (compromised) {
        toast.error(
          `This password has been found in ${occurrences.toLocaleString()} known data breaches. Please choose a different password.`,
        )
        return
      }
      const { error } = await updatePassword(password)
      if (error) {
        toast.error(calmPasswordError(error))
        return
      }
      setPassword("")
      toast.success("Your password has been saved.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="w-full max-w-sm"
        showCloseButton={false}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Choose a new password</DialogTitle>
          <DialogDescription>
            This sets the password you will use the next time you sign in.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Save password"}
          </Button>
        </form>

        <div className="flex items-center justify-center pt-1 text-sm text-muted-foreground">
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => {
              void dismissPasswordRecovery()
            }}
          >
            {session ? "Sign out" : "Close"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

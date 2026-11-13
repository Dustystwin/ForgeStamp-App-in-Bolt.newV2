import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { toast } from "sonner"
import {
  clearPasswordRecovery,
  isPasswordRecoveryPending,
  passwordResetRedirectTo,
  supabase,
  type Profile,
} from "@/lib/supabase"

interface AuthContextType {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null; signedIn: boolean }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  passwordRecovery: boolean
  dismissPasswordRecovery: () => Promise<void>
  refreshProfile: () => Promise<void>
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message
  }
  return "An unexpected error occurred"
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, signedIn: false }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
  passwordRecovery: false,
  dismissPasswordRecovery: async () => {},
  refreshProfile: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

async function fetchProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()
  if (error) return { profile: null, error: error.message }
  return { profile: data as Profile | null, error: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(isPasswordRecoveryPending)
  const profileErrorNotified = useRef(false)

  const applyProfile = useCallback((result: { profile: Profile | null; error: string | null }) => {
    if (result.error) {
      if (!profileErrorNotified.current) {
        profileErrorNotified.current = true
        toast.error("We couldn't load your account. Refresh the page and try again.")
      }
      setProfile(null)
      return
    }
    profileErrorNotified.current = false
    setProfile(result.profile)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return
    applyProfile(await fetchProfile(session.user.id))
  }, [applyProfile, session])

  useEffect(() => {
    const showRecovery = () => setPasswordRecovery(true)
    window.addEventListener("forgestamp-password-recovery", showRecovery)
    if (isPasswordRecoveryPending()) setPasswordRecovery(true)

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (isPasswordRecoveryPending()) setPasswordRecovery(true)
      if (data.session?.user) {
        fetchProfile(data.session.user.id).then((result) => {
          applyProfile(result)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      ;(async () => {
        if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true)
        setSession(newSession)
        if (newSession?.user) {
          applyProfile(await fetchProfile(newSession.user.id))
        } else {
          setProfile(null)
        }
        setLoading(false)
      })()
    })

    return () => {
      window.removeEventListener("forgestamp-password-recovery", showRecovery)
      listener.subscription.unsubscribe()
    }
  }, [applyProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: extractMessage(error) }
      return { error: null }
    } catch (e) {
      return { error: extractMessage(e) }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: extractMessage(error), signedIn: false }
      // Email confirmation leaves session empty. A session means they are signed in.
      return { error: null, signedIn: data.session != null }
    } catch (e) {
      return { error: extractMessage(e), signedIn: false }
    }
  }, [])

  const signOut = useCallback(async () => {
    clearPasswordRecovery()
    setPasswordRecovery(false)
    try {
      await supabase.auth.signOut()
    } catch {
      // best-effort
    }
    setProfile(null)
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: passwordResetRedirectTo(),
      })
      if (error) return { error: extractMessage(error) }
      return { error: null }
    } catch (e) {
      return { error: extractMessage(e) }
    }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { error: extractMessage(error) }
      clearPasswordRecovery()
      setPasswordRecovery(false)
      return { error: null }
    } catch (e) {
      return { error: extractMessage(e) }
    }
  }, [])

  const dismissPasswordRecovery = useCallback(async () => {
    await signOut()
  }, [signOut])

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        passwordRecovery,
        dismissPasswordRecovery,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

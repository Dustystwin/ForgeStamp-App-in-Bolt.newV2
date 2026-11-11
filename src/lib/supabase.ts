import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const RECOVERY_FLAG = "forgestamp-password-recovery"

function recoveryHintInUrl(): boolean {
  if (typeof window === "undefined") return false
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""))
  if (hashParams.get("type") === "recovery") return true
  return new URLSearchParams(window.location.search).get("type") === "recovery"
}

export function markPasswordRecovery() {
  try {
    sessionStorage.setItem(RECOVERY_FLAG, "1")
  } catch {
    // sessionStorage can be unavailable in private browsing
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("forgestamp-password-recovery"))
  }
}

export function clearPasswordRecovery() {
  try {
    sessionStorage.removeItem(RECOVERY_FLAG)
  } catch {
    // ignore
  }
  if (typeof window === "undefined") return
  const url = new URL(window.location.href)
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""))
  if (hashParams.get("type") === "recovery" || url.hash.includes("access_token")) {
    url.hash = ""
  }
  if (url.searchParams.get("type") === "recovery") {
    url.searchParams.delete("type")
  }
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`)
}

export function isPasswordRecoveryPending(): boolean {
  try {
    return sessionStorage.getItem(RECOVERY_FLAG) === "1"
  } catch {
    return false
  }
}

// Read the reset link before the client removes it from the address bar.
if (recoveryHintInUrl()) markPasswordRecovery()

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

supabase.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") markPasswordRecovery()
})

/** Site root. Supabase Auth must already allow this address. Allow-list edits wait until launch. */
export function passwordResetRedirectTo(): string {
  if (typeof window === "undefined") return "/"
  return `${window.location.origin}/`
}

export interface Profile {
  id: string
  email: string
  tier: "free" | "pro"
  is_admin: boolean
  created_at: string
}

export interface StoredImage {
  id: string
  user_id: string
  original_path: string
  output_path: string
  settings: Record<string, unknown>
  filename: string
  total_size: number
  created_at: string
  expires_at: string
}

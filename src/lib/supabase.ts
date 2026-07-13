import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

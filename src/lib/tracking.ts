import { supabase } from "@/lib/supabase"

export interface TrackSocials {
  instagram: string
  tiktok: string
  facebook: string
  pinterest: string
  youtube: string
  etsy: string
  website: string
}

export interface TrackPage {
  id?: string
  slug: string
  shopUrl: string
  contact: string
  socials: TrackSocials
  scans?: number
}

export const EMPTY_SOCIALS: TrackSocials = {
  instagram: "",
  tiktok: "",
  facebook: "",
  pinterest: "",
  youtube: "",
  etsy: "",
  website: "",
}

const VISITOR = "fs-track-visitor"

export function trackingUrl(slug: string): string {
  const origin = typeof window === "undefined" ? "https://forgestamp.app" : window.location.origin
  return `${origin}/?track=${slug}`
}

export function tidySlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)
}

function visitorToken(): string {
  try {
    const existing = localStorage.getItem(VISITOR)
    if (existing && existing.length >= 8) return existing
    const next = crypto.randomUUID().replace(/-/g, "")
    localStorage.setItem(VISITOR, next)
    return next
  } catch {
    return "visitor-local-fallback"
  }
}

export interface TrackPageLoad {
  page: TrackPage | null
  schemaMissing: boolean
}

/** True only when PostgREST or Postgres says the tracking table or function is not there. */
export function trackingSchemaMissing(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  const code = (error.code ?? "").toUpperCase()
  if (code === "PGRST205" || code === "PGRST202" || code === "42P01" || code === "42883") return true
  const message = (error.message ?? "").toLowerCase()
  return (
    message.includes("schema cache")
    || message.includes("does not exist")
    || message.includes("could not find the table")
    || message.includes("could not find the function")
  )
}

const SCHEMA_WAIT = "The tracking page waits until the database update is applied. The migration is in the repo and has not been run."

export async function loadOwnTrackPage(): Promise<TrackPageLoad> {
  const { data, error } = await supabase.from("track_pages").select("id, slug, shop_url, contact, socials").limit(1)
  if (error) return { page: null, schemaMissing: trackingSchemaMissing(error) }
  if (!data || data.length === 0) return { page: null, schemaMissing: false }
  const row = data[0] as { id: string; slug: string; shop_url: string; contact: string; socials: Partial<TrackSocials> }
  const { count } = await supabase.from("track_scans").select("id", { count: "exact", head: true }).eq("page_id", row.id)
  return {
    page: {
      id: row.id,
      slug: row.slug,
      shopUrl: row.shop_url,
      contact: row.contact,
      socials: { ...EMPTY_SOCIALS, ...row.socials },
      scans: count ?? 0,
    },
    schemaMissing: false,
  }
}

export async function saveTrackPage(page: TrackPage): Promise<TrackPage> {
  const slug = tidySlug(page.slug)
  if (slug.length < 3) throw new Error("Use at least 3 letters or numbers in the link name.")
  const payload = {
    slug,
    shop_url: page.shopUrl.trim().slice(0, 200),
    contact: page.contact.trim().slice(0, 120),
    socials: page.socials,
  }
  const { data, error } = page.id
    ? await supabase.from("track_pages").update(payload).eq("id", page.id).select("id, slug").single()
    : await supabase.from("track_pages").insert(payload).select("id, slug").single()
  if (error || !data) {
    if (trackingSchemaMissing(error)) throw new Error(SCHEMA_WAIT)
    throw new Error("Could not save that page.")
  }
  return { ...page, id: data.id, slug: data.slug, scans: page.scans ?? 0 }
}

export interface PublicTrackPage {
  page: Omit<TrackPage, "id" | "scans"> | null
  schemaMissing: boolean
}

export async function readPublicTrackPage(slug: string): Promise<PublicTrackPage> {
  const { data, error } = await supabase.rpc("read_track_page", { page_slug: slug })
  if (error) return { page: null, schemaMissing: trackingSchemaMissing(error) }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return { page: null, schemaMissing: false }
  return {
    page: {
      slug: row.slug,
      shopUrl: row.shop_url ?? "",
      contact: row.contact ?? "",
      socials: { ...EMPTY_SOCIALS, ...(row.socials ?? {}) },
    },
    schemaMissing: false,
  }
}

export async function recordTrackScan(slug: string): Promise<void> {
  await supabase.rpc("record_track_scan", { page_slug: slug, visitor_token: visitorToken() })
}

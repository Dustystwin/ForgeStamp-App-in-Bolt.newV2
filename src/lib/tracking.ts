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

export async function loadOwnTrackPage(): Promise<TrackPage | null> {
  const { data, error } = await supabase.from("track_pages").select("id, slug, shop_url, contact, socials").limit(1)
  if (error || !data || data.length === 0) return null
  const row = data[0] as { id: string; slug: string; shop_url: string; contact: string; socials: Partial<TrackSocials> }
  const { count } = await supabase.from("track_scans").select("id", { count: "exact", head: true }).eq("page_id", row.id)
  return {
    id: row.id,
    slug: row.slug,
    shopUrl: row.shop_url,
    contact: row.contact,
    socials: { ...EMPTY_SOCIALS, ...row.socials },
    scans: count ?? 0,
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
    throw new Error("The tracking page waits until the database update is applied. The migration is in the repo and has not been run.")
  }
  return { ...page, id: data.id, slug: data.slug, scans: page.scans ?? 0 }
}

export async function readPublicTrackPage(slug: string): Promise<Omit<TrackPage, "id" | "scans"> | null> {
  const { data, error } = await supabase.rpc("read_track_page", { page_slug: slug })
  if (error || !data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    slug: row.slug,
    shopUrl: row.shop_url ?? "",
    contact: row.contact ?? "",
    socials: { ...EMPTY_SOCIALS, ...(row.socials ?? {}) },
  }
}

export async function recordTrackScan(slug: string): Promise<void> {
  await supabase.rpc("record_track_scan", { page_slug: slug, visitor_token: visitorToken() })
}

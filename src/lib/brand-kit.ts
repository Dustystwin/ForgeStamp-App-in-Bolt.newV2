import { FONT_OPTIONS, LOGO_MAX_FILE_SIZE_BYTES } from "@/lib/editor-types"
import type { PlanId } from "@/lib/plans"
import { savedImagesExceedLimit, calmStorageError, safeStorageFileName } from "@/lib/storage-quota"
import { supabase } from "@/lib/supabase"

export const BRAND_FONT_LIMIT = 3
export const BRAND_COLOR_LIMIT = 6
export const BRAND_HANDLE_LIMIT = 4
export const BRAND_NAME_LIMIT = 40

/** Spark keeps one kit. Forge keeps five. Free cannot save one. */
export function brandKitLimit(plan: PlanId): number {
  if (plan === "forge") return 5
  if (plan === "spark") return 1
  return 0
}

export interface BrandKit {
  id: string
  name: string
  fonts: string[]
  colors: string[]
  handles: string[]
  website: string
  logoDataUrl: string | null
  logoBytes: number
  logoPath: string | null
}

export const SAMPLE_BRAND_KIT: BrandKit = {
  id: "sample",
  name: "Sunrise studio",
  fonts: ["Inter", "Georgia", "Caveat"],
  colors: ["#FF8A00", "#FFF7EE", "#1F2937", "#18B66A", "#F4C7A1", "#111111"],
  handles: ["@yourhandle"],
  website: "https://example.com",
  logoDataUrl: null,
  logoBytes: 0,
  logoPath: null,
}

const LOCAL_KEY = "fs-brand-kits-v1"

function storageKey(userId: string | null): string {
  return `${LOCAL_KEY}:${userId ?? "guest"}`
}

function asStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

export function tidyKit(input: Partial<BrandKit> & { name: string }): BrandKit {
  const fonts = asStringList(input.fonts, BRAND_FONT_LIMIT).filter((font) =>
    FONT_OPTIONS.some((option) => option.value === font),
  )
  const colors = asStringList(input.colors, BRAND_COLOR_LIMIT)
    .map((color) => color.toUpperCase())
    .filter((color) => /^#[0-9A-F]{6}$/.test(color))
  const handles = asStringList(input.handles, BRAND_HANDLE_LIMIT).map((handle) =>
    handle.startsWith("@") ? handle.slice(0, 32) : `@${handle}`.slice(0, 32),
  )
  let website = (input.website ?? "").trim().slice(0, 200)
  if (website && !/^https?:\/\//i.test(website)) website = `https://${website}`
  return {
    id: input.id && input.id !== "sample" ? input.id : crypto.randomUUID(),
    name: input.name.trim().slice(0, BRAND_NAME_LIMIT) || "My brand",
    fonts,
    colors,
    handles,
    website,
    logoDataUrl: input.logoDataUrl ?? null,
    logoBytes: Math.max(0, input.logoBytes ?? 0),
    logoPath: input.logoPath ?? null,
  }
}

function readLocal(userId: string | null): BrandKit[] {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as Partial<BrandKit>[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((row) => row && typeof row.name === "string")
      .map((row) => tidyKit(row as BrandKit))
  } catch {
    return []
  }
}

function writeLocal(userId: string | null, kits: BrandKit[]) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(kits))
  } catch {
    // A large logo can miss the browser quota. The kit fields still apply this session.
  }
}

function rowToKit(row: Record<string, unknown>): BrandKit {
  return tidyKit({
    id: String(row.id),
    name: String(row.name ?? "My brand"),
    fonts: asStringList(row.fonts, BRAND_FONT_LIMIT),
    colors: asStringList(row.colors, BRAND_COLOR_LIMIT),
    handles: asStringList(row.handles, BRAND_HANDLE_LIMIT),
    website: String(row.website ?? ""),
    logoBytes: Number(row.logo_bytes) || 0,
    logoPath: typeof row.logo_path === "string" ? row.logo_path : null,
    logoDataUrl: null,
  })
}

async function withLogoPreview(kit: BrandKit): Promise<BrandKit> {
  if (!kit.logoPath || kit.logoDataUrl) return kit
  const { data, error } = await supabase.storage.from("watermark-images").createSignedUrl(kit.logoPath, 60 * 30)
  if (error || !data?.signedUrl) return kit
  return { ...kit, logoDataUrl: data.signedUrl }
}

export async function loadBrandKits(userId: string | null): Promise<{ kits: BrandKit[]; remote: boolean }> {
  const local = readLocal(userId)
  if (!userId) return { kits: local, remote: false }
  const { data, error } = await supabase.from("brand_kits").select("*").order("created_at", { ascending: true })
  if (error || !data) return { kits: local, remote: false }
  const kits = await Promise.all((data as Record<string, unknown>[]).map((row) => withLogoPreview(rowToKit(row))))
  writeLocal(userId, kits)
  return { kits, remote: true }
}

export function brandLogoPath(userId: string, kitId: string, fileName: string): string {
  return `${userId}/brand/${kitId}_${safeStorageFileName(fileName)}`
}

export async function logoFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose a PNG, JPG, or WebP logo.")
  if (file.size > LOGO_MAX_FILE_SIZE_BYTES) throw new Error("That logo is over 8 MB.")
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Could not read that logo."))
    reader.readAsDataURL(file)
  })
  return dataUrl
}

async function uploadLogo(userId: string, kit: BrandKit, file: File, existingBytes: number): Promise<BrandKit> {
  if (await savedImagesExceedLimit(existingBytes + file.size)) {
    throw new Error("This account can store up to 500 MB. Delete some saved images to make room.")
  }
  const path = brandLogoPath(userId, kit.id, file.name || "logo.png")
  const { error } = await supabase.storage.from("watermark-images").upload(path, file, {
    contentType: file.type || "image/png",
    upsert: true,
  })
  if (error) throw new Error(calmStorageError(error.message))
  if (kit.logoPath && kit.logoPath !== path) {
    await supabase.storage.from("watermark-images").remove([kit.logoPath])
  }
  return { ...kit, logoPath: path, logoBytes: file.size, logoDataUrl: kit.logoDataUrl }
}

export async function saveBrandKit(
  userId: string | null,
  kit: BrandKit,
  kits: BrandKit[],
  logoFile: File | null,
  limit: number,
): Promise<{ kits: BrandKit[]; remote: boolean; note: string | null }> {
  if (limit < 1) throw new Error("Brand kits are on Spark and Forge.")
  const existing = kits.find((item) => item.id === kit.id)
  if (!existing && kits.length >= limit) {
    throw new Error(limit === 1 ? "Spark keeps 1 brand kit." : `Forge keeps up to ${limit} brand kits.`)
  }
  let next = kit
  if (logoFile) {
    next = { ...next, logoDataUrl: await logoFileToDataUrl(logoFile), logoBytes: logoFile.size }
    if (userId) {
      const others = kits.filter((item) => item.id !== kit.id).reduce((sum, item) => sum + item.logoBytes, 0)
      next = await uploadLogo(userId, next, logoFile, others)
    }
  }
  const merged = existing
    ? kits.map((item) => (item.id === kit.id ? next : item))
    : [...kits, next]

  if (!userId) {
    writeLocal(null, merged)
    return { kits: merged, remote: false, note: "Saved on this browser. Sign in on Spark or Forge to keep the logo in your 500 MB folder." }
  }

  const payload = {
    id: next.id,
    user_id: userId,
    name: next.name,
    logo_path: next.logoPath,
    logo_bytes: next.logoBytes,
    fonts: next.fonts,
    colors: next.colors,
    handles: next.handles,
    website: next.website,
  }
  const { error } = await supabase.from("brand_kits").upsert(payload)
  if (error) {
    writeLocal(userId, merged)
    return {
      kits: merged,
      remote: false,
      note: "Saved on this browser. The account copy waits until the brand kit database update is applied.",
    }
  }
  writeLocal(userId, merged)
  return { kits: merged, remote: true, note: null }
}

export async function deleteBrandKit(userId: string | null, id: string, kits: BrandKit[]): Promise<BrandKit[]> {
  const target = kits.find((kit) => kit.id === id)
  const next = kits.filter((kit) => kit.id !== id)
  writeLocal(userId, next)
  if (userId && target?.logoPath) {
    await supabase.storage.from("watermark-images").remove([target.logoPath])
  }
  if (userId) {
    await supabase.from("brand_kits").delete().eq("id", id)
  }
  return next
}

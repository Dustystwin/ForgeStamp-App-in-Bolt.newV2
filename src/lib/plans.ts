import type { ExportFormat } from "@/lib/editor-types"

/**
 * Plan numbers. Keep these identical to the checks in
 * supabase/migrations/20261118123000_spark_forge_plans_presets_and_history.sql.
 *
 * Spark and Forge are real feature levels. They are not for sale: nothing
 * in the app charges a card. A legacy "pro" row is Forge.
 */

export type PlanId = "free" | "spark" | "forge"

export const FREE_BATCH_LIMIT = 3
export const SPARK_BATCH_LIMIT = 25
/** In-browser cap. A true unlimited batch would hold every finished photo in memory. */
export const FORGE_BATCH_LIMIT = 50

export const SPARK_PRESET_LIMIT = 10
export const FORGE_PRESET_LIMIT = 200

export const FREE_HISTORY_DAYS = 30
export const SPARK_HISTORY_DAYS = 180
export const FREE_HISTORY_COUNT = 20
export const SPARK_HISTORY_COUNT = 100

export const FORMAT_OPTIONS: {
  value: ExportFormat
  label: string
  mime: string
  extension: string
  quality?: number
}[] = [
  { value: "png", label: "PNG", mime: "image/png", extension: "png" },
  { value: "jpeg", label: "JPG", mime: "image/jpeg", extension: "jpg", quality: 0.92 },
  { value: "webp", label: "WebP", mime: "image/webp", extension: "webp", quality: 0.92 },
]

/** Stored tier, with legacy pro folded into Forge. Admin does not change the name. */
export function normalizeTier(tier: string | null | undefined): PlanId {
  if (tier === "spark") return "spark"
  if (tier === "forge" || tier === "pro") return "forge"
  return "free"
}

/**
 * What the account can actually use. Admins get Forge tools so they can test
 * them. Guests and everyone else without a paid tier are Free.
 */
export function effectivePlan(tier: string | null | undefined, isAdmin = false): PlanId {
  if (isAdmin) return "forge"
  return normalizeTier(tier)
}

export function planName(plan: PlanId): string {
  if (plan === "spark") return "Spark"
  if (plan === "forge") return "Forge"
  return "Free"
}

export function batchLimitForPlan(plan: PlanId): number {
  if (plan === "forge") return FORGE_BATCH_LIMIT
  if (plan === "spark") return SPARK_BATCH_LIMIT
  return FREE_BATCH_LIMIT
}

export function batchLimitForTier(tier: string | null | undefined, isAdmin = false): number {
  return batchLimitForPlan(effectivePlan(tier, isAdmin))
}

export function presetLimitForPlan(plan: PlanId): number {
  if (plan === "forge") return FORGE_PRESET_LIMIT
  if (plan === "spark") return SPARK_PRESET_LIMIT
  return 0
}

export function allowedFormats(plan: PlanId): ExportFormat[] {
  if (plan === "free") return ["png"]
  return ["png", "jpeg", "webp"]
}

export function resolveExportFormat(plan: PlanId, format: ExportFormat): ExportFormat {
  return allowedFormats(plan).includes(format) ? format : "png"
}

export function formatOption(format: ExportFormat) {
  return FORMAT_OPTIONS.find((option) => option.value === format) ?? FORMAT_OPTIONS[0]
}

export const EXPORT_LONG_EDGES = [2048, 1600, 1080] as const

/** Null keeps the photo's long edge. Free always keeps the original. */
export function resolveLongEdge(plan: PlanId, edge: number): number | null {
  if (plan === "free") return null
  return (EXPORT_LONG_EDGES as readonly number[]).includes(edge) ? edge : null
}

/** JPG and WebP quality. Free does not use this; PNG stays lossless. */
export function resolveExportQuality(plan: PlanId, quality: number): number {
  if (plan === "free") return 92
  if (!Number.isFinite(quality)) return 92
  return Math.min(100, Math.max(60, Math.round(quality)))
}

export function canUseSparkTools(tier: string | null | undefined, isAdmin = false): boolean {
  return effectivePlan(tier, isAdmin) !== "free"
}

/** How many saved images this plan can keep. Forge has no count cap. */
export function historyCap(plan: PlanId): number | null {
  if (plan === "forge") return null
  if (plan === "spark") return SPARK_HISTORY_COUNT
  return FREE_HISTORY_COUNT
}

/** "18 of 20 saved", or "12 saved" when the plan has no count cap. */
export function savedCountLabel(count: number, plan: PlanId): string {
  const cap = historyCap(plan)
  if (cap == null) return `${count} saved`
  return `${count} of ${cap} saved`
}

/**
 * Shown before export when this batch cannot all be kept.
 * Null when everything fits, or when the plan has no count cap.
 */
export function saveFitWarning(plan: PlanId, saved: number, exporting: number): string | null {
  const cap = historyCap(plan)
  if (cap == null || exporting <= 0) return null
  const room = Math.max(0, cap - saved)
  if (exporting <= room) return null
  if (room <= 0) {
    return `This will still download. Nothing more can be saved (${saved} of ${cap}). Delete some in My Images to make room.`
  }
  const noun = room === 1 ? "image" : "images"
  return `This will still download. Only ${room} more ${noun} can be saved (${saved} of ${cap}).`
}

/** Short line for My Images and the account area. */
export function historySummary(plan: PlanId): string {
  if (plan === "forge") return "kept until you delete them"
  if (plan === "spark") return `${SPARK_HISTORY_DAYS} days, up to ${SPARK_HISTORY_COUNT} images`
  return `${FREE_HISTORY_DAYS} days, up to ${FREE_HISTORY_COUNT} images`
}

export function historySavePhrase(plan: PlanId, count: number): string {
  if (plan === "forge") {
    return count === 1 ? "Kept until you delete it." : "Each is kept until you delete it."
  }
  const days = plan === "spark" ? SPARK_HISTORY_DAYS : FREE_HISTORY_DAYS
  return count === 1 ? `Expires in ${days} days.` : `Each expires in ${days} days.`
}

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

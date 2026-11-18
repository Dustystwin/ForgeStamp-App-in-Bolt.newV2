import { effectivePlan } from "@/lib/plans"

// Builder Mode — while true, everyone can use premium fonts and colors.
// Keep this false for a demo or any public build so those options are not free.
// It does not unlock JPG, WebP, presets, or a larger batch. Those follow the plan.
export const BUILDER_MODE = false

/**
 * Premium fonts and colors. Spark, Forge, and a legacy Pro account include them.
 * An admin can use them too, so the paid libraries can be tested without a sale.
 */
export function canUsePremiumFeatures(tier: string | null | undefined, isAdmin = false): boolean {
  if (BUILDER_MODE || isAdmin) return true
  return effectivePlan(tier, false) !== "free"
}

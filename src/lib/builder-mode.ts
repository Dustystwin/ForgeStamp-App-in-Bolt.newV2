// Builder Mode — while true, everyone can use premium fonts and colors.
// Keep this false for a demo or any public build so those options are not free.
export const BUILDER_MODE = false

/**
 * Premium fonts, colors, and batch export.
 * Builder mode unlocks them for everyone. Otherwise only a Pro account can use them.
 * The database still has two tiers: free and pro. Spark and Forge are not separate tiers yet.
 */
export function canUsePremiumFeatures(tier: string | null | undefined): boolean {
  return BUILDER_MODE || tier === "pro"
}

// Free exports one photo. Pro matches the Spark plan: 25 photos in one export.
// Forge's unlimited batch is not available, because there is no Forge tier yet.
// There is no monthly batch counter.
export const FREE_BATCH_LIMIT = 1
export const PRO_BATCH_LIMIT = 25

export function batchLimitForTier(tier: string | null | undefined): number {
  return canUsePremiumFeatures(tier) ? PRO_BATCH_LIMIT : FREE_BATCH_LIMIT
}

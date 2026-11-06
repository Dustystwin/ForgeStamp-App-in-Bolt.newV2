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

// Free matches the Free plan: 3 photos in one export.
// Pro matches the Spark plan: 25 photos in one export. Admins can test that
// higher limit too. Forge's unlimited batch is not available, because there
// is no Forge tier yet. There is no monthly batch counter.
export const FREE_BATCH_LIMIT = 3
export const PRO_BATCH_LIMIT = 25

export function batchLimitForTier(
  tier: string | null | undefined,
  isAdmin = false
): number {
  if (isAdmin || canUsePremiumFeatures(tier)) return PRO_BATCH_LIMIT
  return FREE_BATCH_LIMIT
}

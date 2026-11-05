// Builder Mode — while true, everyone can use premium fonts and colors.
// Keep this false for a demo or any public build so those options are not free.
export const BUILDER_MODE = false

/**
 * Premium fonts and colors.
 * Builder mode unlocks them for everyone. Otherwise only a Pro account can use them.
 * The database still has two tiers: free and pro. Spark and Forge are not separate tiers yet.
 */
export function canUsePremiumFeatures(tier: string | null | undefined): boolean {
  return BUILDER_MODE || tier === "pro"
}

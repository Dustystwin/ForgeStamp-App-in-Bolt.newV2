import type { EditorState } from "@/lib/editor-types"

export type StrengthLabel = "Easy to crop out" | "Good" | "Well protected"

export function watermarkStrength(state: Pick<
  EditorState,
  "coverageMode" | "placement" | "opacity" | "density" | "autoContrast" | "freeX" | "freeY" | "pattern"
>): { label: StrengthLabel; score: number; note: string } {
  let score = 0
  const full = state.coverageMode === "full"
  if (full) score += 2
  if (full && state.density <= 140) score += 1
  if (state.opacity >= 45) score += 1
  if (state.opacity >= 75) score += 1
  const placedCenter = state.placement === "center"
    || (state.freeX != null && state.freeY != null && state.freeX > 0.25 && state.freeX < 0.75 && state.freeY > 0.25 && state.freeY < 0.75)
  if (full || placedCenter) score += 2
  if (state.pattern === "border" && !placedCenter) score -= 1
  if (state.autoContrast) score += 1
  if (!full && !placedCenter) score -= 1

  if (score >= 5) {
    return {
      label: "Well protected",
      score,
      note: "Coverage, the middle of the photo, and contrast make this hard to crop away.",
    }
  }
  if (score >= 3) {
    return {
      label: "Good",
      score,
      note: "A full pattern or a stronger mark would protect more of the photo.",
    }
  }
  return {
    label: "Easy to crop out",
    score,
    note: "A corner mark or a faint one can be cropped or covered. Try a full pattern, more opacity, or the center.",
  }
}

import type { Pattern } from "@/lib/editor-types"
import { getPatternPoints } from "@/lib/pattern-layout"
import { measureTextStamp } from "@/lib/pattern-layout"
import { drawStamp } from "@/lib/watermark-utils"

const SAMPLE = "Your Text"

/**
 * Mini pattern drawn with the same stamp layout the preview and export use.
 * The font is chosen so several copies fit in the little square.
 */
export function paintPatternThumb(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern | null,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#f4f1ec"
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = "#3f2a22"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.globalAlpha = 1

  let fontPx = Math.max(8, Math.round(Math.min(width, height) * 0.16))
  ctx.font = `bold ${fontPx}px Inter, sans-serif`
  let box = measureTextStamp(ctx, SAMPLE, fontPx, "Inter", false)
  const target = width * 0.34
  if (box.width > 1) {
    fontPx = Math.max(7, Math.min(fontPx, Math.round(fontPx * (target / box.width))))
    ctx.font = `bold ${fontPx}px Inter, sans-serif`
    box = measureTextStamp(ctx, SAMPLE, fontPx, "Inter", false)
  }

  if (!pattern) {
    ctx.fillText(SAMPLE, width / 2, height / 2)
    return
  }

  const spacing = Math.max(box.height * 0.8, Math.min(width, height) * 0.18)
  const points = getPatternPoints(
    width,
    height,
    pattern,
    spacing,
    box.width,
    box.height,
    "readable",
    false,
    0,
  )
  ctx.font = `bold ${fontPx}px Inter, sans-serif`
  for (const point of points) {
    drawStamp(ctx, SAMPLE, point, 0, "readable")
  }
}

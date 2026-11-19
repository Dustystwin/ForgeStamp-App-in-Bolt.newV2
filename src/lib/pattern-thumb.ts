import type { Pattern } from "@/lib/editor-types"
import { releaseCanvas } from "@/lib/image-resources"
import { getPatternPoints, measureTextStamp, scaledStampFont } from "@/lib/pattern-layout"
import { drawStamp } from "@/lib/watermark-utils"

const SAMPLE = "Your Text"
const VIRTUAL = 384
const PHOTO_FONT = 48
const PHOTO_DENSITY = 90

/**
 * Draw the real pattern at photo-like proportions on a square, then shrink it
 * smoothly into the button. Tiny letters drawn directly at 64px turn to mush.
 */
export function paintPatternThumb(
  ctx: CanvasRenderingContext2D,
  pattern: Pattern | null,
  cssWidth: number,
  cssHeight: number,
) {
  const off = document.createElement("canvas")
  off.width = VIRTUAL
  off.height = VIRTUAL
  const pen = off.getContext("2d")
  if (!pen) {
    releaseCanvas(off)
    return
  }
  pen.fillStyle = "#f4f1ec"
  pen.fillRect(0, 0, VIRTUAL, VIRTUAL)
  pen.fillStyle = "#3f2a22"
  pen.textAlign = "center"
  pen.textBaseline = "middle"
  pen.globalAlpha = 1

  const fontPx = scaledStampFont(PHOTO_FONT, VIRTUAL, VIRTUAL)
  pen.font = `bold ${fontPx}px Inter, sans-serif`
  if (!pattern) {
    pen.fillText(SAMPLE, VIRTUAL / 2, VIRTUAL / 2)
  } else {
    const box = measureTextStamp(pen, SAMPLE, fontPx, "Inter", false)
    const glyphs = Array.from(SAMPLE).map((ch) => pen.measureText(ch).width)
    const spacing = PHOTO_DENSITY * (Math.sqrt(VIRTUAL * VIRTUAL) / 800)
    const points = getPatternPoints(
      VIRTUAL,
      VIRTUAL,
      pattern,
      spacing,
      box.width,
      box.height,
      "readable",
      false,
      0,
      glyphs,
    )
    pen.font = `bold ${fontPx}px Inter, sans-serif`
    for (const point of points) {
      drawStamp(pen, SAMPLE, point, 0, "readable")
    }
  }

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  ctx.clearRect(0, 0, cssWidth, cssHeight)
  ctx.drawImage(off, 0, 0, cssWidth, cssHeight)
  ctx.restore()
  releaseCanvas(off)
}

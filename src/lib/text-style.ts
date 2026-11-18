import type { DateStampFormat } from "@/lib/editor-types"

export interface TextPaint {
  outlineWidth: number
  outlineColor: string
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  gradient?: { colors: string[]; angle: number }
}

export function scaledTextPaint(input: {
  fontSize: number
  scaledFont: number
  outlineWidth: number
  outlineColor: string
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  gradientOn?: boolean
  gradientColors?: string[]
  gradientAngle?: number
}): TextPaint | undefined {
  const scale = input.scaledFont / Math.max(1, input.fontSize)
  const outlineWidth = input.outlineWidth > 0 ? input.outlineWidth * scale : 0
  const shadow = input.shadowEnabled
  const colors = (input.gradientColors ?? []).filter((color) => color.trim().length > 0)
  const gradient = input.gradientOn && colors.length >= 2
    ? { colors, angle: input.gradientAngle ?? 0 }
    : undefined
  if (outlineWidth <= 0 && !shadow && !gradient) return undefined
  return {
    outlineWidth,
    outlineColor: input.outlineColor,
    shadowColor: shadow ? input.shadowColor : "transparent",
    shadowBlur: shadow ? input.shadowBlur * scale : 0,
    shadowOffsetX: shadow ? input.shadowOffsetX * scale : 0,
    shadowOffsetY: shadow ? input.shadowOffsetY * scale : 0,
    gradient,
  }
}

export function textPaintPadding(paint: TextPaint | undefined): number {
  if (!paint) return 0
  const shadowReach = Math.max(Math.abs(paint.shadowOffsetX), Math.abs(paint.shadowOffsetY)) + paint.shadowBlur * 0.35
  return paint.outlineWidth + shadowReach
}

/** Ramp across the ink that is being filled, so both colors stay on the letters. */
function textGradient(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colors: string[],
  angleDeg: number,
): CanvasGradient {
  const metrics = ctx.measureText(text)
  const width = Math.max(metrics.width, 1)
  const fontPx = Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 0)
  let ascent = metrics.actualBoundingBoxAscent
  let descent = metrics.actualBoundingBoxDescent
  if (ascent + descent < 1) {
    const em = Math.max(fontPx, 12)
    if (ctx.textBaseline === "middle") {
      ascent = em / 2
      descent = em / 2
    } else if (ctx.textBaseline === "top" || ctx.textBaseline === "hanging") {
      ascent = 0
      descent = em
    } else if (ctx.textBaseline === "bottom") {
      ascent = em
      descent = 0
    } else {
      ascent = em * 0.8
      descent = em * 0.2
    }
  }
  let left = x
  if (ctx.textAlign === "center") left = x - width / 2
  else if (ctx.textAlign === "right" || ctx.textAlign === "end") left = x - width
  const top = y - ascent
  const height = Math.max(ascent + descent, 1)
  const cx = left + width / 2
  const cy = top + height / 2
  const angle = (angleDeg * Math.PI) / 180
  const dx = Math.cos(angle)
  const dy = Math.sin(angle)
  const reach = Math.max(1, Math.abs(dx) * (width / 2) + Math.abs(dy) * (height / 2))
  const gradient = ctx.createLinearGradient(
    cx - dx * reach,
    cy - dy * reach,
    cx + dx * reach,
    cy + dy * reach,
  )
  colors.forEach((stop, index) => {
    gradient.addColorStop(index / Math.max(1, colors.length - 1), stop)
  })
  return gradient
}

/** Stroke, then fill. A shadow is drawn once, with the stroke, so it is not doubled. */
export function paintFill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  paint?: TextPaint,
) {
  const shadow = Boolean(
    paint && (paint.shadowBlur > 0 || paint.shadowOffsetX !== 0 || paint.shadowOffsetY !== 0),
  )
  if (shadow && paint) {
    ctx.shadowColor = paint.shadowColor
    ctx.shadowBlur = paint.shadowBlur
    ctx.shadowOffsetX = paint.shadowOffsetX
    ctx.shadowOffsetY = paint.shadowOffsetY
  }
  if (paint && paint.outlineWidth > 0) {
    ctx.lineWidth = paint.outlineWidth
    ctx.strokeStyle = paint.outlineColor
    ctx.lineJoin = "round"
    ctx.miterLimit = 2
    ctx.strokeText(text, x, y)
    if (shadow) {
      ctx.shadowColor = "transparent"
      ctx.shadowBlur = 0
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 0
    }
  }
  const previousFill = ctx.fillStyle
  if (paint?.gradient && paint.gradient.colors.length >= 2) {
    ctx.fillStyle = textGradient(ctx, text, x, y, paint.gradient.colors, paint.gradient.angle)
  }
  ctx.fillText(text, x, y)
  ctx.fillStyle = previousFill
  if (shadow) {
    ctx.shadowColor = "transparent"
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
}

export function formatDateStamp(format: DateStampFormat, date = new Date()): string {
  if (format === "off") return ""
  if (format === "year") return String(date.getFullYear())
  const month = date.getMonth() + 1
  const day = date.getDate()
  const year = date.getFullYear()
  if (format === "numeric") return `${month}/${day}/${year}`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function composeWatermarkText(text: string, format: DateStampFormat, date = new Date()): string {
  const stamp = formatDateStamp(format, date)
  const base = text.trim()
  if (!stamp) return base || "\u00A0"
  if (!base) return stamp
  return `${base} ${stamp}`
}

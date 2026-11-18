import type { DateStampFormat } from "@/lib/editor-types"

export interface TextPaint {
  outlineWidth: number
  outlineColor: string
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
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
}): TextPaint | undefined {
  const scale = input.scaledFont / Math.max(1, input.fontSize)
  const outlineWidth = input.outlineWidth > 0 ? input.outlineWidth * scale : 0
  const shadow = input.shadowEnabled
  if (outlineWidth <= 0 && !shadow) return undefined
  return {
    outlineWidth,
    outlineColor: input.outlineColor,
    shadowColor: shadow ? input.shadowColor : "transparent",
    shadowBlur: shadow ? input.shadowBlur * scale : 0,
    shadowOffsetX: shadow ? input.shadowOffsetX * scale : 0,
    shadowOffsetY: shadow ? input.shadowOffsetY * scale : 0,
  }
}

export function textPaintPadding(paint: TextPaint | undefined): number {
  if (!paint) return 0
  const shadowReach = Math.max(Math.abs(paint.shadowOffsetX), Math.abs(paint.shadowOffsetY)) + paint.shadowBlur * 0.35
  return paint.outlineWidth + shadowReach
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
  ctx.fillText(text, x, y)
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

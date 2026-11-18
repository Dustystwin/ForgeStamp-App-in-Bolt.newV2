import { paintFill, type TextPaint } from "@/lib/text-style"

/** Simple original marks. These are not the official icons of any company. */
export const HANDLE_PLATFORMS = [
  { id: "none", label: "No icon" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "pinterest", label: "Pinterest" },
  { id: "youtube", label: "YouTube" },
  { id: "etsy", label: "Etsy" },
  { id: "website", label: "Website" },
] as const

export type HandlePlatform = (typeof HANDLE_PLATFORMS)[number]["id"]

export function isHandlePlatform(value: unknown): value is HandlePlatform {
  return HANDLE_PLATFORMS.some((item) => item.id === value)
}

export function drawPlatformGlyph(
  ctx: CanvasRenderingContext2D,
  platform: HandlePlatform,
  x: number,
  y: number,
  size: number,
  color: string,
) {
  if (platform === "none") return
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = Math.max(1.25, size * 0.08)
  ctx.lineJoin = "round"
  ctx.lineCap = "round"
  const s = size
  if (platform === "instagram") {
    roundRect(ctx, -s * 0.42, -s * 0.42, s * 0.84, s * 0.84, s * 0.22)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(s * 0.22, -s * 0.22, s * 0.05, 0, Math.PI * 2)
    ctx.fill()
  } else if (platform === "tiktok") {
    ctx.beginPath()
    ctx.arc(-s * 0.08, s * 0.16, s * 0.16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s * 0.08, s * 0.16)
    ctx.lineTo(s * 0.08, -s * 0.38)
    ctx.lineTo(s * 0.32, -s * 0.22)
    ctx.stroke()
  } else if (platform === "facebook") {
    ctx.beginPath()
    ctx.arc(-s * 0.16, -s * 0.08, s * 0.16, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(s * 0.16, -s * 0.02, s * 0.18, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(-s * 0.16, -s * 0.28, s * 0.08, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(s * 0.18, -s * 0.26, s * 0.09, 0, Math.PI * 2)
    ctx.stroke()
  } else if (platform === "pinterest") {
    ctx.beginPath()
    ctx.arc(0, -s * 0.08, s * 0.28, 0, Math.PI * 2)
    ctx.moveTo(-s * 0.08, s * 0.12)
    ctx.lineTo(0, s * 0.42)
    ctx.lineTo(s * 0.1, s * 0.12)
    ctx.stroke()
  } else if (platform === "youtube") {
    roundRect(ctx, -s * 0.46, -s * 0.32, s * 0.92, s * 0.64, s * 0.16)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-s * 0.08, -s * 0.14)
    ctx.lineTo(-s * 0.08, s * 0.14)
    ctx.lineTo(s * 0.18, 0)
    ctx.closePath()
    ctx.fill()
  } else if (platform === "etsy") {
    ctx.beginPath()
    ctx.moveTo(-s * 0.4, s * 0.1)
    ctx.lineTo(-s * 0.4, -s * 0.08)
    ctx.quadraticCurveTo(-s * 0.2, -s * 0.32, 0, -s * 0.08)
    ctx.quadraticCurveTo(s * 0.2, -s * 0.32, s * 0.4, -s * 0.08)
    ctx.lineTo(s * 0.4, s * 0.1)
    ctx.stroke()
    ctx.strokeRect(-s * 0.4, s * 0.1, s * 0.8, s * 0.28)
  } else if (platform === "website") {
    ctx.beginPath()
    ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.ellipse(0, 0, s * 0.16, s * 0.4, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-s * 0.4, 0)
    ctx.lineTo(s * 0.4, 0)
    ctx.stroke()
  }
  ctx.restore()
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Icon plus the handle, as one picture, so patterns can place it like a logo. */
export function renderHandleStamp(
  text: string,
  fontPx: number,
  fontFamily: string,
  color: string,
  platform: HandlePlatform,
  paint?: TextPaint,
): HTMLCanvasElement {
  const measure = document.createElement("canvas").getContext("2d")!
  measure.font = `bold ${fontPx}px "${fontFamily}", sans-serif`
  const label = text.trim() || "@yourhandle"
  const textW = measure.measureText(label).width
  const icon = platform === "none" ? 0 : fontPx * 0.95
  const gap = icon ? fontPx * 0.28 : 0
  const pad = fontPx * 0.35
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.ceil(pad * 2 + icon + gap + textW))
  canvas.height = Math.max(1, Math.ceil(fontPx * 1.5))
  const ctx = canvas.getContext("2d")!
  ctx.font = measure.font
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillStyle = color
  if (icon) drawPlatformGlyph(ctx, platform, pad + icon / 2, canvas.height / 2, icon, color)
  paintFill(ctx, label, pad + icon + gap, canvas.height / 2, paint)
  return canvas
}

import { encode } from "uqr"

const QR_OPTIONS = { ecc: "H" as const, border: 4 }
const MODULE_PX = 8

export type QrUrlProblem = "empty" | "invalid" | "too-long"

export interface QrUrlStatus {
  href: string | null
  problem: QrUrlProblem | null
}

// Accept only real web links. Nothing is filled in for the user.
export function inspectQrUrl(raw: string): QrUrlStatus {
  const trimmed = raw.trim()
  if (!trimmed) return { href: null, problem: "empty" }

  let href: string
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { href: null, problem: "invalid" }
    }
    href = url.toString()
  } catch {
    return { href: null, problem: "invalid" }
  }

  try {
    encode(href, QR_OPTIONS)
  } catch {
    return { href: null, problem: "too-long" }
  }

  return { href, problem: null }
}

export function isHardToScanColor(color: string): boolean {
  const match = /^#([0-9a-fA-F]{6})$/.exec(color)
  if (!match) return false
  const hex = match[1]
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luminance > 0.85
}

function qrDarkColor(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : "#000000"
}

// Draws a quiet-zone QR (high error correction) and returns a PNG data URL.
// Returns null when the link is empty, not http(s), or too long to encode.
export function renderQrDataUrl(raw: string, color: string): string | null {
  const status = inspectQrUrl(raw)
  if (!status.href) return null

  let qr: ReturnType<typeof encode>
  try {
    qr = encode(status.href, QR_OPTIONS)
  } catch {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = qr.size * MODULE_PX
  canvas.height = qr.size * MODULE_PX
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = qrDarkColor(color)

  for (let y = 0; y < qr.size; y++) {
    const row = qr.data[y]
    if (!row) continue
    for (let x = 0; x < qr.size; x++) {
      if (row[x]) ctx.fillRect(x * MODULE_PX, y * MODULE_PX, MODULE_PX, MODULE_PX)
    }
  }

  return canvas.toDataURL("image/png")
}

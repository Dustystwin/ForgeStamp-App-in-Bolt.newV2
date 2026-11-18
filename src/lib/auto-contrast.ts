/** Average brightness of the photo under a mark, from 0 (black) to 255 (white). */
export function sampleMeanLuminance(
  source: CanvasImageSource,
  viewW: number,
  viewH: number,
  x: number,
  y: number,
  boxW: number,
  boxH: number,
): number {
  const sized = source as CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
  const srcW = sized.naturalWidth || sized.width || 0
  const srcH = sized.naturalHeight || sized.height || 0
  if (!srcW || !srcH || viewW < 1 || viewH < 1) return 128
  const sx = Math.max(0, Math.floor(((x - boxW / 2) / viewW) * srcW))
  const sy = Math.max(0, Math.floor(((y - boxH / 2) / viewH) * srcH))
  const sw = Math.max(1, Math.min(Math.ceil((boxW / viewW) * srcW), srcW - sx))
  const sh = Math.max(1, Math.min(Math.ceil((boxH / viewH) * srcH), srcH - sy))
  const dw = Math.min(24, sw)
  const dh = Math.min(24, sh)
  const scratch = document.createElement("canvas")
  scratch.width = dw
  scratch.height = dh
  const ctx = scratch.getContext("2d", { willReadFrequently: true })
  if (!ctx) return 128
  try {
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, dw, dh)
    const data = ctx.getImageData(0, 0, dw, dh).data
    let total = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      total += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
      count += 1
    }
    return count ? total / count : 128
  } catch {
    return 128
  } finally {
    scratch.width = 0
    scratch.height = 0
  }
}

/** Dark ink on a light photo, light ink on a dark photo. Mid gray also gets an outline. */
export function inkForLuminance(luminance: number): { color: string; outline: string | null } {
  const light = luminance >= 140
  return {
    color: light ? "#161616" : "#FFFFFF",
    outline: luminance > 96 && luminance < 176 ? (light ? "#FFFFFF" : "#161616") : null,
  }
}

/** A plate behind a logo or QR so the mark stays readable. */
export function plateForLuminance(luminance: number): string {
  return luminance >= 140 ? "rgba(22,22,22,0.78)" : "rgba(255,255,255,0.88)"
}

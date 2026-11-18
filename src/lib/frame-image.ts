import type { CropAspect, FrameMode } from "@/lib/editor-types"
import { closeBitmap, releaseCanvas } from "@/lib/image-resources"

const RATIOS: Record<Exclude<CropAspect, "original">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "4:3": 4 / 3,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
}

export interface FrameRequest {
  aspect: CropAspect
  mode: FrameMode
  quarterTurns: number
  flipHorizontal: boolean
  flipVertical: boolean
  longEdge: number | null
}

export function normalizeQuarterTurns(turns: number): number {
  if (!Number.isFinite(turns)) return 0
  return ((Math.round(turns) % 4) + 4) % 4
}

export function emptyFrameRequest(): FrameRequest {
  return {
    aspect: "original",
    mode: "fit",
    quarterTurns: 0,
    flipHorizontal: false,
    flipVertical: false,
    longEdge: null,
  }
}

/** True when the photo cannot be used as-is. Original + Fit with no turn or flip is the old path. */
export function needsFrame(width: number, height: number, request: FrameRequest): boolean {
  if (normalizeQuarterTurns(request.quarterTurns) !== 0) return true
  if (request.flipHorizontal || request.flipVertical) return true
  if (request.aspect !== "original") return true
  if (request.longEdge && request.longEdge > 0 && Math.max(width, height) > request.longEdge) return true
  return false
}

function orientBitmap(
  bitmap: ImageBitmap,
  turns: number,
  flipHorizontal: boolean,
  flipVertical: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  const swapped = turns % 2 === 1
  canvas.width = Math.max(1, swapped ? bitmap.height : bitmap.width)
  canvas.height = Math.max(1, swapped ? bitmap.width : bitmap.height)
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    releaseCanvas(canvas)
    throw new Error("Could not prepare that photo.")
  }
  // Flip after the turn, so "horizontal" means left-right of the picture the person sees.
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1)
  ctx.rotate((turns * Math.PI) / 2)
  ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)
  return canvas
}

function frameSize(srcW: number, srcH: number, aspect: CropAspect, mode: FrameMode): { w: number; h: number } {
  if (aspect === "original") return { w: srcW, h: srcH }
  const ratio = RATIOS[aspect]
  const current = srcW / srcH
  if (mode === "fill") {
    if (current > ratio) return { w: srcH * ratio, h: srcH }
    return { w: srcW, h: srcW / ratio }
  }
  if (mode === "fit") {
    if (current > ratio) return { w: srcW, h: srcW / ratio }
    return { w: srcH * ratio, h: srcH }
  }
  const long = Math.max(srcW, srcH)
  if (ratio >= 1) return { w: long, h: long / ratio }
  return { w: long * ratio, h: long }
}

function drawBlurredCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  outW: number,
  outH: number,
) {
  const blur = Math.max(18, Math.round(Math.min(outW, outH) * 0.035))
  const cover = Math.max(outW / srcW, outH / srcH)
  const dw = srcW * cover + blur * 4
  const dh = srcH * cover + blur * 4
  ctx.save()
  ctx.filter = `blur(${blur}px)`
  ctx.drawImage(source, (outW - dw) / 2, (outH - dh) / 2, dw, dh)
  ctx.restore()
}

/**
 * Rotate, flip, then place the photo in the chosen frame.
 * Fit keeps the whole photo and fills the spare space with a soft enlarged copy.
 * Fill covers the frame and crops the middle. Stretch pulls the photo to the edges.
 */
export function frameBitmap(bitmap: ImageBitmap, request: FrameRequest): HTMLCanvasElement {
  const turns = normalizeQuarterTurns(request.quarterTurns)
  const oriented = orientBitmap(bitmap, turns, request.flipHorizontal, request.flipVertical)
  try {
    const srcW = oriented.width
    const srcH = oriented.height
    const mode: FrameMode = request.aspect === "original" ? "fit" : request.mode
    let { w: outW, h: outH } = frameSize(srcW, srcH, request.aspect, mode)
    if (request.longEdge && request.longEdge > 0 && Math.max(outW, outH) > request.longEdge) {
      const scale = request.longEdge / Math.max(outW, outH)
      outW *= scale
      outH *= scale
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(outW))
    canvas.height = Math.max(1, Math.round(outH))
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      releaseCanvas(canvas)
      throw new Error("Could not prepare that photo.")
    }

    if (request.aspect === "original" || mode === "fill") {
      let cropW = srcW
      let cropH = srcH
      if (request.aspect !== "original") {
        const ratio = RATIOS[request.aspect]
        const current = srcW / srcH
        if (current > ratio) cropW = srcH * ratio
        else cropH = srcW / ratio
      }
      const sx = (srcW - cropW) / 2
      const sy = (srcH - cropH) / 2
      ctx.drawImage(oriented, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height)
      return canvas
    }

    if (mode === "stretch") {
      ctx.drawImage(oriented, 0, 0, srcW, srcH, 0, 0, canvas.width, canvas.height)
      return canvas
    }

    drawBlurredCover(ctx, oriented, srcW, srcH, canvas.width, canvas.height)
    const contain = Math.min(canvas.width / srcW, canvas.height / srcH)
    const dw = srcW * contain
    const dh = srcH * contain
    ctx.drawImage(oriented, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
    return canvas
  } finally {
    releaseCanvas(oriented)
  }
}

export async function frameFile(file: Blob, request: FrameRequest): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  try {
    return frameBitmap(bitmap, request)
  } finally {
    closeBitmap(bitmap)
  }
}

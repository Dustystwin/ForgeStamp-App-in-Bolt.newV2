import type { CropAspect } from "@/lib/editor-types"
import { closeBitmap, releaseCanvas } from "@/lib/image-resources"

const RATIOS: Record<Exclude<CropAspect, "original">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
  "2:3": 2 / 3,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
}

export function normalizeQuarterTurns(turns: number): number {
  if (!Number.isFinite(turns)) return 0
  return ((Math.round(turns) % 4) + 4) % 4
}

/** Center-crop to an aspect, rotate in 90° steps, then optionally fit the long edge. */
export function frameBitmap(
  bitmap: ImageBitmap,
  aspect: CropAspect,
  quarterTurns: number,
  longEdge: number | null,
): HTMLCanvasElement {
  const turns = normalizeQuarterTurns(quarterTurns)
  const rotated = document.createElement("canvas")
  const swapped = turns % 2 === 1
  rotated.width = swapped ? bitmap.height : bitmap.width
  rotated.height = swapped ? bitmap.width : bitmap.height
  const rctx = rotated.getContext("2d")
  if (!rctx || rotated.width < 1 || rotated.height < 1) {
    releaseCanvas(rotated)
    throw new Error("Could not prepare that photo.")
  }
  rctx.translate(rotated.width / 2, rotated.height / 2)
  rctx.rotate((turns * Math.PI) / 2)
  rctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2)

  let cropW = rotated.width
  let cropH = rotated.height
  if (aspect !== "original") {
    const target = RATIOS[aspect]
    const current = rotated.width / rotated.height
    if (current > target) {
      cropW = rotated.height * target
    } else {
      cropH = rotated.width / target
    }
  }
  cropW = Math.max(1, cropW)
  cropH = Math.max(1, cropH)

  let outW = cropW
  let outH = cropH
  if (longEdge && longEdge > 0 && Math.max(outW, outH) > longEdge) {
    const scale = longEdge / Math.max(outW, outH)
    outW *= scale
    outH *= scale
  }

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(outW))
  canvas.height = Math.max(1, Math.round(outH))
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    releaseCanvas(rotated)
    releaseCanvas(canvas)
    throw new Error("Could not prepare that photo.")
  }
  const sx = (rotated.width - cropW) / 2
  const sy = (rotated.height - cropH) / 2
  ctx.drawImage(rotated, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height)
  releaseCanvas(rotated)
  return canvas
}

export function needsFrame(
  width: number,
  height: number,
  aspect: CropAspect,
  quarterTurns: number,
  longEdge: number | null,
): boolean {
  if (normalizeQuarterTurns(quarterTurns) !== 0) return true
  if (aspect !== "original") return true
  if (longEdge && longEdge > 0 && Math.max(width, height) > longEdge) return true
  return false
}

export async function frameFile(
  file: Blob,
  aspect: CropAspect,
  quarterTurns: number,
  longEdge: number | null,
): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  try {
    return frameBitmap(bitmap, aspect, quarterTurns, longEdge)
  } finally {
    closeBitmap(bitmap)
  }
}

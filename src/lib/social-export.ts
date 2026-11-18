import { zipFiles } from "@/lib/batch-export"
import { frameBitmap } from "@/lib/frame-image"
import { canvasToBlob, closeBitmap, releaseCanvas } from "@/lib/image-resources"
import { drawWatermarkOnCanvas, type CanvasWatermarkOptions } from "@/lib/watermark-utils"

export const SOCIAL_SIZES = [
  { id: "instagram-post", label: "Instagram post", width: 1080, height: 1350 },
  { id: "square", label: "Square", width: 1080, height: 1080 },
  { id: "story", label: "Story / Reel", width: 1080, height: 1920 },
  { id: "pinterest", label: "Pinterest", width: 1000, height: 1500 },
  { id: "etsy", label: "Etsy listing", width: 2000, height: 1600 },
  { id: "facebook", label: "Facebook", width: 1200, height: 630 },
] as const

function centerCrop(
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not prepare that size.")
  const target = width / height
  const current = sourceW / sourceH
  let sw = sourceW
  let sh = sourceH
  if (current > target) sw = sourceH * target
  else sh = sourceW / target
  const sx = (sourceW - sw) / 2
  const sy = (sourceH - sh) / 2
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, width, height)
  return canvas
}

/** One photo, six center-cropped sizes, zipped. The watermark is drawn on each crop. */
export async function exportSocialZip(file: File, opts: CanvasWatermarkOptions): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const turned = frameBitmap(bitmap, "original", opts.quarterTurns ?? 0, null)
  closeBitmap(bitmap)
  const files: { name: string; bytes: Uint8Array }[] = []
  try {
    for (const size of SOCIAL_SIZES) {
      const framed = centerCrop(turned, turned.width, turned.height, size.width, size.height)
      const canvas = document.createElement("canvas")
      const marks = opts.extraMarks && opts.extraMarks.length > 0 ? opts.extraMarks : [opts]
      for (let i = 0; i < marks.length; i++) {
        await drawWatermarkOnCanvas(canvas, framed, {
          ...marks[i],
          imageWidth: size.width,
          imageHeight: size.height,
          marksOnly: i > 0,
          grayscale: i === 0 ? Boolean(marks[i].grayscale) : false,
          matte: "#ffffff",
        })
      }
      const blob = await canvasToBlob(canvas, "image/jpeg", 0.92)
      if (!blob) throw new Error("Could not save that size.")
      files.push({
        name: `${size.id}-${size.width}x${size.height}.jpg`,
        bytes: new Uint8Array(await blob.arrayBuffer()),
      })
      releaseCanvas(framed)
      releaseCanvas(canvas)
    }
  } finally {
    releaseCanvas(turned)
  }
  return zipFiles(files)
}

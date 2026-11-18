/** Drop a canvas's pixel buffer. Setting either dimension to 0 releases it. */
export function releaseCanvas(canvas: HTMLCanvasElement | null | undefined) {
  if (!canvas) return
  canvas.width = 0
  canvas.height = 0
}

export function closeBitmap(bitmap: ImageBitmap | null | undefined) {
  if (!bitmap) return
  try {
    bitmap.close()
  } catch {
    // Already closed.
  }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

/** A small JPEG of `source`. The temporary canvas is released before this returns. */
export async function scaledPreviewBlob(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  maxEdge: number,
): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(srcW, srcH, 1))
  const w = Math.max(1, Math.round(srcW * scale))
  const h = Math.max(1, Math.round(srcH * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  try {
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Could not create a preview.")
    ctx.drawImage(source, 0, 0, w, h)
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.72)
    if (!blob) throw new Error("Could not create a preview.")
    return blob
  } finally {
    releaseCanvas(canvas)
  }
}

/** Decode `source` only long enough to make a small JPEG, then close the bitmap. */
export async function thumbnailBlob(source: Blob, maxEdge: number): Promise<Blob> {
  const bitmap = await createImageBitmap(source)
  try {
    return await scaledPreviewBlob(bitmap, bitmap.width, bitmap.height, maxEdge)
  } finally {
    closeBitmap(bitmap)
  }
}

let activeThumbs = 0
const thumbWaiters: Array<() => void> = []
const THUMB_LIMIT = 2

/** Keep large decodes from stacking up when a gallery loads many photos. */
export function scheduleThumb<T>(job: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const start = () => {
      activeThumbs += 1
      job().then(resolve, reject).finally(() => {
        activeThumbs -= 1
        const next = thumbWaiters.shift()
        if (next) next()
      })
    }
    if (activeThumbs < THUMB_LIMIT) start()
    else thumbWaiters.push(start)
  })
}

import {
  FILE_TOO_LARGE_MESSAGE,
  OUTPUT_FILE_LIMIT_BYTES,
  UPLOAD_FILE_LIMIT_BYTES,
  dataUrlDecodedBytes,
  replaceFileExtension,
} from "@/lib/save-messages"

export interface StoredOutput {
  blob: Blob
  contentType: string
  filename: string
}

const COMPACT_QUALITIES = [0.92, 0.84, 0.76, 0.68, 0.58, 0.48, 0.4, 0.32] as const

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}

function blobFits(blob: Blob | null, type: string): blob is Blob {
  if (!blob || blob.size <= 0 || blob.size > UPLOAD_FILE_LIMIT_BYTES) return false
  // An empty type still counts. A PNG result means the browser ignored the request.
  if (blob.type && blob.type !== type) return false
  return true
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not prepare the watermarked image for saving."))
    img.src = src
  })
}

/** A high-quality WebP or JPEG of the same picture, small enough for the 15 MB upload cap. */
export async function compactWatermark(
  dataUrl: string,
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  const img = await loadImage(dataUrl)
  const canvas = document.createElement("canvas")
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx || canvas.width < 1 || canvas.height < 1) {
    throw new Error("Could not prepare the watermarked image for saving.")
  }
  ctx.drawImage(img, 0, 0)

  for (const type of ["image/webp", "image/jpeg"] as const) {
    for (const quality of COMPACT_QUALITIES) {
      const blob = await canvasToBlob(canvas, type, quality)
      if (blobFits(blob, type)) {
        return {
          blob,
          contentType: type,
          extension: type === "image/webp" ? "webp" : "jpg",
        }
      }
    }
  }

  throw new Error(FILE_TOO_LARGE_MESSAGE)
}

/**
 * Keep the finished PNG when it fits in the bucket. A PNG past that limit
 * is stored as a smaller copy of the same picture so the save can succeed.
 */
export async function outputForStorage(dataUrl: string, filename: string): Promise<StoredOutput> {
  if (dataUrlDecodedBytes(dataUrl) <= OUTPUT_FILE_LIMIT_BYTES) {
    const fetched = await fetch(dataUrl).then((response) => response.blob())
    if (fetched.size <= OUTPUT_FILE_LIMIT_BYTES) {
      const blob = fetched.type === "image/png" ? fetched : new Blob([fetched], { type: "image/png" })
      return { blob, contentType: "image/png", filename }
    }
  }

  const compact = await compactWatermark(dataUrl)
  return {
    blob: compact.blob,
    contentType: compact.contentType,
    filename: replaceFileExtension(filename, compact.extension),
  }
}

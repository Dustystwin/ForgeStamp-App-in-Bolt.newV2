import { canvasToBlob, closeBitmap, releaseCanvas } from "@/lib/image-resources"
import {
  FILE_TOO_LARGE_MESSAGE,
  OUTPUT_FILE_LIMIT_BYTES,
  UPLOAD_FILE_LIMIT_BYTES,
  replaceFileExtension,
} from "@/lib/save-messages"

export interface StoredOutput {
  blob: Blob
  contentType: string
  filename: string
}

const COMPACT_QUALITIES = [0.92, 0.84, 0.76, 0.68, 0.58, 0.48, 0.4, 0.32] as const

function blobFits(blob: Blob | null, type: string): blob is Blob {
  if (!blob || blob.size <= 0 || blob.size > UPLOAD_FILE_LIMIT_BYTES) return false
  // An empty type still counts. A PNG result means the browser ignored the request.
  if (blob.type && blob.type !== type) return false
  return true
}

/** A high-quality WebP or JPEG of the same picture, small enough for the 15 MB upload cap. */
export async function compactWatermark(
  source: Blob,
): Promise<{ blob: Blob; contentType: string; extension: string }> {
  const bitmap = await createImageBitmap(source)
  const canvas = document.createElement("canvas")
  try {
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const ctx = canvas.getContext("2d")
    if (!ctx || canvas.width < 1 || canvas.height < 1) {
      throw new Error("Could not prepare the watermarked image for saving.")
    }
    ctx.drawImage(bitmap, 0, 0)
    closeBitmap(bitmap)

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
  } finally {
    closeBitmap(bitmap)
    releaseCanvas(canvas)
  }
}

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg"
  if (mime === "image/webp") return "webp"
  return "png"
}

function asStoredImageType(type: string): "image/png" | "image/jpeg" | "image/webp" | null {
  if (type === "image/png" || type === "image/jpeg" || type === "image/webp") return type
  return null
}

/**
 * Keep the finished file when it fits in the bucket. PNG, JPG, and WebP are
 * all allowed up to 50 MB. A file past that limit is stored as a smaller
 * copy of the same picture so the save can succeed.
 */
export async function outputForStorage(source: Blob, filename: string): Promise<StoredOutput> {
  const hinted = asStoredImageType(source.type)
  if (hinted && source.size > 0 && source.size <= OUTPUT_FILE_LIMIT_BYTES) {
    return {
      blob: source,
      contentType: hinted,
      filename: replaceFileExtension(filename, extensionForMime(hinted)),
    }
  }

  const compact = await compactWatermark(source)
  return {
    blob: compact.blob,
    contentType: compact.contentType,
    filename: replaceFileExtension(filename, compact.extension),
  }
}

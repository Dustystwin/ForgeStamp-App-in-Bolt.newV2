/** Photos a person uploads. Matches the editor and the database trigger. */
export const UPLOAD_FILE_LIMIT_BYTES = 15 * 1024 * 1024

export const FILE_TOO_LARGE_MESSAGE = "This file is too large. The limit is 15 MB."

/**
 * Largest finished PNG the bucket accepts after migration
 * 20261113031848_allow_larger_watermarked_saves. The Free Supabase plan
 * cannot store a single file bigger than this.
 */
export const OUTPUT_FILE_LIMIT_BYTES = 50 * 1024 * 1024

export function dataUrlDecodedBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",")
  const base64 = (comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl).replace(/\s/g, "")
  if (!base64) return 0
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding)
}

export function replaceFileExtension(filename: string, extension: string): string {
  const cleanExt = extension.replace(/^\.+/, "") || "png"
  const base = filename.replace(/\.[^.]+$/, "")
  return `${base || "image"}.${cleanExt}`
}

export function isFileTooLargeMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return (
    message.includes("15 MB") ||
    message.includes("50 MB") ||
    lower.includes("maximum allowed size") ||
    lower.includes("payload too large") ||
    lower.includes("entity too large") ||
    lower.includes("too large")
  )
}

/** The server still has the old 15 MB bucket, or the PNG is over the finished-image cap. */
export function shouldRetryOutputCompact(contentType: string, byteSize: number, errorMessage: string): boolean {
  return (
    contentType === "image/png" &&
    byteSize > UPLOAD_FILE_LIMIT_BYTES &&
    isFileTooLargeMessage(errorMessage)
  )
}

export interface SaveFailure {
  filename: string
  message: string
}

export function saveResultMessages(
  savedCount: number,
  total: number,
  failures: SaveFailure[],
): { success?: string; error?: string } {
  let success: string | undefined
  if (savedCount > 0) {
    if (savedCount === total && total === 1) {
      success = "Saved to My Images. Expires in 30 days."
    } else if (savedCount === total) {
      success = `Saved ${savedCount} images to My Images. Each expires in 30 days.`
    } else {
      success = `Saved ${savedCount} of ${total} images to My Images. Each expires in 30 days.`
    }
  }

  if (failures.length === 0) return { success }

  const shown = failures.slice(0, 3)
  const extra = failures.length > shown.length ? ` And ${failures.length - shown.length} more.` : ""
  const error =
    failures.length === 1
      ? `Could not save ${failures[0].filename}. ${failures[0].message}`
      : `Could not save ${failures.length} images to My Images. ${shown
          .map((failure) => `${failure.filename}: ${failure.message}`)
          .join(" ")}${extra}`

  return { success, error }
}

export function accountCreatedMessage(signedIn: boolean): string {
  if (signedIn) return "Account created! You are now signed in."
  return "Account created. Check your email to confirm your account, then sign in."
}

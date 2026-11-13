import { supabase } from "@/lib/supabase"
import { FILE_TOO_LARGE_MESSAGE, isFileTooLargeMessage } from "@/lib/save-messages"

export { FILE_TOO_LARGE_MESSAGE } from "@/lib/save-messages"

/** 500 MB for every account until paid plans exist. Matches the database trigger. */
export const USER_STORAGE_LIMIT_BYTES = 500 * 1024 * 1024

export const STORAGE_LIMIT_MESSAGE =
  "This account can store up to 500 MB. Delete some saved images to make room."

export function safeStorageFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "image"
  const cleaned = base.replace(/^\.+/, "").replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80)
  return cleaned || "image"
}

export function storageObjectPath(
  userId: string,
  folder: "originals" | "outputs",
  id: string,
  fileName: string,
): string {
  return `${userId}/${folder}/${id}_${safeStorageFileName(fileName)}`
}

export function calmStorageError(message: string): string {
  const lower = message.toLowerCase()
  if (message.includes("500 MB") || lower.includes("storage limit")) return STORAGE_LIMIT_MESSAGE
  if (lower.includes("could not read the file size")) {
    return "That upload did not finish. Please try again."
  }
  if (lower.includes("finished image")) {
    return "This watermarked image is too large to save."
  }
  if (isFileTooLargeMessage(message)) return FILE_TOO_LARGE_MESSAGE
  return message
}

/** Browser hint only. The database rejects an upload that would pass this and still exceed 500 MB. */
export async function savedImagesExceedLimit(incomingBytes: number): Promise<boolean> {
  const { data, error } = await supabase.from("images").select("total_size")
  if (error) return false
  const used = (data ?? []).reduce((sum, row) => sum + (Number(row.total_size) || 0), 0)
  return used + incomingBytes > USER_STORAGE_LIMIT_BYTES
}

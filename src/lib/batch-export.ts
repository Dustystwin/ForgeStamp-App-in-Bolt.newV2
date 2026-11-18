import { zipSync } from "fflate"

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function zipFiles(files: { name: string; bytes: Uint8Array }[]): Blob {
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) entries[file.name] = file.bytes
  const zipped = zipSync(entries, { level: 0 })
  return new Blob([zipped], { type: "application/zip" })
}

export function downloadUrl(href: string, filename: string) {
  const link = document.createElement("a")
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  downloadUrl(url, filename)
  // Give the browser time to start the download, then drop the object URL.
  // A big ZIP needs longer than a single photo.
  const wait = Math.min(120_000, 2_000 + Math.ceil(blob.size / (2 * 1024 * 1024)) * 1000)
  window.setTimeout(() => URL.revokeObjectURL(url), wait)
}

export function stampedFileName(
  file: File,
  index: number,
  total: number,
  stamp: string,
  extension = "png"
): string {
  const ext = extension.replace(/^\.+/, "") || "png"
  if (total === 1) return `forgestamp-export-${stamp}.${ext}`
  const raw = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "")
  const stem = (raw || "photo").slice(0, 40)
  return `${String(index + 1).padStart(2, "0")}-${stem}.${ext}`
}

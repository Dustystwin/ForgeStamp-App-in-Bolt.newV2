import { zipSync } from "fflate"

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function zipPngs(files: { name: string; bytes: Uint8Array }[]): Blob {
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
  URL.revokeObjectURL(url)
}

export function stampedFileName(file: File, index: number, total: number, stamp: string): string {
  if (total === 1) return `forgestamp-export-${stamp}.png`
  const raw = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-+|-+$/g, "")
  const stem = (raw || "photo").slice(0, 40)
  return `${String(index + 1).padStart(2, "0")}-${stem}.png`
}

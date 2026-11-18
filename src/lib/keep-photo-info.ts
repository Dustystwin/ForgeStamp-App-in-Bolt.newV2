/**
 * Canvas exports are a new picture, so camera info is gone unless we copy it back.
 * JPG can keep the original EXIF block. PNG and WebP downloads stay without it.
 */
export async function copyJpegExif(original: Blob, exported: Blob): Promise<Blob> {
  if (exported.type !== "image/jpeg") return exported
  const source = new Uint8Array(await original.arrayBuffer())
  const exif = jpegExifSegment(source)
  if (!exif) return exported
  const out = new Uint8Array(await exported.arrayBuffer())
  if (out.length < 2 || out[0] !== 0xff || out[1] !== 0xd8) return exported
  const merged = new Uint8Array(2 + exif.length + (out.length - 2))
  merged.set(out.subarray(0, 2), 0)
  merged.set(exif, 2)
  merged.set(out.subarray(2), 2 + exif.length)
  return new Blob([merged], { type: "image/jpeg" })
}

function jpegExifSegment(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let i = 2
  while (i + 4 < bytes.length) {
    if (bytes[i] !== 0xff) return null
    const marker = bytes[i + 1]
    if (marker === 0xda || marker === 0xd9) return null
    const size = (bytes[i + 2] << 8) | bytes[i + 3]
    if (size < 2 || i + 2 + size > bytes.length) return null
    if (marker === 0xe1) {
      const header = bytes.subarray(i + 4, i + 10)
      const label = String.fromCharCode(...header)
      if (label.startsWith("Exif")) return bytes.slice(i, i + 2 + size)
    }
    i += 2 + size
  }
  return null
}

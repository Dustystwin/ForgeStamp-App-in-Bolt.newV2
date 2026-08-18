// Scans uploaded images for signs of pre-existing watermarks:
//  1. Ownership metadata embedded in the file (EXIF, XMP, PNG text chunks)
//  2. Repeated/tiled overlay watermarks in the pixels (periodicity analysis)
//  3. Possible hidden LSB steganography (statistical test)
//
// Honest scope: this catches embedded ownership metadata, tiled overlay marks,
// and simple LSB embedding. Truly invisible forensic watermarks (e.g. Digimarc)
// cannot be reliably detected by any client-side tool — the UI copy reflects that.

export interface ScanFinding {
  type: "metadata" | "pattern" | "steganography" | "ai"
  label: string
  detail: string
  severity: "info" | "warning"
}

export interface HighlightRect {
  // Fractions of image width/height (0..1) so they scale to any display size.
  x: number
  y: number
  w: number
  h: number
}

export interface ScanReport {
  verdict: "found" | "possible" | "none"
  findings: ScanFinding[]
  highlights: HighlightRect[]
  /** True when markers indicate the image was AI-generated. */
  aiDetected: boolean
}

// ---------------------------------------------------------------------------
// 1) METADATA SCAN — parses the raw file bytes.
// ---------------------------------------------------------------------------

const OWNERSHIP_EXIF_TAGS: Record<number, string> = {
  0x8298: "Copyright",
  0x013b: "Artist",
  0x010e: "Image description",
  0x0131: "Software",
}

function readAscii(view: DataView, offset: number, length: number): string {
  let out = ""
  for (let i = 0; i < length; i++) {
    const c = view.getUint8(offset + i)
    if (c === 0) break
    out += String.fromCharCode(c)
  }
  return out.trim()
}

// Parses EXIF ownership tags from a TIFF header found inside a JPEG APP1 segment.
function parseExifTiff(view: DataView, tiffStart: number, findings: ScanFinding[]) {
  if (tiffStart + 8 > view.byteLength) return
  const byteOrder = view.getUint16(tiffStart)
  const little = byteOrder === 0x4949
  if (!little && byteOrder !== 0x4d4d) return
  const get16 = (o: number) => view.getUint16(o, little)
  const get32 = (o: number) => view.getUint32(o, little)
  if (get16(tiffStart + 2) !== 42) return
  const ifdOffset = get32(tiffStart + 4)
  const ifdStart = tiffStart + ifdOffset
  if (ifdStart + 2 > view.byteLength) return
  const count = get16(ifdStart)
  for (let i = 0; i < count; i++) {
    const entry = ifdStart + 2 + i * 12
    if (entry + 12 > view.byteLength) break
    const tag = get16(entry)
    const label = OWNERSHIP_EXIF_TAGS[tag]
    if (!label) continue
    const type = get16(entry + 2)
    const num = get32(entry + 4)
    if (type !== 2 || num === 0 || num > 4096) continue // ASCII strings only
    const valueOffset = num <= 4 ? entry + 8 : tiffStart + get32(entry + 8)
    if (valueOffset + num > view.byteLength) continue
    const text = readAscii(view, valueOffset, num)
    if (!text) continue
    // Software alone is common and benign — report it as info, ownership as warning.
    const isOwnership = tag === 0x8298 || tag === 0x013b
    findings.push({
      type: "metadata",
      label: `EXIF ${label}`,
      detail: text,
      severity: isOwnership ? "warning" : "info",
    })
  }
}

// Searches the raw bytes for an XMP packet and pulls ownership-related fields.
function scanXmp(bytes: Uint8Array, findings: ScanFinding[]) {
  const text = latin1Slice(bytes)
  const start = text.indexOf("<x:xmpmeta")
  if (start === -1) return
  const end = text.indexOf("</x:xmpmeta>", start)
  const xmp = text.slice(start, end === -1 ? Math.min(start + 65536, text.length) : end)
  const fields: [RegExp, string][] = [
    [/dc:rights\s*=\s*"([^"]{1,300})"/i, "Rights"],
    [/<dc:rights>[\s\S]{0,200}?<rdf:li[^>]*>([^<]{1,300})</i, "Rights"],
    [/dc:creator\s*=\s*"([^"]{1,300})"/i, "Creator"],
    [/<dc:creator>[\s\S]{0,200}?<rdf:li[^>]*>([^<]{1,300})</i, "Creator"],
    [/photoshop:Credit\s*=\s*"([^"]{1,300})"/i, "Credit"],
    [/xmpRights:WebStatement\s*=\s*"([^"]{1,300})"/i, "Rights statement"],
  ]
  const seen = new Set<string>()
  for (const [re, label] of fields) {
    const m = xmp.match(re)
    if (m && m[1].trim() && !seen.has(label + m[1])) {
      seen.add(label + m[1])
      findings.push({
        type: "metadata",
        label: `XMP ${label}`,
        detail: m[1].trim(),
        severity: "warning",
      })
    }
  }
}

function latin1Slice(bytes: Uint8Array): string {
  let out = ""
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, Math.min(i + CHUNK, bytes.length)))
  }
  return out
}

const OWNERSHIP_PNG_KEYS = ["copyright", "author", "artist", "rights", "credit", "source"]

// Walks PNG chunks looking for tEXt/iTXt ownership entries.
function scanPngChunks(view: DataView, bytes: Uint8Array, findings: ScanFinding[]) {
  let offset = 8 // skip PNG signature
  while (offset + 8 <= view.byteLength) {
    const length = view.getUint32(offset)
    const chunkType = latin1Slice(bytes.subarray(offset + 4, offset + 8))
    const dataStart = offset + 8
    if (dataStart + length > view.byteLength) break
    if (chunkType === "tEXt" || chunkType === "iTXt") {
      const data = bytes.subarray(dataStart, dataStart + Math.min(length, 8192))
      const raw = latin1Slice(data)
      const nul = raw.indexOf("\u0000")
      if (nul > 0) {
        const key = raw.slice(0, nul)
        let value = raw.slice(nul + 1)
        if (chunkType === "iTXt") {
          // iTXt: comp flag, comp method, language, translated keyword — skip to text
          const parts = value.split("\u0000")
          value = parts.length >= 3 ? parts.slice(2).join(" ") : value
        }
        value = value.replace(/[\u0000-\u001f]+/g, " ").trim()
        if (key.toLowerCase() === "xml:com.adobe.xmp") {
          scanXmp(data, findings)
        } else if (OWNERSHIP_PNG_KEYS.includes(key.toLowerCase()) && value) {
          findings.push({
            type: "metadata",
            label: `PNG ${key}`,
            detail: value.slice(0, 300),
            severity: "warning",
          })
        }
      }
    }
    offset = dataStart + length + 4 // skip CRC
    if (chunkType === "IEND") break
  }
}

// Entry point for metadata scanning. Works on the raw uploaded file bytes.
export function scanMetadata(buffer: ArrayBuffer): ScanFinding[] {
  const findings: ScanFinding[] = []
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 12) return findings

  // JPEG
  if (view.getUint16(0) === 0xffd8) {
    let offset = 2
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break
      const marker = view.getUint8(offset + 1)
      if (marker === 0xda || marker === 0xd9) break // start of scan / end
      const size = view.getUint16(offset + 2)
      if (marker === 0xe1 && size > 8) {
        const sig = latin1Slice(bytes.subarray(offset + 4, offset + 4 + 6))
        if (sig.startsWith("Exif")) {
          parseExifTiff(view, offset + 4 + 6, findings)
        }
      }
      offset += 2 + size
    }
    scanXmp(bytes, findings)
  }
  // PNG
  else if (view.getUint32(0) === 0x89504e47) {
    scanPngChunks(view, bytes, findings)
  }
  // WebP (RIFF)
  else if (latin1Slice(bytes.subarray(0, 4)) === "RIFF" && latin1Slice(bytes.subarray(8, 12)) === "WEBP") {
    let offset = 12
    while (offset + 8 <= view.byteLength) {
      const fourcc = latin1Slice(bytes.subarray(offset, offset + 4))
      const size = view.getUint32(offset + 4, true)
      if (fourcc === "EXIF") parseExifTiff(view, offset + 8, findings)
      offset += 8 + size + (size % 2)
    }
    scanXmp(bytes, findings)
  }

  return findings
}

// ---------------------------------------------------------------------------
// 2) PIXEL SCAN
// Periodicity: tiled overlay watermarks repeat at a fixed offset. We whiten the
// image (high-pass + local contrast normalization) to suppress photo content,
// then compute the full autocorrelation surface via FFT and look for an isolated,
// prominent peak away from the origin. Verified against clean photos (max ~8%)
// vs. realistic tiled watermarks (~36%) — threshold sits safely between.
// LSB: random-bit steganography flattens least-significant-bit statistics.
// ---------------------------------------------------------------------------

export interface PeriodicityResult {
  found: boolean
  score: number
  dx: number
  dy: number
  highlights: HighlightRect[]
}

// In-place iterative radix-2 complex FFT.
function fft(re: Float64Array, im: Float64Array, inverse: boolean) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cwr = 1
      let cwi = 0
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k]
        const ui = im[i + k]
        const vr = re[i + k + len / 2] * cwr - im[i + k + len / 2] * cwi
        const vi = re[i + k + len / 2] * cwi + im[i + k + len / 2] * cwr
        re[i + k] = ur + vr
        im[i + k] = ui + vi
        re[i + k + len / 2] = ur - vr
        im[i + k + len / 2] = ui - vi
        const t = cwr * wr - cwi * wi
        cwi = cwr * wi + cwi * wr
        cwr = t
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < n; i++) {
      re[i] /= n
      im[i] /= n
    }
  }
}

function fft2(re: Float64Array, im: Float64Array, N: number, inverse: boolean) {
  const tr = new Float64Array(N)
  const ti = new Float64Array(N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      tr[x] = re[y * N + x]
      ti[x] = im[y * N + x]
    }
    fft(tr, ti, inverse)
    for (let x = 0; x < N; x++) {
      re[y * N + x] = tr[x]
      im[y * N + x] = ti[x]
    }
  }
  for (let x = 0; x < N; x++) {
    for (let y = 0; y < N; y++) {
      tr[y] = re[y * N + x]
      ti[y] = im[y * N + x]
    }
    fft(tr, ti, inverse)
    for (let y = 0; y < N; y++) {
      re[y * N + x] = tr[y]
      im[y * N + x] = ti[y]
    }
  }
}

function toGray(rgba: Uint8ClampedArray, w: number, h: number): Float32Array {
  const g = new Float32Array(w * h)
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]
  }
  return g
}

// High-pass via box-blur subtraction (integral image for speed).
function boxHighPass(g: Float32Array, w: number, h: number, R: number): Float32Array {
  const out = new Float32Array(w * h)
  const integral = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let rowSum = 0
    for (let x = 0; x < w; x++) {
      rowSum += g[y * w + x]
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + rowSum
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w - 1, x + R)
      const y0 = Math.max(0, y - R), y1 = Math.min(h - 1, y + R)
      const area = (x1 - x0 + 1) * (y1 - y0 + 1)
      const sum =
        integral[(y1 + 1) * (w + 1) + x1 + 1] -
        integral[y0 * (w + 1) + x1 + 1] -
        integral[(y1 + 1) * (w + 1) + x0] +
        integral[y0 * (w + 1) + x0]
      out[y * w + x] = g[y * w + x] - sum / area
    }
  }
  return out
}

// Local contrast normalization: divide by local RMS so faint uniform texture
// (a watermark) competes equally with strong photo edges.
function whiten(hp: Float32Array, w: number, h: number, R: number): Float32Array {
  const sq = new Float64Array((w + 1) * (h + 1))
  for (let y = 0; y < h; y++) {
    let rowSum = 0
    for (let x = 0; x < w; x++) {
      const v = hp[y * w + x]
      rowSum += v * v
      sq[(y + 1) * (w + 1) + x + 1] = sq[y * (w + 1) + x + 1] + rowSum
    }
  }
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - R), x1 = Math.min(w - 1, x + R)
      const y0 = Math.max(0, y - R), y1 = Math.min(h - 1, y + R)
      const area = (x1 - x0 + 1) * (y1 - y0 + 1)
      const s =
        sq[(y1 + 1) * (w + 1) + x1 + 1] -
        sq[y0 * (w + 1) + x1 + 1] -
        sq[(y1 + 1) * (w + 1) + x0] +
        sq[y0 * (w + 1) + x0]
      const rms = Math.sqrt(s / area) + 1e-3
      out[y * w + x] = hp[y * w + x] / rms
    }
  }
  return out
}

const PEAK_THRESHOLD = 0.14
const PROMINENCE_THRESHOLD = 0.12

// Detects repeating/tiled overlays. Expects RGBA already downscaled to <=256 max dim.
export function analyzePeriodicity(rgba: Uint8ClampedArray, w: number, h: number): PeriodicityResult {
  const none: PeriodicityResult = { found: false, score: 0, dx: 0, dy: 0, highlights: [] }
  if (w < 48 || h < 48) return none

  const hp = boxHighPass(toGray(rgba, w, h), w, h, 3)
  const wh = whiten(hp, w, h, 8)

  // Zero-padded FFT autocorrelation (Wiener–Khinchin)
  let N = 1
  while (N < 2 * Math.max(w, h)) N <<= 1
  const re = new Float64Array(N * N)
  const im = new Float64Array(N * N)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) re[y * N + x] = wh[y * w + x]
  }
  fft2(re, im, N, false)
  for (let i = 0; i < N * N; i++) {
    re[i] = re[i] * re[i] + im[i] * im[i]
    im[i] = 0
  }
  fft2(re, im, N, true)
  const A0 = re[0]
  if (A0 <= 1e-6) return none

  const corrAt = (dx: number, dy: number): number => {
    const overlap = ((w - Math.abs(dx)) * (h - Math.abs(dy))) / (w * h)
    if (overlap <= 0.15) return 0
    const ix = ((dx % N) + N) % N
    const iy = ((dy % N) + N) % N
    return re[iy * N + ix] / (A0 * overlap)
  }

  // Find the strongest peak away from the origin
  const minR2 = 14 * 14
  const maxDx = Math.floor(w / 2)
  const maxDy = Math.floor(h / 2)
  let best = { score: 0, dx: 0, dy: 0 }
  for (let dy = 0; dy <= maxDy; dy++) {
    for (let dx = -maxDx; dx <= maxDx; dx++) {
      if (dx * dx + dy * dy < minR2) continue
      if (dy === 0 && dx < 0) continue
      const s = corrAt(dx, dy)
      if (s > best.score) best = { score: s, dx, dy }
    }
  }

  // Prominence: peak must stand out above its surrounding ring, which rejects
  // the broad self-similarity ridges natural photo structures produce.
  const ring: number[] = []
  for (let ry = -9; ry <= 9; ry++) {
    for (let rx = -9; rx <= 9; rx++) {
      const r2 = rx * rx + ry * ry
      if (r2 < 25 || r2 > 81) continue
      ring.push(corrAt(best.dx + rx, best.dy + ry))
    }
  }
  ring.sort((a, b) => a - b)
  const prominence = best.score - ring[Math.floor(ring.length / 2)]
  const found = best.score >= PEAK_THRESHOLD && prominence >= PROMINENCE_THRESHOLD
  if (!found) return { ...none, score: best.score, dx: best.dx, dy: best.dy }

  // Highlight tiles that strongly match themselves at the detected offset
  const highlights: HighlightRect[] = []
  const T = 24
  for (let ty = 0; ty + T <= h; ty += T) {
    for (let tx = 0; tx + T <= w; tx += T) {
      const sx = tx + best.dx
      const sy = ty + best.dy
      if (sx < 0 || sy < 0 || sx + T > w || sy + T > h) continue
      let ab = 0, a2 = 0, b2 = 0
      for (let y = 0; y < T; y++) {
        for (let x = 0; x < T; x++) {
          const a = wh[(ty + y) * w + tx + x]
          const b = wh[(sy + y) * w + sx + x]
          ab += a * b
          a2 += a * a
          b2 += b * b
        }
      }
      const denom = Math.sqrt(a2 * b2)
      const c = denom > 1e-6 ? ab / denom : 0
      if (c >= Math.max(0.25, best.score * 0.8)) {
        highlights.push({ x: tx / w, y: ty / h, w: T / w, h: T / h })
        // also mark the matching partner tile
        highlights.push({ x: sx / w, y: sy / h, w: T / w, h: T / h })
      }
    }
  }
  return { found: true, score: best.score, dx: best.dx, dy: best.dy, highlights }
}

// LSB steganography check — MUST run on native-resolution pixels (any resampling
// destroys least-significant bits). Random-bit embedding pins every block's LSB
// mean tightly to 0.5; natural images wander.
export function analyzeLsb(rgba: Uint8ClampedArray, w: number, h: number): boolean {
  const blocks = 8
  const bw = Math.floor(w / blocks)
  const bh = Math.floor(h / blocks)
  if (bw <= 4 || bh <= 4) return false
  let deviationSum = 0
  let blockCount = 0
  for (let by = 0; by < blocks; by++) {
    for (let bx = 0; bx < blocks; bx++) {
      let ones = 0
      let total = 0
      for (let y = by * bh; y < (by + 1) * bh; y++) {
        for (let x = bx * bw; x < (bx + 1) * bw; x++) {
          const p = (y * w + x) * 4
          ones += (rgba[p] & 1) + (rgba[p + 1] & 1) + (rgba[p + 2] & 1)
          total += 3
        }
      }
      deviationSum += Math.abs(ones / total - 0.5)
      blockCount++
    }
  }
  return deviationSum / blockCount < 0.012
}

// ---------------------------------------------------------------------------
// AI-GENERATED CONTENT DETECTION
// AI image generators leave identifiable markers in files: Stable Diffusion
// writes a "parameters" text chunk, ComfyUI writes "prompt"/"workflow" chunks,
// Midjourney/others fill the EXIF Software field, standards-compliant tools
// (DALL-E, Firefly, Photoshop AI) attach C2PA "Content Credentials" and/or the
// IPTC "trainedAlgorithmicMedia" source label. We search ONLY metadata regions
// (never compressed pixel data) so common words can't false-positive.
// Honest limit: an AI image with all metadata stripped cannot be identified.
// ---------------------------------------------------------------------------

const AI_GENERATOR_NAMES = [
  "midjourney", "dall-e", "dall\u00b7e", "dalle", "stable diffusion",
  "stable-diffusion", "sdxl", "sd_xl", "novelai", "comfyui", "invokeai",
  "automatic1111", "adobe firefly", "firefly", "leonardo.ai", "ideogram",
  "runwayml", "openai", "niji", "dreamstudio", "fooocus",
]

const AI_CHUNK_KEYS = ["parameters", "prompt", "workflow", "dream", "sd-metadata", "generation_data"]

function aiNameIn(text: string): string | null {
  const lower = text.toLowerCase()
  for (const name of AI_GENERATOR_NAMES) {
    if (lower.includes(name)) return name
  }
  return null
}

function pushAiFinding(findings: ScanFinding[], label: string, detail: string) {
  if (findings.some((f) => f.type === "ai" && f.label === label)) return
  findings.push({ type: "ai", label, detail: detail.slice(0, 300), severity: "warning" })
}

// Scans metadata regions of the file for AI-generation markers.
export function scanAiMarkers(buffer: ArrayBuffer): ScanFinding[] {
  const findings: ScanFinding[] = []
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 12) return findings

  const metaTexts: string[] = []

  // JPEG: collect APPn segment contents (metadata lives only there)
  if (view.getUint16(0) === 0xffd8) {
    let offset = 2
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break
      const marker = view.getUint8(offset + 1)
      if (marker === 0xda || marker === 0xd9) break
      const size = view.getUint16(offset + 2)
      if (marker >= 0xe0 && marker <= 0xef) {
        metaTexts.push(latin1Slice(bytes.subarray(offset + 4, offset + 2 + size)))
      }
      offset += 2 + size
    }
  }
  // PNG: collect text chunk keys/values
  else if (view.getUint32(0) === 0x89504e47) {
    let offset = 8
    while (offset + 8 <= view.byteLength) {
      const length = view.getUint32(offset)
      const chunkType = latin1Slice(bytes.subarray(offset + 4, offset + 8))
      const dataStart = offset + 8
      if (dataStart + length > view.byteLength) break
      if (chunkType === "tEXt" || chunkType === "iTXt" || chunkType === "zTXt") {
        const raw = latin1Slice(bytes.subarray(dataStart, dataStart + Math.min(length, 16384)))
        const nul = raw.indexOf("\u0000")
        const key = nul > 0 ? raw.slice(0, nul).toLowerCase() : ""
        if (AI_CHUNK_KEYS.includes(key)) {
          pushAiFinding(
            findings,
            "AI generation data embedded",
            key === "parameters"
              ? "This file carries Stable Diffusion generation settings (prompt, sampler, seed) — it was produced by an AI image generator."
              : `This file carries an AI tool's "${key}" data block, written by image-generation software such as ComfyUI.`
          )
        }
        metaTexts.push(raw)
      }
      offset = dataStart + length + 4
      if (chunkType === "IEND") break
    }
  }
  // WebP: EXIF/XMP chunks
  else if (latin1Slice(bytes.subarray(0, 4)) === "RIFF" && latin1Slice(bytes.subarray(8, 12)) === "WEBP") {
    let offset = 12
    while (offset + 8 <= view.byteLength) {
      const fourcc = latin1Slice(bytes.subarray(offset, offset + 4))
      const size = view.getUint32(offset + 4, true)
      if (fourcc === "EXIF" || fourcc === "XMP ") {
        metaTexts.push(latin1Slice(bytes.subarray(offset + 8, offset + 8 + Math.min(size, 65536))))
      }
      offset += 8 + size + (size % 2)
    }
  }

  const combined = metaTexts.join("\n")
  const lower = combined.toLowerCase()

  // IPTC standard AI-source label
  if (lower.includes("trainedalgorithmicmedia")) {
    pushAiFinding(
      findings,
      "Labeled as AI-generated",
      "The file carries the industry-standard IPTC label identifying it as created by generative AI (trainedAlgorithmicMedia)."
    )
  }
  // C2PA / Content Credentials
  if (lower.includes("c2pa") || lower.includes("jumb") || lower.includes("contentauth") || lower.includes("adobe:cai")) {
    pushAiFinding(
      findings,
      "Content Credentials (C2PA) found",
      "This file carries Content Credentials provenance data, commonly attached by AI generators and AI-editing tools such as DALL-E, Adobe Firefly, and Photoshop."
    )
  }
  // Known generator names in metadata
  const hit = aiNameIn(combined)
  if (hit) {
    pushAiFinding(
      findings,
      "AI generator identified",
      `The file's metadata references "${hit}" — a known AI image-generation tool.`
    )
  }

  return findings
}

// ---------------------------------------------------------------------------
// 3) BROWSER ORCHESTRATOR — reads the file, runs all three scans.
// ---------------------------------------------------------------------------

const PERIODICITY_MAX_DIM = 256
const LSB_MAX_DIM = 1600 // LSB stats need unresampled pixels; large images use a 1:1 central crop

export async function scanImageForWatermarks(file: File): Promise<ScanReport> {
  const findings: ScanFinding[] = []
  let highlights: HighlightRect[] = []

  // Metadata pass on the raw bytes
  try {
    const buffer = await file.arrayBuffer()
    findings.push(...scanMetadata(buffer))
    findings.push(...scanAiMarkers(buffer))
  } catch {
    // unreadable buffer — skip metadata pass
  }

  let periodic: PeriodicityResult | null = null
  let lsbSuspicious = false
  try {
    const bitmap = await createImageBitmap(file)

    // Pass A: downscaled copy for periodicity detection
    const scale = Math.min(1, PERIODICITY_MAX_DIM / Math.max(bitmap.width, bitmap.height))
    const w = Math.max(16, Math.round(bitmap.width * scale))
    const h = Math.max(16, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (ctx) {
      ctx.drawImage(bitmap, 0, 0, w, h)
      periodic = analyzePeriodicity(ctx.getImageData(0, 0, w, h).data, w, h)
    }

    // Pass B: native-resolution pixels (1:1, no resampling) for the LSB check.
    // PNG/WebP only — JPEG compression already destroys LSB-plane data.
    if (file.type !== "image/jpeg") {
      const cw = Math.min(bitmap.width, LSB_MAX_DIM)
      const ch = Math.min(bitmap.height, LSB_MAX_DIM)
      const canvas2 = document.createElement("canvas")
      canvas2.width = cw
      canvas2.height = ch
      const ctx2 = canvas2.getContext("2d", { willReadFrequently: true })
      if (ctx2) {
        const sx = Math.floor((bitmap.width - cw) / 2)
        const sy = Math.floor((bitmap.height - ch) / 2)
        ctx2.drawImage(bitmap, sx, sy, cw, ch, 0, 0, cw, ch)
        lsbSuspicious = analyzeLsb(ctx2.getImageData(0, 0, cw, ch).data, cw, ch)
      }
    }

    bitmap.close()
  } catch {
    // pixel scan unavailable — metadata findings still stand
  }

  if (periodic?.found) {
    findings.push({
      type: "pattern",
      label: "Repeated overlay pattern",
      detail: `A tiling pattern repeats across the image (signal strength ${(periodic.score * 100).toFixed(0)}%), which is typical of stock-photo or protective overlay watermarks. Matching regions are highlighted on the thumbnail.`,
      severity: "warning",
    })
    highlights = periodic.highlights
  }
  if (lsbSuspicious) {
    findings.push({
      type: "steganography",
      label: "Possible hidden data",
      detail: "The image's least-significant pixel bits are statistically uniform, which can indicate invisibly embedded data. This is a heuristic signal, not proof.",
      severity: "warning",
    })
  }

  const aiDetected = findings.some((f) => f.type === "ai")
  const warnings = findings.filter((f) => f.severity === "warning" && f.type !== "ai")
  const verdict: ScanReport["verdict"] =
    warnings.length === 0
      ? "none"
      : warnings.some((f) => f.type === "metadata" || f.type === "pattern")
        ? "found"
        : "possible"

  return { verdict, findings, highlights, aiDetected }
}

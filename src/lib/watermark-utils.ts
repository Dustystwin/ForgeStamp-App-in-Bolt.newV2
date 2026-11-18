import {
  DEFAULT_EDITOR_STATE,
  type CoverageMode,
  type CurveOrientation,
  type Pattern,
  type Placement,
  type TextDirection,
  type WatermarkMode,
} from "@/lib/editor-types"
import { renderQrDataUrl } from "@/lib/qr-watermark"
import { canvasToBlob, closeBitmap, releaseCanvas, scaledPreviewBlob } from "@/lib/image-resources"
import { frameBitmap, needsFrame } from "@/lib/frame-image"
import type { CropAspect, DateStampFormat } from "@/lib/editor-types"
import { composeWatermarkText, paintFill, scaledTextPaint, textPaintPadding, type TextPaint } from "@/lib/text-style"
import {
  getPatternPoints,
  measureTextStamp,
  placedStampCenter,
  scaledStampFont,
  type GridPoint,
} from "@/lib/pattern-layout"

export {
  getPatternPoints,
  measureTextStamp,
  placedStampCenter,
  scaledStampFont,
  type GridPoint,
} from "@/lib/pattern-layout"

// Pattern angles live on each placed point. Callers still add this to the
// user's rotation, so it stays 0 and the stamp is not tilted a second time.
export function getPatternTextAngle(pattern: Pattern): number {
  return pattern ? 0 : 0
}

// Returns the CSS position style for a placement in a container with given padding
export function getPlacementStyle(
  placement: Placement,
  padPct = 8
): React.CSSProperties {
  const p = `${padPct}%`
  switch (placement) {
    case "top-left":      return { top: p, left: p }
    case "top-center":    return { top: p, left: "50%", transform: "translateX(-50%)" }
    case "top-right":     return { top: p, right: p }
    case "middle-left":   return { top: "50%", left: p, transform: "translateY(-50%)" }
    case "center":        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    case "middle-right":  return { top: "50%", right: p, transform: "translateY(-50%)" }
    case "bottom-left":   return { bottom: p, left: p }
    case "bottom-center": return { bottom: p, left: "50%", transform: "translateX(-50%)" }
    case "bottom-right":  return { bottom: p, right: p }
  }
}

// Returns the rotation (in degrees) that converts horizontal text to the chosen direction
// Both vertical directions render as STACKED upright letters (like a vertical
// decorative sign you can read without tilting your head), so neither adds a
// rotation offset. They differ only in stacking order:
//   vertical-down: first letter on top, reading downward (F,O,R,G,E...)
//   vertical-up:   first letter on bottom, reading upward   (...E,G,R,O,F)
export function isStackedDirection(dir: TextDirection): boolean {
  return dir === "vertical-down" || dir === "vertical-up"
}

// True when a stacked direction should place the first letter at the BOTTOM so
// the word reads correctly when scanned from the bottom upward.
export function isStackedUpward(dir: TextDirection): boolean {
  return dir === "vertical-up"
}

// Patterns whose SHAPE is derived from text width/height via radius or margin
// math (not a simple stamp grid). Vertical Up/Down must not feed these their
// tall "stacked" footprint, or the shape balloons off-canvas or collapses.
const SHAPE_GEOMETRY_PATTERNS = new Set(["radial", "spiral", "concentric", "honeycomb", "border"])

export function usesShapeGeometry(pattern: Pattern): boolean {
  return SHAPE_GEOMETRY_PATTERNS.has(pattern as string)
}

export function getDirectionRotationOffset(dir: TextDirection): number {
  if (dir === "vertical-down") return 0
  if (dir === "vertical-up") return 0
  return 0
}

// Returns the combined transform string accounting for placement and rotation
export function getWatermarkTransform(
  placement: Placement,
  rotation: number,
  textDirection: TextDirection
): string {
  const totalRotation = rotation + getDirectionRotationOffset(textDirection)
  const isCenter = placement === "center"
  const isMidLeft = placement === "middle-left"
  const isMidRight = placement === "middle-right"
  const isTopCenter = placement === "top-center"
  const isBottomCenter = placement === "bottom-center"

  let translateX = "0"
  let translateY = "0"

  if (isCenter || isTopCenter || isBottomCenter) translateX = "-50%"
  if (isCenter || isMidLeft || isMidRight) translateY = "-50%"

  const hasTranslate = translateX !== "0" || translateY !== "0"
  const translatePart = hasTranslate ? `translate(${translateX}, ${translateY}) ` : ""
  return `${translatePart}rotate(${totalRotation}deg)`
}

// Returns CSS position properties (top/left/bottom/right) for a placement
export function getPlacementPositionStyle(placement: Placement, padPct = 8): React.CSSProperties {
  const p = `${padPct}%`
  switch (placement) {
    case "top-left":      return { top: p, left: p }
    case "top-center":    return { top: p, left: "50%" }
    case "top-right":     return { top: p, right: p }
    case "middle-left":   return { top: "50%", left: p }
    case "center":        return { top: "50%", left: "50%" }
    case "middle-right":  return { top: "50%", right: p }
    case "bottom-left":   return { bottom: p, left: p }
    case "bottom-center": return { bottom: p, left: "50%" }
    case "bottom-right":  return { bottom: p, right: p }
  }
}

export function drawStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  pt: GridPoint,
  totalRotationDeg: number,
  orientation: CurveOrientation = "natural",
  // When set, draw upright letters stacked vertically (sign-style vertical
  // directions); the value is the line height between stacked characters.
  stackedLineHeight?: number,
  // When true, stack from the bottom up so the word reads upward (Vertical Up).
  stackUpward = false,
  paint?: TextPaint,
) {
  if (pt.arc && pt.arc.r > 4) {
    const { cx, cy, r } = pt.arc
    const chars = Array.from(text)
    const widths = chars.map((ch) => ctx.measureText(ch).width)
    const totalWidth = widths.reduce((a, b) => a + b, 0)
    const totalArc = totalWidth / r
    // If the text would wrap most of the way around a tiny circle, fall back
    // to a straight tangent stamp rather than drawing it over itself.
    if (totalArc <= Math.PI * 1.2) {
      // The rotation slider spins curved text around its circle's center.
      const centerAngle =
        Math.atan2(pt.y - cy, pt.x - cx) + (totalRotationDeg * Math.PI) / 180
      // "Always readable": text on the lower half of the circle flips so it
      // stays right-side-up while still bending along the curve.
      // "Follow the shape": text flows continuously around the circle, even
      // where that means appearing upside down at the bottom.
      // Concentric rings ask for one tangent all the way around. Flipping the
      // lower half bends those copies backward and breaks the circle.
      const flip = !pt.arc.continuous && orientation === "readable" && Math.sin(centerAngle) > 0
      const dir = flip ? -1 : 1
      let a = centerAngle - (dir * totalArc) / 2
      for (let i = 0; i < chars.length; i++) {
        const charArc = widths[i] / r
        const mid = a + (dir * charArc) / 2
        ctx.save()
        ctx.translate(cx + r * Math.cos(mid), cy + r * Math.sin(mid))
        ctx.rotate(mid + (dir * Math.PI) / 2)
        paintFill(ctx, chars[i], 0, 0, paint)
        ctx.restore()
        a += dir * charArc
      }
      return
    }
  }
  ctx.save()
  ctx.translate(pt.x, pt.y)
  // Skip the point's own angle ONLY when it's flagged as a pure
  // reading-orientation rotation (Border's side edges) AND we're rendering
  // stacked vertical text — see readingOrientationOnly for why. Shape-defining
  // angles (Honeycomb walls, Zigzag/Radial tilts) are always kept.
  const stacking = Boolean(stackedLineHeight) && !pt.arc
  const skipAngle = stacking && pt.readingOrientationOnly
  ctx.rotate(((totalRotationDeg + (skipAngle ? 0 : pt.angle)) * Math.PI) / 180)
  if (pt.fontScale && pt.fontScale < 1) {
    ctx.scale(pt.fontScale, pt.fontScale)
  }
  // `stacking` is derived from Boolean(stackedLineHeight), which does not
  // narrow the optional parameter. Re-check the value so the line height is
  // a number here. Zero and undefined already make `stacking` false.
  if (stacking && stackedLineHeight) {
    const chars = Array.from(text)
    // For Vertical Up, reverse so the first character sits at the bottom and
    // the word reads correctly scanning upward.
    const ordered = stackUpward ? [...chars].reverse() : chars
    const startY = -((ordered.length - 1) / 2) * stackedLineHeight
    for (let i = 0; i < ordered.length; i++) {
      paintFill(ctx, ordered[i], 0, startY + i * stackedLineHeight, paint)
    }
  } else {
    paintFill(ctx, text, 0, 0, paint)
  }
  ctx.restore()
}

export interface ImageStampOptions {
  stampSize: number
  opacity: number
  rotation: number
  placement: Placement
  coverageMode: CoverageMode
  pattern: Pattern
  density: number
  curveOrientation: CurveOrientation
  imageWidth: number
  imageHeight: number
}

// Single-placement center. The mark's own size and rotation decide how far
// the center sits from the edge, so the whole stamp stays on the photo.
export function getStampAnchor(
  placement: Placement,
  width: number,
  height: number,
  markWidth = 0,
  markHeight = 0,
  rotationDeg = 0,
): { x: number; y: number } {
  return placedStampCenter(placement, width, height, markWidth, markHeight, rotationDeg)
}

export function stampPixelSize(width: number, height: number, stampSize: number): number {
  const safeW = Math.max(width, 1)
  const safeH = Math.max(height, 1)
  const sizeScale = Math.sqrt(safeW * safeH) / 800
  const raw = Math.max(12, Math.round(stampSize * sizeScale))
  const cap = Math.max(12, Math.min(safeW, safeH) * 0.72)
  return Math.min(raw, cap)
}

export function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Could not load that logo. Try a different file."))
    img.src = src
  })
}

function sourceSize(source: CanvasImageSource): { w: number; h: number } {
  if (source instanceof HTMLImageElement) {
    return {
      w: source.naturalWidth || source.width,
      h: source.naturalHeight || source.height,
    }
  }
  if (source instanceof HTMLCanvasElement) {
    return { w: source.width, h: source.height }
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { w: source.width, h: source.height }
  }
  return { w: 1, h: 1 }
}

// Stamps an image (logo or QR) with the same single-point and full-coverage
// placements the text watermark uses. Curved patterns place the stamp along
// the path instead of bending the picture, so a QR code stays a real code.
export function drawImageWatermark(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  opts: ImageStampOptions
): void {
  const {
    stampSize, opacity, rotation, placement, coverageMode, pattern, density,
    curveOrientation, imageWidth, imageHeight,
  } = opts
  const { w: srcW, h: srcH } = sourceSize(source)
  if (srcW < 1 || srcH < 1) return

  const sizeScale = Math.sqrt(Math.max(imageWidth, 1) * Math.max(imageHeight, 1)) / 800
  const box = stampPixelSize(imageWidth, imageHeight, stampSize)
  const patternAngle = coverageMode === "full" ? getPatternTextAngle(pattern) : 0
  const totalRotation = rotation + patternAngle

  const paint = (x: number, y: number, angle: number, fontScale = 1) => {
    const fit = (box / Math.max(srcW, srcH)) * fontScale
    const dw = srcW * fit
    const dh = srcH * fit
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((angle * Math.PI) / 180)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
  }

  ctx.save()
  ctx.globalAlpha = opacity / 100

  if (coverageMode === "full") {
    const points = getPatternPoints(
      imageWidth,
      imageHeight,
      pattern,
      density * sizeScale,
      box,
      box,
      curveOrientation,
      false,
      totalRotation,
    )
    for (const pt of points) {
      paint(pt.x, pt.y, totalRotation + pt.angle, pt.fontScale ?? 1)
    }
  } else {
    const anchor = placedStampCenter(placement, imageWidth, imageHeight, box, box, totalRotation)
    paint(anchor.x, anchor.y, totalRotation, 1)
  }

  ctx.restore()
}

export type ImageExportFormat = "png" | "jpeg" | "webp"

export interface CanvasWatermarkOptions {
  mode?: WatermarkMode
  text: string
  fontFamily: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  placement: Placement
  textDirection: TextDirection
  coverageMode: "single" | "full"
  pattern: Pattern
  density: number
  curveOrientation?: CurveOrientation
  stampSize?: number
  logoUrl?: string | null
  qrUrl?: string | null
  signatureUrl?: string | null
  outlineWidth?: number
  outlineColor?: string
  shadowEnabled?: boolean
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  dateStamp?: DateStampFormat
  frameAspect?: CropAspect
  quarterTurns?: number
  longEdge?: number | null
  exportQuality?: number
  imageWidth: number
  imageHeight: number
  // JPEG has no transparency. A white matte keeps a transparent PNG from turning black.
  matte?: string
}

async function loadStampSource(opts: CanvasWatermarkOptions): Promise<HTMLImageElement | null> {
  if (opts.mode === "logo") {
    if (!opts.logoUrl) return null
    return loadHtmlImage(opts.logoUrl)
  }
  if (opts.mode === "signature") {
    if (!opts.signatureUrl) return null
    return loadHtmlImage(opts.signatureUrl)
  }
  if (opts.mode === "qr") {
    const dataUrl = renderQrDataUrl(opts.qrUrl ?? "", opts.color)
    if (!dataUrl) return null
    return loadHtmlImage(dataUrl)
  }
  return null
}

export async function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  opts: CanvasWatermarkOptions
): Promise<void> {
  const { fontFamily, fontSize, color, opacity, rotation, placement,
    textDirection, coverageMode, pattern, density, imageWidth, imageHeight } = opts
  const text = composeWatermarkText(opts.text, opts.dateStamp ?? "off")
  const curveOrientation = opts.curveOrientation ?? "readable"
  const mode = opts.mode ?? "text"

  canvas.width = imageWidth
  canvas.height = imageHeight

  const ctx = canvas.getContext("2d")!
  if (opts.matte) {
    ctx.fillStyle = opts.matte
    ctx.fillRect(0, 0, imageWidth, imageHeight)
  }
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight)

  if (mode === "logo" || mode === "qr" || mode === "signature") {
    const source = await loadStampSource(opts)
    if (source) {
      drawImageWatermark(ctx, source, {
        stampSize: opts.stampSize ?? DEFAULT_EDITOR_STATE.stampSize,
        opacity,
        rotation,
        placement,
        coverageMode,
        pattern,
        density,
        curveOrientation,
        imageWidth,
        imageHeight,
      })
    }
    return
  }

  // Scale by the geometric mean of the dimensions rather than width alone, so
  // ultra-wide or ultra-tall images get proportionate text instead of oversized rows.
  const sizeScale = Math.sqrt(imageWidth * imageHeight) / 800
  const clampedFontSize = scaledStampFont(fontSize, imageWidth, imageHeight)
  // Explicitly request the selected font — document.fonts.ready alone does not
  // trigger loading of a web font that hasn't been used in the DOM yet, which
  // would make the export silently fall back to a generic font.
  try {
    await document.fonts.load(`bold ${clampedFontSize}px "${fontFamily}"`, text || "M")
  } catch {
    // Local/system fonts (e.g. Arial) are not in the FontFaceSet — that's fine.
  }
  await document.fonts.ready

  ctx.font = `bold ${clampedFontSize}px "${fontFamily}", sans-serif`
  ctx.fillStyle = color
  ctx.globalAlpha = opacity / 100
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"

  // In full coverage mode, add the pattern's built-in base angle to the text rotation
  // so each pattern looks correct at rotation=0.
  // In single mode, only direction offset + user rotation apply.
  const patternAngle = coverageMode === "full" ? getPatternTextAngle(pattern) : 0
  const stacked = isStackedDirection(textDirection)
  const stackUpward = isStackedUpward(textDirection)
  const stackedLineHeight = stacked ? clampedFontSize * 1.02 : undefined
  const totalRotation = rotation + getDirectionRotationOffset(textDirection) + patternAngle
  // Shape patterns size a whole ring or ray from one line of text. A stacked
  // column would blow that shape up. Every other pattern, including a single
  // stamp, needs the real stacked footprint so the letters stay on the photo.
  const isShapePattern = coverageMode === "full" && usesShapeGeometry(pattern)
  const paint = scaledTextPaint({
    fontSize,
    scaledFont: clampedFontSize,
    outlineWidth: opts.outlineWidth ?? 0,
    outlineColor: opts.outlineColor ?? "#FFFFFF",
    shadowEnabled: Boolean(opts.shadowEnabled),
    shadowColor: opts.shadowColor ?? "#111111",
    shadowBlur: opts.shadowBlur ?? 0,
    shadowOffsetX: opts.shadowOffsetX ?? 0,
    shadowOffsetY: opts.shadowOffsetY ?? 0,
  })
  const measured = measureTextStamp(
    ctx,
    text || "\u00A0",
    clampedFontSize,
    fontFamily,
    stacked && !isShapePattern,
  )
  const pad = textPaintPadding(paint)
  measured.width += pad * 2
  measured.height += pad * 2

  if (coverageMode === "full") {
    const normalizedSpacing = density * sizeScale
    const points = getPatternPoints(
      imageWidth,
      imageHeight,
      pattern,
      normalizedSpacing,
      measured.width,
      measured.height,
      curveOrientation,
      stacked && !isShapePattern,
      totalRotation,
    )
    for (const pt of points) {
      drawStamp(ctx, text || "\u00A0", pt, totalRotation, curveOrientation, stackedLineHeight, stackUpward, paint)
    }
  } else {
    const { x, y } = placedStampCenter(
      placement,
      imageWidth,
      imageHeight,
      measured.width,
      measured.height,
      totalRotation,
    )

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((totalRotation * Math.PI) / 180)
    if (stackedLineHeight) {
      const chars = Array.from(text || "\u00A0")
      const ordered = stackUpward ? [...chars].reverse() : chars
      const startY = -((ordered.length - 1) / 2) * stackedLineHeight
      for (let i = 0; i < ordered.length; i++) {
        paintFill(ctx, ordered[i], 0, startY + i * stackedLineHeight, paint)
      }
    } else {
      paintFill(ctx, text || "\u00A0", 0, 0, paint)
    }
    ctx.restore()
  }
}

const EXPORT_MIME: Record<ImageExportFormat, { mime: string; quality?: number }> = {
  png: { mime: "image/png" },
  jpeg: { mime: "image/jpeg", quality: 0.92 },
  webp: { mime: "image/webp", quality: 0.92 },
}

export interface ExportedImage {
  blob: Blob
  preview: Blob
}

export async function exportWatermarked(
  image: File,
  opts: CanvasWatermarkOptions,
  format: ImageExportFormat = "png"
): Promise<ExportedImage> {
  const bitmap = await createImageBitmap(image)
  const canvas = document.createElement("canvas")
  let framed: HTMLCanvasElement | null = null
  const { mime, quality: defaultQuality } = EXPORT_MIME[format]
  const requested = opts.exportQuality
  const quality = format === "png"
    ? undefined
    : requested == null
      ? defaultQuality
      : Math.min(1, Math.max(0.6, requested > 1 ? requested / 100 : requested))
  try {
    const aspect = opts.frameAspect ?? "original"
    const turns = opts.quarterTurns ?? 0
    const longEdge = opts.longEdge ?? null
    let source: CanvasImageSource = bitmap
    let width = bitmap.width
    let height = bitmap.height
    if (needsFrame(bitmap.width, bitmap.height, aspect, turns, longEdge)) {
      framed = frameBitmap(bitmap, aspect, turns, longEdge)
      source = framed
      width = framed.width
      height = framed.height
      closeBitmap(bitmap)
    }
    await drawWatermarkOnCanvas(canvas, source, {
      ...opts,
      imageWidth: width,
      imageHeight: height,
      matte: format === "jpeg" ? "#ffffff" : opts.matte,
    })
    const blob = await canvasToBlob(canvas, mime, quality)
    if (!blob || blob.size <= 0 || (blob.type && blob.type !== mime)) {
      throw new Error("This browser could not export that format.")
    }
    // Preview while the full canvas is still alive, so the gallery does not
    // decode the finished photo a second time.
    const preview = await scaledPreviewBlob(canvas, width, height, 640)
    return { blob, preview }
  } finally {
    closeBitmap(bitmap)
    releaseCanvas(framed)
    releaseCanvas(canvas)
  }
}

export async function exportToPng(
  image: File,
  opts: CanvasWatermarkOptions
): Promise<ExportedImage> {
  return exportWatermarked(image, opts, "png")
}

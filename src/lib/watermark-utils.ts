import type { CurveOrientation, Placement, TextDirection, Pattern } from "@/lib/editor-types"

// Returns the built-in base text angle for a given full-coverage pattern.
// This ensures each pattern looks like its intended layout at rotation=0,
// without modifying Text Direction behavior (which applies only to single mode
// and stacks additively on top of this in full coverage mode).
export function getPatternTextAngle(pattern: Pattern): number {
  switch (pattern) {
    case "diagonal":         return -25
    case "reverse-diagonal": return 25
    case "diamond":          return 0
    default:                 return 0
  }
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
// Vertical Down renders as STACKED upright letters (like a vertical sign you can
// read without tilting your head), so it contributes no rotation offset.
export function isStackedDirection(dir: TextDirection): boolean {
  return dir === "vertical-down"
}

export function getDirectionRotationOffset(dir: TextDirection): number {
  if (dir === "vertical-down") return 0
  if (dir === "vertical-up") return -90
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

export interface GridPoint {
  x: number
  y: number
  // Per-point angle offset in degrees, added on top of the global totalRotation
  // during canvas rendering.  0 for most patterns; ±N for crisscross.
  angle: number
  // Optional per-point text scale (0..1). Honeycomb uses this to shrink the
  // text so it fits along one hexagon wall.
  fontScale?: number
  // When present, the stamp's text is rendered CURVED along a circle of this
  // radius centered at (cx, cy) — used by Concentric and Spiral so words
  // naturally follow the shape instead of sitting straight in space.
  arc?: { cx: number; cy: number; r: number }
}

// Draws one watermark stamp. Straight stamps rotate around their center;
// stamps carrying arc info render each character along the circle so the
// text physically bends with the shape (rubber-stamp style, tops outward).
export function drawStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  pt: GridPoint,
  totalRotationDeg: number,
  orientation: CurveOrientation = "natural",
  // When set, draw upright letters stacked vertically (sign-style "Vertical
  // Down"); the value is the line height between stacked characters.
  stackedLineHeight?: number
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
      const flip = orientation === "readable" && Math.sin(centerAngle) > 0
      const dir = flip ? -1 : 1
      let a = centerAngle - (dir * totalArc) / 2
      for (let i = 0; i < chars.length; i++) {
        const charArc = widths[i] / r
        const mid = a + (dir * charArc) / 2
        ctx.save()
        ctx.translate(cx + r * Math.cos(mid), cy + r * Math.sin(mid))
        ctx.rotate(mid + (dir * Math.PI) / 2)
        ctx.fillText(chars[i], 0, 0)
        ctx.restore()
        a += dir * charArc
      }
      return
    }
  }
  ctx.save()
  ctx.translate(pt.x, pt.y)
  ctx.rotate(((totalRotationDeg + pt.angle) * Math.PI) / 180)
  if (pt.fontScale && pt.fontScale < 1) {
    ctx.scale(pt.fontScale, pt.fontScale)
  }
  if (stackedLineHeight && !pt.arc) {
    const chars = Array.from(text)
    const startY = -((chars.length - 1) / 2) * stackedLineHeight
    for (let i = 0; i < chars.length; i++) {
      ctx.fillText(chars[i], 0, startY + i * stackedLineHeight)
    }
  } else {
    ctx.fillText(text, 0, 0)
  }
  ctx.restore()
}

// Generates grid points for full-coverage patterns.
// pt.angle is applied additively to the global text rotation during canvas rendering.
// textWidth/textHeight (measured from the rendered text) put a floor under the step
// sizes so the density slider packs marks tightly at its minimum without ever letting
// them pile into an unreadable overlapping mass.
export function getPatternPoints(
  width: number,
  height: number,
  pattern: Pattern,
  spacing: number,
  textWidth = 0,
  textHeight = 0,
  orientation: CurveOrientation = "readable"
): GridPoint[] {
  const points: GridPoint[] = []

  // Cap spacing relative to the image so even the slider's maximum still keeps
  // a sane number of rows/cells — the middle of the photo can never go empty.
  spacing = Math.max(1, Math.min(spacing, Math.min(width, height) / 2))

  // Rows can never sit closer than the text is tall (plus breathing room),
  // and same-row items can never sit closer than the text is wide.
  const minRowStep = Math.max(spacing, textHeight * 1.4)

  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.sqrt(width * width + height * height) / 2

  // Keeps rotated text right-side-up (used by circular patterns) so nothing
  // renders upside down on the left/bottom halves of rings, rays, and spirals.
  const upright = (a: number): number => {
    const m = ((a % 360) + 360) % 360
    return m > 90 && m < 270 ? a - 180 : a
  }

  // Evenly spaced positions at a fixed step, centered within [lo, hi].
  const centeredRun = (lo: number, hi: number, step: number): number[] => {
    const n = Math.max(1, Math.floor((hi - lo) / step) + 1)
    const start = (lo + hi - (n - 1) * step) / 2
    return Array.from({ length: n }, (_, k) => start + k * step)
  }

  // Adds a grid of points whose rows/columns run at `tiltDeg` degrees.
  // Optional custom steps let patterns like Lattice use tight along-band
  // spacing with wide band separation.
  function addTiltedGrid(tiltDeg: number, angle = 0, xStepOverride?: number, yStepOverride?: number) {
    const xStep = xStepOverride ?? Math.max(spacing, textWidth + Math.max(spacing * 0.25, textHeight * 1.2))
    // Staggered tilted rows need extra perpendicular room or adjacent rows'
    // stamps visually chain into cluttered bands.
    const yStep = yStepOverride ?? Math.max(spacing, textHeight * 1.85)
    const tilt = (tiltDeg * Math.PI) / 180
    const cos = Math.cos(tilt)
    const sin = Math.sin(tilt)
    const cx = width / 2
    const cy = height / 2
    const diag = Math.sqrt(width * width + height * height)
    const colPad = Math.ceil(diag / xStep) + 2
    const rowPad = Math.ceil(diag / yStep) + 2
    for (let r = -rowPad; r <= rowPad; r++) {
      for (let c = -colPad; c <= colPad; c++) {
        // Alternate rows shift by half a step so stamps never align into
        // columns — eliminating the empty "channels" between diagonal rows.
        const gx = (c + (r & 1 ? 0.5 : 0)) * xStep
        const gy = r * yStep
        const x = cx + gx * cos - gy * sin
        const y = cy + gx * sin + gy * cos
        if (x >= -xStep && x <= width + xStep && y >= -yStep && y <= height + yStep) {
          points.push({ x, y, angle })
        }
      }
    }
  }

  if (pattern === "grid") {
    // xStep must exceed the actual rendered text width or same-row items touch/overlap
    // and the grid collapses into solid stripes. Use whichever is larger: the
    // density-derived step, or the measured text width plus a proportional gap.
    const xStep = Math.max(spacing * 1.8, textWidth + spacing * 0.35)
    const yStep = minRowStep
    for (let row = 0; ; row++) {
      const y = yStep / 2 + row * yStep
      if (y > height + yStep) break
      for (let col = 0; ; col++) {
        const x = xStep / 2 + col * xStep
        if (x > width + xStep) break
        points.push({ x, y, angle: 0 })
      }
    }
  } else if (pattern === "diagonal") {
    addTiltedGrid(30)
  } else if (pattern === "reverse-diagonal") {
    addTiltedGrid(-30)
  } else if (pattern === "crisscross") {
    // Two crossing tilted grids with matching per-point text angles.
    // Each arm's text angle matches the grid's own tilt so the strips look intentional.
    addTiltedGrid(30,  -25)
    addTiltedGrid(-30,  25)
  } else if (pattern === "diamond") {
    // Two strips crossing at 90° (±45°) — creates square/diamond-shaped openings in the negative space.
    // Per-point angles (±45) align text with each strip direction.
    addTiltedGrid(45,  45)
    addTiltedGrid(-45, -45)
  } else if (pattern === "checkerboard") {
    // Filled items in a row sit 2 × xStep apart, with an "empty cell" between them.
    // The cell (xStep) must be at least as wide as the rendered text, otherwise the
    // text bleeds into the empty cells and the alternation disappears entirely.
    const xStep = Math.max(spacing * 1.3, textWidth + spacing * 0.3)
    const yStep = minRowStep
    for (let row = 0; ; row++) {
      const y = yStep / 2 + row * yStep
      if (y > height + yStep) break
      for (let col = 0; ; col++) {
        const x = xStep / 2 + col * xStep
        if (x > width + xStep) break
        if ((row + col) % 2 === 0) {
          points.push({ x, y, angle: 0 })
        }
      }
    }
    } else if (pattern === "scattered") {
    // Deterministic pseudo-random scatter.  Each cell center is offset by up to
    // ±40 % of the spacing in both axes, giving clear visual variety without
    // clustering all items into one corner.
    // Cells are at least text-sized; jitter is bounded to the free space inside
    // each cell, so placement stays random but neighbors can never overlap.
    const cellW = Math.max(spacing, textWidth * 1.05)
    const cellH = Math.max(spacing, textHeight * 1.9)
    const freeX = Math.max(0, (cellW - textWidth) / 2)
    const freeY = Math.max(0, cellH / 2 - textHeight * 0.85)
    const cols = Math.ceil(width  / cellW) + 1
    const rows = Math.ceil(height / cellH) + 1
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const seed = r * 1000 + c
        const jx = ((seed * 9301 + 49297) % 233280) / 233280
        const jy = ((seed * 6571 + 29311) % 233280) / 233280
        const x = (c + 0.5) * cellW + (jx - 0.5) * 2 * freeX
        const y = (r + 0.5) * cellH + (jy - 0.5) * 2 * freeY
        points.push({ x, y, angle: 0 })
      }
    }
  } else if (pattern === "wave") {
    // Rows follow a gentle sine curve; each item tilts to match the local slope.
    const xStep = Math.max(spacing, textWidth + spacing * 0.3)
    const yStep = minRowStep
    const amp = yStep * 0.35
    const freq = (2 * Math.PI * 2.2) / width
    for (let row = 0; ; row++) {
      const y0 = yStep / 2 + row * yStep
      if (y0 > height + yStep) break
      const stagger = row % 2 === 1 ? xStep / 2 : 0
      for (let col = -1; ; col++) {
        const x = xStep / 2 + col * xStep + stagger
        if (x > width + xStep) break
        const ph = x * freq
        const y = y0 + amp * Math.sin(ph)
        const angle = (Math.atan(amp * freq * Math.cos(ph)) * 180) / Math.PI
        points.push({ x, y, angle })
      }
    }
  } else if (pattern === "zigzag") {
    // Items alternate above/below the row line with opposing tilts,
    // tracing a sharp up-down zigzag across each row.
    const xStep = Math.max(spacing, textWidth + spacing * 0.25)
    const yStep = minRowStep
    const amp = textHeight * 0.7
    const segAngle = (Math.atan((2 * amp) / xStep) * 180) / Math.PI
    for (let row = 0; ; row++) {
      const y0 = yStep / 2 + row * yStep
      if (y0 > height + yStep) break
      for (let col = 0; ; col++) {
        const x = xStep / 2 + col * xStep
        if (x > width + xStep) break
        const up = col % 2 === 0
        points.push({ x, y: y0 + (up ? -amp : amp), angle: up ? segAngle : -segAngle })
      }
    }
  } else if (pattern === "brick") {
    // Tight rows offset by half a step, like a brick wall with thin mortar gaps.
    const xStep = Math.max(spacing * 0.8, textWidth + spacing * 0.2)
    const yStep = Math.max(spacing * 0.75, textHeight * 1.7)
    for (let row = 0; ; row++) {
      const y = yStep / 2 + row * yStep
      if (y > height + yStep) break
      const start = row % 2 === 0 ? xStep / 2 : xStep
      for (let col = 0; ; col++) {
        const x = start + col * xStep - xStep
        if (x > width + xStep) break
        if (x >= -xStep) points.push({ x, y, angle: 0 })
      }
    }
  } else if (pattern === "honeycomb") {
    // TRUE honeycomb: text forms the six walls of tiling hexagon cells.
    // Each edge carries one copy of the text, auto-scaled to fit the wall, so
    // the Spacing slider controls the cell size. Shared walls are deduplicated.
    const R = Math.max(spacing * 1.4, textHeight * 2.6, textWidth * 0.45)
    const fontScale = textWidth > 0 ? Math.min(1, (R * 0.82) / textWidth) : 1
    const stepX = 1.5 * R
    const stepY = Math.sqrt(3) * R
    const seen = new Set<string>()
    for (let col = -2; col * stepX <= width + 2 * R; col++) {
      const x0 = col * stepX
      for (let row = -2; row * stepY + (((col % 2) + 2) % 2) * (stepY / 2) <= height + 2 * R; row++) {
        const y0 = row * stepY + (((col % 2) + 2) % 2) * (stepY / 2)
        // flat-top hexagon vertices around this cell center
        const vs: [number, number][] = []
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k
          vs.push([x0 + R * Math.cos(a), y0 + R * Math.sin(a)])
        }
        for (let k = 0; k < 6; k++) {
          const a = vs[k]
          const b = vs[(k + 1) % 6]
          const mx = (a[0] + b[0]) / 2
          const my = (a[1] + b[1]) / 2
          if (mx < -R || mx > width + R || my < -R || my > height + R) continue
          const key = `${Math.round(mx)}:${Math.round(my)}`
          if (seen.has(key)) continue
          seen.add(key)
          let ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI
          if (ang > 90) ang -= 180
          if (ang <= -90) ang += 180
          points.push({ x: mx, y: my, angle: ang, fontScale })
        }
      }
    }
    } else if (pattern === "lattice") {
    // Two crossing sets of tightly-packed diagonal bands at ±45°, widely separated,
    // weaving continuous strips (distinct from Crisscross's uniform grid).
    const along = Math.max(spacing * 0.5, textWidth + spacing * 0.15)
    const band = Math.max(spacing * 2.2, textHeight * 4)
    addTiltedGrid(45, 45, along, band)
    addTiltedGrid(-45, -45, along, band)
  } else if (pattern === "radial") {
    // Rays radiate outward from an open center; text runs along each ray.
    const clear = Math.max(textHeight * 1.2, spacing * 0.25)
    const r0 = clear + textWidth / 2
    const rStep = Math.max(spacing, textWidth + spacing * 0.2)
    // Cap ray count by geometry: adjacent rays at the inner radius must have
    // room for the text height, or the hub becomes an unreadable bunch.
    const geometricMax = Math.max(4, Math.floor((2 * Math.PI * r0) / (textHeight * 1.7)))
    const rays = Math.min(geometricMax, Math.max(8, Math.min(32, Math.round(1600 / spacing))))
    for (let i = 0; i < rays; i++) {
      const theta = (i * 2 * Math.PI) / rays
      for (let r = r0; r <= maxRadius + rStep; r += rStep) {
        const x = centerX + r * Math.cos(theta)
        const y = centerY + r * Math.sin(theta)
        if (x >= -textWidth / 2 && x <= width + textWidth / 2 && y >= -textHeight && y <= height + textHeight) {
          const raw = (theta * 180) / Math.PI
          points.push({ x, y, angle: orientation === "readable" ? upright(raw) : raw })
        }
      }
    }
  } else if (pattern === "spiral") {
    // Text follows an Archimedean spiral outward from the center.
    const ringStep = Math.max(spacing * 0.75, textHeight * 2)
    const b = ringStep / (2 * Math.PI)
    const arcStep = Math.max(spacing * 0.7, textWidth * 0.8 + spacing * 0.15)
    // Start where the curve is wide enough for the text to bend along it
    // (radius >= textWidth/2.5 keeps the arc under the curved-render limit).
    let phi = Math.max(ringStep * 0.55, textWidth / 2.5) / b
    for (;;) {
      const r = b * phi
      if (r > maxRadius + ringStep) break
      const x = centerX + r * Math.cos(phi)
      const y = centerY + r * Math.sin(phi)
      if (x >= -textWidth / 2 && x <= width + textWidth / 2 && y >= -textHeight && y <= height + textHeight) {
        points.push({ x, y, angle: 0, arc: { cx: centerX, cy: centerY, r } })
      }
      phi += arcStep / Math.max(r, 1)
    }
  } else if (pattern === "concentric") {
    // Repeated rings around the center; text follows each ring's curve.
    const ringStep = Math.max(spacing, textHeight * 2.1)
    let ring = 0
    // First ring must be wide enough for the text to curve along it.
    const firstRing = Math.max(ringStep * 0.9, textWidth / 2.5)
    for (let r = firstRing; r <= maxRadius + ringStep; r += ringStep, ring++) {
      const n = Math.max(3, Math.floor((2 * Math.PI * r) / (textWidth + spacing * 0.2)))
      const offset = ring % 2 === 1 ? Math.PI / n : 0
      for (let k = 0; k < n; k++) {
        const theta = (k * 2 * Math.PI) / n + offset
        const x = centerX + r * Math.cos(theta)
        const y = centerY + r * Math.sin(theta)
        if (x >= -textWidth / 2 && x <= width + textWidth / 2 && y >= -textHeight && y <= height + textHeight) {
          points.push({ x, y, angle: 0, arc: { cx: centerX, cy: centerY, r } })
        }
      }
    }
  } else if (pattern === "border") {
    // Repeats only along the image edges: horizontal runs top/bottom,
    // vertical runs on the sides when the image is tall enough for them.
    const m = textHeight * 1.2
    const step = textWidth + spacing * 0.35
    for (const x of centeredRun(textWidth / 2, width - textWidth / 2, step)) {
      points.push({ x, y: m, angle: 0 })
      points.push({ x, y: height - m, angle: 0 })
    }
    if (height - 2 * m >= textWidth) {
      for (const y of centeredRun(textWidth / 2 + m, height - m - textWidth / 2, step)) {
        points.push({ x: m, y, angle: -90 })
        points.push({ x: width - m, y, angle: 90 })
      }
    }
  }

  return points
}

export interface CanvasWatermarkOptions {
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
  imageWidth: number
  imageHeight: number
}

export async function drawWatermarkOnCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  opts: CanvasWatermarkOptions
): Promise<void> {
  const { text, fontFamily, fontSize, color, opacity, rotation, placement,
    textDirection, coverageMode, pattern, density, imageWidth, imageHeight } = opts
  const curveOrientation = opts.curveOrientation ?? "readable"

  canvas.width = imageWidth
  canvas.height = imageHeight

  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, 0, 0, imageWidth, imageHeight)

  // Scale by the geometric mean of the dimensions rather than width alone, so
  // ultra-wide or ultra-tall images get proportionate text instead of oversized rows.
  const sizeScale = Math.sqrt(imageWidth * imageHeight) / 800
  const scaledFontSize = Math.round(fontSize * sizeScale)
  const clampedFontSize = Math.max(12, scaledFontSize)
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
  const stackedLineHeight = stacked ? clampedFontSize * 1.02 : undefined
  const totalRotation = rotation + getDirectionRotationOffset(textDirection) + patternAngle

  if (coverageMode === "full") {
    const normalizedSpacing = density * sizeScale
    // Measure the actual rendered text width (font is already set on ctx above)
    // so grid/checkerboard can guarantee non-overlapping columns.
    const rawText = text || "\u00A0"
    // Stacked vertical text has a narrow-but-tall footprint; feed the pattern
    // generator the real occupied dimensions so spacing math stays correct.
    const chars = Array.from(rawText)
    const measuredWidth = ctx.measureText(rawText).width
    const textWidth = stacked
      ? Math.max(...chars.map((c) => ctx.measureText(c).width), 1)
      : measuredWidth
    const effTextHeight = stacked ? chars.length * clampedFontSize * 1.02 : clampedFontSize
    const points = getPatternPoints(imageWidth, imageHeight, pattern, normalizedSpacing, textWidth, effTextHeight, curveOrientation)
    for (const pt of points) {
      drawStamp(ctx, text || "\u00A0", pt, totalRotation, curveOrientation, stackedLineHeight)
    }
  } else {
    const pad = imageWidth * 0.08
    let x: number
    let y: number

    switch (placement) {
      case "top-left":      x = pad;              y = pad; break
      case "top-center":    x = imageWidth / 2;   y = pad; break
      case "top-right":     x = imageWidth - pad;  y = pad; break
      case "middle-left":   x = pad;              y = imageHeight / 2; break
      case "center":        x = imageWidth / 2;   y = imageHeight / 2; break
      case "middle-right":  x = imageWidth - pad;  y = imageHeight / 2; break
      case "bottom-left":   x = pad;              y = imageHeight - pad; break
      case "bottom-center": x = imageWidth / 2;   y = imageHeight - pad; break
      case "bottom-right":  x = imageWidth - pad;  y = imageHeight - pad; break
    }

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((totalRotation * Math.PI) / 180)
    if (stackedLineHeight) {
      const chars = Array.from(text || "\u00A0")
      const startY = -((chars.length - 1) / 2) * stackedLineHeight
      for (let i = 0; i < chars.length; i++) {
        ctx.fillText(chars[i], 0, startY + i * stackedLineHeight)
      }
    } else {
      ctx.fillText(text || "\u00A0", 0, 0)
    }
    ctx.restore()
  }
}

export async function exportToPng(
  image: File,
  opts: CanvasWatermarkOptions
): Promise<string> {
  const bitmap = await createImageBitmap(image)
  const canvas = document.createElement("canvas")
  const offscreenImg = document.createElement("img")

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(image)
    offscreenImg.onload = async () => {
      try {
        await drawWatermarkOnCanvas(canvas, offscreenImg, {
          ...opts,
          imageWidth: bitmap.width,
          imageHeight: bitmap.height,
        })
        bitmap.close()
        URL.revokeObjectURL(url)
        resolve(canvas.toDataURL("image/png"))
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }
    offscreenImg.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Failed to load image for export"))
    }
    offscreenImg.src = url
  })
}

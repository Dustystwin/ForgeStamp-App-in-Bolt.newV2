import type { CurveOrientation, Pattern, Placement } from "@/lib/editor-types"

export interface GridPoint {
  x: number
  y: number
  // Added to the user's rotation when the stamp is drawn.
  angle: number
  // Shrinks the stamp so it sits on a short edge (honeycomb, diamond, lattice).
  fontScale?: number
  // A tilt that only keeps ordinary text readable. Stacked letters ignore it
  // so a tall column does not swing into its neighbors.
  readingOrientationOnly?: boolean
  // Curved text follows this circle. Logo and QR ignore it and stay square.
  arc?: { cx: number; cy: number; r: number; continuous?: boolean }
}

export function rotatedHalfExtents(
  markWidth: number,
  markHeight: number,
  rotationDeg: number,
): { halfW: number; halfH: number } {
  const hw = Math.max(0, markWidth) / 2
  const hh = Math.max(0, markHeight) / 2
  const rad = (rotationDeg * Math.PI) / 180
  const c = Math.abs(Math.cos(rad))
  const s = Math.abs(Math.sin(rad))
  return { halfW: hw * c + hh * s, halfH: hw * s + hh * c }
}

/**
 * Center of one watermark so the whole rotated mark stays inside the photo.
 * The mark's edge, not its center, sits inset by a small margin.
 * When the mark cannot fit, it is centered rather than pinned to a corner.
 */
export function placedStampCenter(
  placement: Placement,
  width: number,
  height: number,
  markWidth: number,
  markHeight: number,
  rotationDeg: number,
): { x: number; y: number } {
  const safeW = Math.max(width, 1)
  const safeH = Math.max(height, 1)
  const margin = Math.max(6, Math.min(safeW, safeH) * 0.03)
  const { halfW, halfH } = rotatedHalfExtents(markWidth, markHeight, rotationDeg)

  const pick = (min: number, max: number, size: number, edge: "start" | "center" | "end") => {
    if (!(min <= max)) return size / 2
    if (edge === "start") return min
    if (edge === "end") return max
    return Math.min(max, Math.max(min, size / 2))
  }

  const col: "start" | "center" | "end" = placement.endsWith("left")
    ? "start"
    : placement.endsWith("right")
      ? "end"
      : "center"
  const row: "start" | "center" | "end" = placement.startsWith("top")
    ? "start"
    : placement.startsWith("bottom")
      ? "end"
      : "center"

  return {
    x: pick(margin + halfW, safeW - margin - halfW, safeW, col),
    y: pick(margin + halfH, safeH - margin - halfH, safeH, row),
  }
}

export function scaledStampFont(fontSize: number, width: number, height: number): number {
  const sizeScale = Math.sqrt(Math.max(width, 1) * Math.max(height, 1)) / 800
  return Math.max(12, Math.round(fontSize * sizeScale))
}

export function measureTextStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontPx: number,
  fontFamily: string,
  stacked: boolean,
): { width: number; height: number } {
  ctx.font = `bold ${fontPx}px "${fontFamily}", sans-serif`
  const raw = text || "\u00A0"
  const chars = Array.from(raw)
  if (stacked) {
    const width = Math.max(1, ...chars.map((ch) => ctx.measureText(ch).width))
    return { width, height: Math.max(fontPx, chars.length * fontPx * 1.02) }
  }
  return { width: Math.max(1, ctx.measureText(raw).width), height: fontPx }
}

/** Smallest clear space between two copies, as a fraction of the text height. */
export const MIN_COPY_GAP_RATIO = 0.3

type StampBox = { x: number; y: number; w: number; h: number; angle: number }

/**
 * The boxes that actually get painted for one copy. Curved text is one box
 * per letter, matching the painter. A logo or QR is one rotated square.
 */
export function copyFootprints(
  pt: GridPoint,
  markWidth: number,
  markHeight: number,
  baseRotation: number,
  stackedMode: boolean,
  orientation: CurveOrientation,
  charWidths: number[],
): StampBox[] {
  const arc = pt.arc
  const scale = pt.fontScale != null && pt.fontScale > 0 ? pt.fontScale : 1
  if (!arc || arc.r <= 4 || charWidths.length === 0 || !charWidths.some((w) => w > 0)) {
    return [layoutStampBox(pt, markWidth, markHeight, baseRotation, stackedMode)]
  }
  const raw = charWidths
  const rawSum = raw.reduce((sum, w) => sum + w, 0) || markWidth
  const slack = markWidth - rawSum
  const grown = slack > markHeight * 0.15 ? raw.map((w) => w + slack / raw.length) : raw
  const widths = grown.map((w) => w * scale)
  const letterH = Math.max(1, markHeight * scale)
  const { cx, cy, r } = arc
  const total = widths.reduce((sum, w) => sum + w, 0)
  const totalArc = total / Math.max(r, 0.001)
  const centerAngle = Math.atan2(pt.y - cy, pt.x - cx) + (baseRotation * Math.PI) / 180
  if (totalArc > Math.PI * 1.2) {
    return [layoutStampBox(pt, markWidth, markHeight, baseRotation, stackedMode)]
  }
  const flip = !arc.continuous && orientation === "readable" && Math.sin(centerAngle) > 0
  const dir = flip ? -1 : 1
  let cursor = centerAngle - (dir * totalArc) / 2
  const boxes: StampBox[] = []
  for (const w of widths) {
    const charArc = w / Math.max(r, 0.001)
    const mid = cursor + (dir * charArc) / 2
    boxes.push({
      x: cx + r * Math.cos(mid),
      y: cy + r * Math.sin(mid),
      w,
      h: letterH,
      angle: ((mid + (dir * Math.PI) / 2) * 180) / Math.PI,
    })
    cursor += dir * charArc
  }
  return boxes
}

/** True when every copy stays at least `minGap` away from the others. */
export function copiesAreClear(
  points: GridPoint[],
  markWidth: number,
  markHeight: number,
  baseRotation: number,
  stackedMode: boolean,
  orientation: CurveOrientation,
  charWidths: number[],
  minGap: number,
): boolean {
  const placed: StampBox[] = []
  for (const pt of points) {
    const boxes = copyFootprints(pt, markWidth, markHeight, baseRotation, stackedMode, orientation, charWidths)
    if (boxes.some((box) => placed.some((other) => boxesOverlap(box, other, minGap)))) return false
    placed.push(...boxes)
  }
  return true
}

/** The box actually drawn for a pattern stamp. Shared by preview and export. */
export function layoutStampBox(
  pt: GridPoint,
  markWidth: number,
  markHeight: number,
  baseRotation: number,
  stackedMode: boolean,
): { x: number; y: number; w: number; h: number; angle: number } {
  const scale = pt.fontScale != null && pt.fontScale > 0 ? pt.fontScale : 1
  const skip = stackedMode && pt.readingOrientationOnly
  return {
    x: pt.x,
    y: pt.y,
    w: Math.max(1, markWidth * scale),
    h: Math.max(1, markHeight * scale),
    angle: baseRotation + (skip ? 0 : pt.angle),
  }
}

function unitHash(n: number): number {
  let x = n >>> 0
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0
  x = (x ^ (x >>> 16)) >>> 0
  return x / 4294967296
}

function hash2(row: number, col: number, salt: number): number {
  const n = (Math.imul(row + 3, 374761393) ^ Math.imul(col + 5, 668265263) ^ Math.imul(salt + 7, 1440671)) >>> 0
  return unitHash(n)
}

function projectExtent(angleDeg: number, axisDeg: number, halfW: number, halfH: number): number {
  const d = ((angleDeg - axisDeg) * Math.PI) / 180
  return halfW * Math.abs(Math.cos(d)) + halfH * Math.abs(Math.sin(d))
}

function boxesOverlap(
  a: { x: number; y: number; w: number; h: number; angle: number },
  b: { x: number; y: number; w: number; h: number; angle: number },
  pad: number,
): boolean {
  const axes = [a.angle, a.angle + 90, b.angle, b.angle + 90]
  for (const axis of axes) {
    const rad = (axis * Math.PI) / 180
    const ux = Math.cos(rad)
    const uy = Math.sin(rad)
    const aExtent = projectExtent(a.angle, axis, a.w / 2, a.h / 2) + pad / 2
    const bExtent = projectExtent(b.angle, axis, b.w / 2, b.h / 2) + pad / 2
    const aCenter = a.x * ux + a.y * uy
    const bCenter = b.x * ux + b.y * uy
    if (aCenter + aExtent <= bCenter - bExtent || bCenter + bExtent <= aCenter - aExtent) return false
  }
  return true
}

/**
 * On. The spiral is still the original curved-letter layout from commit 85c85bc.
 * A copy that would sit on top of its neighbor is left out. The ones that
 * remain stay exactly where they were.
 */
export const SPIRAL_SKIP_OVERLAP = true

function upright(angle: number): number {
  const wrapped = ((angle % 360) + 360) % 360
  return wrapped > 90 && wrapped < 270 ? angle - 180 : angle
}

function axisCenters(span: number, step: number): number[] {
  const safeStep = Math.max(1, step)
  const n = Math.max(1, Math.ceil(span / safeStep))
  const start = (span - (n - 1) * safeStep) / 2
  return Array.from({ length: n }, (_, i) => start + i * safeStep)
}

/**
 * Full-coverage positions. The same inputs always produce the same points.
 * Stamps are spaced from their real size so copies do not sit on top of each other.
 * `baseRotation` is the user's rotation (pattern angles live on each point).
 */
export function getPatternPoints(
  width: number,
  height: number,
  pattern: Pattern,
  spacing: number,
  textWidth = 0,
  textHeight = 0,
  orientation: CurveOrientation = "readable",
  stackedMode = false,
  baseRotation = 0,
  charWidths: number[] = [],
): GridPoint[] {
  const markW = Math.max(8, textWidth)
  const markH = Math.max(8, textHeight)
  // The Spacing slider is allowed to run to its own top. Capping it against
  // the short side of the photo froze wide and thin pictures partway up,
  // and made a small preview disagree with the full-size export.
  spacing = Math.max(1, spacing)
  // About a third of the letter height, so copies never sit against each other.
  const gap = Math.max(4, markH * MIN_COPY_GAP_RATIO)
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = Math.hypot(width, height) / 2
  const candidates: GridPoint[] = []
  // 1 at the usual Spacing setting. The slider runs from about 0.44 to 4.4.
  const openness = spacing / Math.max(1, (Math.sqrt(Math.max(width, 1) * Math.max(height, 1)) / 800) * 90)

  const need = (finalDeg: number, dirDeg: number) =>
    projectExtent(finalDeg, dirDeg, markW / 2, markH / 2) * 2 + gap

  // Lowest setting sits just clear of the stamp. Higher settings open the
  // same gap by a fraction of the stamp, so a large font moves as much as a
  // small one, and copies still cannot land on each other.
  const room = (minimum: number) => minimum * (1 + 0.34 * Math.max(0, openness - 0.444))

  const push = (pt: GridPoint) => {
    const scale = pt.fontScale != null && pt.fontScale > 0 ? pt.fontScale : 1
    const hw = (markW * scale) / 2
    const hh = (markH * scale) / 2
    if (pt.x < -hw * 1.2 || pt.y < -hh * 1.2 || pt.x > width + hw * 1.2 || pt.y > height + hh * 1.2) return
    candidates.push(pt)
  }

  if (pattern === "grid" || pattern === "checkerboard") {
    const ext = rotatedHalfExtents(markW, markH, baseRotation)
    const xStep = room(ext.halfW * 2 + gap)
    const yStep = room(ext.halfH * 2 + gap)
    const ys = axisCenters(height, yStep)
    const xs = axisCenters(width, xStep)
    ys.forEach((y, row) => {
      xs.forEach((x, col) => {
        if (pattern === "checkerboard" && (row + col) % 2 === 1) return
        push({ x, y, angle: 0 })
      })
    })
  } else if (pattern === "brick") {
    // The horizontal gap tracks the measured word, not only its height, so a
    // long label on a narrow portrait photo does not run into the next copy.
    const ext = rotatedHalfExtents(markW, markH, baseRotation)
    const hGap = Math.max(gap, markW * 0.34, markH * 0.5)
    const vGap = Math.max(gap, markH * 0.7)
    const xStep = room(ext.halfW * 2 + hGap)
    const yStep = room(ext.halfH * 2 + vGap)
    const ys = axisCenters(height, yStep)
    const xs = axisCenters(width, xStep)
    // A one-column portrait still offsets every other row, but only as far as
    // the stamp can move without leaving the photo.
    const shiftCap = Math.max(0, width / 2 - ext.halfW)
    const shiftAmount = Math.min(xStep / 2, shiftCap)
    ys.forEach((y, row) => {
      const shift = row % 2 === 1 ? shiftAmount : 0
      xs.forEach((x) => {
        const px = x + shift
        if (px < -ext.halfW || px > width + ext.halfW) return
        push({ x: px, y, angle: 0 })
      })
    })
  } else if (pattern === "crisscross") {
    // Two families of straight diagonal lines, +45° and -45°. Copies sit on
    // the middle of each segment, so the crossings stay empty and the lines
    // read as an X from across the room.
    const tilt = 45
    const theta = (tilt * Math.PI) / 180
    const finalA = baseRotation + tilt
    const finalB = baseRotation - tilt
    const boxA = rotatedHalfExtents(markW, markH, finalA)
    const boxB = rotatedHalfExtents(markW, markH, finalB)
    const crossGap = Math.max(gap, Math.min(markW, markH) * 0.4)
    const alongA = projectExtent(finalA, tilt, markW / 2, markH / 2) * 2 + crossGap
    const alongB = projectExtent(finalB, -tilt, markW / 2, markH / 2) * 2 + crossGap
    const sepNeed = Math.max(boxA.halfW + boxB.halfW, boxA.halfH + boxB.halfH) + crossGap
    const tight = Math.max(alongA, alongB, sepNeed * Math.SQRT2)
    const step = room(tight) * 1.06
    const ux = Math.cos(theta)
    const uy = Math.sin(theta)
    const vx = Math.cos(-theta)
    const vy = Math.sin(-theta)
    const reach = Math.hypot(width, height) / 2 + step
    const n = Math.ceil(reach / step) + 2
    for (let i = -n; i <= n; i++) {
      for (let j = -n; j <= n; j++) {
        const ax = (i + 0.5) * step
        const ay = j * step
        push({
          x: centerX + ax * ux + ay * vx,
          y: centerY + ax * uy + ay * vy,
          angle: tilt,
        })
        const bx = i * step
        const by = (j + 0.5) * step
        push({
          x: centerX + bx * ux + by * vx,
          y: centerY + bx * uy + by * vy,
          angle: -tilt,
        })
      }
    }
    // A very open step can throw the whole lattice past the edges. Leave one
    // word on each diagonal so the photo is not blank, still clear of each other.
    if (candidates.length === 0) {
      const apart = Math.min(tight, Math.max(width, height) * 0.55)
      push({ x: centerX - apart / 2, y: centerY, angle: tilt })
      push({ x: centerX + apart / 2, y: centerY, angle: -tilt })
    }
  } else if (pattern === "diagonal" || pattern === "reverse-diagonal") {
    const tilt = pattern === "diagonal" ? -25 : 25
    const final = baseRotation + tilt
    const along = room(need(final, tilt))
    const across = room(need(final, tilt + 90)) * 0.92
    const rad = (tilt * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const diag = Math.hypot(width, height)
    const cols = Math.ceil(diag / along) + 2
    const rows = Math.ceil(diag / across) + 2
    for (let row = -rows; row <= rows; row++) {
      for (let col = -cols; col <= cols; col++) {
        const gx = (col + (row & 1 ? 0.5 : 0)) * along
        const gy = row * across
        push({
          x: centerX + gx * cos - gy * sin,
          y: centerY + gx * sin + gy * cos,
          angle: tilt,
        })
      }
    }
  } else if (pattern === "scattered") {
    const spread = 1.2 + 0.5 * Math.max(0, openness - 0.444)
    const cellW = (markW + gap) * spread
    const cellH = (markH + gap) * spread * 1.12
    const freeX = Math.max(0, (cellW - markW - gap) / 2)
    const freeY = Math.max(0, (cellH - markH - gap) / 2)
    const cols = Math.ceil(width / cellW) + 1
    const rows = Math.ceil(height / cellH) + 1
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (hash2(row, col, 1) < 0.12) continue
        const jx = hash2(row, col, 2) * 2 - 1
        const jy = hash2(row, col, 3) * 2 - 1
        // Do not clamp several cells onto the same edge. That piled copies
        // on the left and in the middle of the photo.
        const x = (col + 0.5) * cellW + jx * freeX
        const y = (row + 0.5) * cellH + jy * freeY
        push({ x, y, angle: 0 })
      }
    }
  } else if (pattern === "wave" || pattern === "zigzag") {
    const amp = pattern === "wave"
      ? Math.min(markH * 0.85, Math.max(10, spacing * 0.35))
      : Math.min(markH * 0.7, Math.max(8, spacing * 0.3))
    const slope = pattern === "wave" ? Math.atan((amp * 2 * Math.PI) / Math.max(width, 1)) : Math.atan((2 * amp) / Math.max(markW, 1))
    const slopeDeg = (slope * 180) / Math.PI
    const tilted = rotatedHalfExtents(markW, markH, baseRotation + slopeDeg)
    const flat = rotatedHalfExtents(markW, markH, baseRotation)
    const xStep = room(Math.max(tilted.halfW, flat.halfW) * 2 + gap)
    const yStep = room(Math.max(tilted.halfH, flat.halfH) * 2 + gap + 2 * amp)
    const freq = (2 * Math.PI * 1.6) / Math.max(width, 1)
    axisCenters(height, yStep).forEach((y0) => {
      axisCenters(width, xStep).forEach((x, col) => {
        if (pattern === "wave") {
          const y = y0 + amp * Math.sin(x * freq)
          const angle = (Math.atan(amp * freq * Math.cos(x * freq)) * 180) / Math.PI
          push({ x, y, angle, readingOrientationOnly: true })
        } else {
          const up = col % 2 === 0
          push({
            x,
            y: y0 + (up ? -amp : amp),
            angle: up ? slopeDeg : -slopeDeg,
            readingOrientationOnly: true,
          })
        }
      })
    })
  } else if (pattern === "diamond") {
    // Size the diamond around the chosen stamp. The words stay at full size
    // instead of being shrunk to fit a small cell.
    const edgeGap = Math.max(gap, markH * 0.4)
    const boxA = rotatedHalfExtents(markW, markH, baseRotation + 45)
    const boxB = rotatedHalfExtents(markW, markH, baseRotation - 45)
    const sep = Math.max(boxA.halfW + boxB.halfW, boxA.halfH + boxB.halfH) + edgeGap
    const alongEdge = Math.max(
      projectExtent(baseRotation + 45, 45, markW / 2, markH / 2),
      projectExtent(baseRotation - 45, -45, markW / 2, markH / 2),
    ) * 2 + edgeGap
    const edgeLen = room(Math.max(markW + edgeGap, alongEdge, sep * Math.SQRT2)) * 1.08
    const cell = edgeLen * Math.SQRT2
    const cols = Math.ceil(width / cell) + 1
    const rows = Math.ceil(height / cell) + 1
    const seen = new Set<string>()
    const quant = Math.max(2, edgeLen * 0.08)
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x0 = col * cell
        const y0 = row * cell
        const cx = x0 + cell / 2
        const cy = y0 + cell / 2
        const verts: [number, number][] = [
          [cx, y0],
          [x0 + cell, cy],
          [cx, y0 + cell],
          [x0, cy],
        ]
        for (let k = 0; k < 4; k++) {
          const ax = verts[k][0]
          const ay = verts[k][1]
          const bx = verts[(k + 1) % 4][0]
          const by = verts[(k + 1) % 4][1]
          const mx = (ax + bx) / 2
          const my = (ay + by) / 2
          if (mx < -edgeLen || my < -edgeLen || mx > width + edgeLen || my > height + edgeLen) continue
          const key = `${Math.round(mx / quant)}:${Math.round(my / quant)}`
          if (seen.has(key)) continue
          seen.add(key)
          let angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
          if (angle > 90) angle -= 180
          if (angle <= -90) angle += 180
          push({ x: mx, y: my, angle })
        }
      }
    }
  } else if (pattern === "honeycomb") {
    const sides = 6
    // Keep the shapes small enough that several of them fit, and shrink the
    // words to the edge instead of growing one giant cell around the words.
    const textFloor = Math.max(markH * 2.5, markW * 0.7)
    const edgeCap = Math.min(width, height) / 2.45 + spacing * 0.7
    const targetEdge = Math.min(edgeCap, textFloor + spacing * 0.9)
    const R = targetEdge
    const edgeLen = R
    let scale = Math.min(1, (edgeLen * 0.58) / markW)
    const apothem = (Math.sqrt(3) / 2) * R
    if (markH * scale > apothem * 0.62) scale = Math.min(scale, (apothem * 0.62) / markH)
    scale = Math.max(0.2, Math.min(1, scale))
    const seen = new Set<string>()
    const quant = Math.max(2, edgeLen * 0.1)
    const emit = (ax: number, ay: number, bx: number, by: number) => {
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2
      if (mx < -edgeLen || my < -edgeLen || mx > width + edgeLen || my > height + edgeLen) return
      const key = `${Math.round(mx / quant)}:${Math.round(my / quant)}`
      if (seen.has(key)) return
      seen.add(key)
      let angle = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
      if (angle > 90) angle -= 180
      if (angle <= -90) angle += 180
      push({ x: mx, y: my, angle, fontScale: scale })
    }
    const stepX = 1.5 * R
    const stepY = Math.sqrt(3) * R
    const cols = Math.ceil(width / stepX) + 3
    const rows = Math.ceil(height / stepY) + 3
    for (let col = -2; col < cols; col++) {
      for (let row = -2; row < rows; row++) {
        const x0 = col * stepX
        const y0 = row * stepY + (((col % 2) + 2) % 2) * (stepY / 2)
        const verts: [number, number][] = []
        for (let k = 0; k < sides; k++) {
          const a = (Math.PI / 3) * k
          verts.push([x0 + R * Math.cos(a), y0 + R * Math.sin(a)])
        }
        for (let k = 0; k < sides; k++) emit(verts[k][0], verts[k][1], verts[(k + 1) % sides][0], verts[(k + 1) % sides][1])
      }
    }
  } else if (pattern === "lattice") {
    const cellW = room(Math.max(markW * 0.92 + gap, markH * 2.8))
    const cellH = room(Math.max(markH * 2.8, markW * 0.48 + gap))
    let hScale = Math.min(1, (cellW * 0.5) / markW)
    let vScale = Math.min(1, (cellH * 0.5) / markW)
    // Shrink until a horizontal word and a vertical word clear at the corner.
    for (let guard = 0; guard < 12; guard++) {
      const hHalf = (markW * hScale) / 2
      const vHalf = (markW * vScale) / 2
      const hThick = (markH * hScale) / 2
      const vThick = (markH * vScale) / 2
      const clearX = cellW / 2 - hHalf - vThick >= gap
      const clearY = cellH / 2 - vHalf - hThick >= gap
      if (clearX && clearY) break
      hScale *= 0.9
      vScale *= 0.9
    }
    const seen = new Set<string>()
    const quant = Math.max(2, Math.min(cellW, cellH) * 0.08)
    const cols = Math.ceil(width / cellW) + 2
    const rows = Math.ceil(height / cellH) + 2
    const emit = (x: number, y: number, angle: number, fontScale: number) => {
      if (x < -cellW || y < -cellH || x > width + cellW || y > height + cellH) return
      const key = `${Math.round(x / quant)}:${Math.round(y / quant)}:${angle}`
      if (seen.has(key)) return
      seen.add(key)
      push({ x, y, angle, fontScale })
    }
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= cols; col++) {
        emit(col * cellW + cellW / 2, row * cellH, 0, hScale)
        emit(col * cellW, row * cellH + cellH / 2, -90, vScale)
      }
    }
  } else if (pattern === "radial") {
    const along = room(markW + gap)
    const across = Math.max(markH + gap, 12)
    // Fewer rays as Spacing opens up. The inner ring still starts far enough
    // out that neighboring copies clear each other.
    const clearance = (tryRays: number) => {
      const dTheta = (2 * Math.PI) / tryRays
      let need = across
      for (let i = 0; i < tryRays; i++) {
        const theta = (i * 2 * Math.PI) / tryRays
        let raw = (theta * 180) / Math.PI
        if (orientation === "readable") raw = upright(raw)
        const final = baseRotation + raw
        const rayDeg = (theta * 180) / Math.PI
        const halfAlong = projectExtent(final, rayDeg, markW / 2, markH / 2)
        const halfAcross = projectExtent(final, rayDeg + 90, markW / 2, markH / 2)
    const chord = halfAcross * 2 + gap * 2
        need = Math.max(need, halfAlong + chord / (2 * Math.sin(dTheta / 2)))
      }
      return need
    }
    let fitted = 4
    let r0 = across
    for (let tryRays = 16; tryRays >= 4; tryRays--) {
      const need = clearance(tryRays)
      fitted = tryRays
      r0 = need
      if (need <= maxRadius * 0.72) break
    }
    const rays = Math.max(1, Math.min(fitted, Math.round(fitted / (1 + 0.95 * Math.max(0, openness - 0.444)))))
    const outer = maxRadius + markH * 0.2
    const grown = r0 * (1 + 0.18 * Math.max(0, openness - 0.444))
    // Below the usual setting the ring stays inside the old limit. Above it,
    // the ring may move out toward the edge instead of freezing.
    const cap = maxRadius * (0.7 + 0.22 * Math.min(1, Math.max(0, openness - 1)))
    r0 = Math.min(Math.max(r0, grown), Math.max(r0, cap))
    for (let i = 0; i < rays; i++) {
      const theta = (i * 2 * Math.PI) / rays
      let raw = (theta * 180) / Math.PI
      if (orientation === "readable") raw = upright(raw)
      for (let r = r0; r <= outer; r += along) {
        push({
          x: centerX + r * Math.cos(theta),
          y: centerY + r * Math.sin(theta),
          angle: raw,
        })
      }
    }
  } else if (pattern === "spiral") {
    // Restored from 85c85bc, the last main commit before pull request 13.
    // Each copy is still bent along a perfect circle around the photo's center.
    // The old step ignored the Spacing slider until it was huge, because the
    // text size was used as a floor. The gap between circles and the gap along
    // each circle now both follow the slider. The usual setting keeps the
    // original distance between circles. The along-circle gap stays just wider
    // than the word, then opens up as Spacing goes up.
    const sizeScale = Math.sqrt(Math.max(width, 1) * Math.max(height, 1)) / 800
    const openness = spacing / Math.max(1, 90 * sizeScale)
    const ringStep = markH * (1.15 + 0.85 * openness)
    const arcStep = markW * (1.08 + 0.72 * Math.max(0, openness - 0.444))
    const b = ringStep / (2 * Math.PI)
    // Start where the curve is wide enough for the text to bend along it
    // (radius >= textWidth/2.5 keeps the arc under the curved-render limit).
    let phi = Math.max(ringStep * 0.55, markW / 2.5) / b
    const arm: GridPoint[] = []
    for (;;) {
      const r = b * phi
      if (r > maxRadius + ringStep) break
      const x = centerX + r * Math.cos(phi)
      const y = centerY + r * Math.sin(phi)
      if (x >= -markW / 2 && x <= width + markW / 2 && y >= -markH && y <= height + markH) {
        arm.push({ x, y, angle: 0, arc: { cx: centerX, cy: centerY, r } })
      }
      phi += arcStep / Math.max(r, 1)
    }
    if (!SPIRAL_SKIP_OVERLAP) return arm
    const kept: GridPoint[] = []
    const placed: StampBox[] = []
    for (const pt of arm) {
      const letters = copyFootprints(pt, markW, markH, baseRotation, stackedMode, orientation, charWidths)
      if (letters.some((letter) => placed.some((other) => boxesOverlap(letter, other, gap)))) continue
      kept.push(pt)
      placed.push(...letters)
    }
    return kept
  } else if (pattern === "concentric") {
    // Same centered circles as the original rings, with a little extra room
    // along each ring and between rings. Rings that are too small for a
    // curved word are skipped so a straight stamp does not sit in the middle.
    const ringStep = room(markH + gap * 2.4)
    const arcGap = Math.max(gap * 1.8, markH * 0.36)
    const baseSlot = markW + Math.max(arcGap, markH * 0.9)
    const slot = room(baseSlot)
    const first = Math.max(ringStep, markW * 0.78, markH * 2.2)
    let ring = 0
    for (let r = first; r <= maxRadius + ringStep * 0.2; r += ringStep, ring++) {
      if (markW / r > Math.PI * 0.72) continue
      const circ = 2 * Math.PI * r
      let n = Math.floor(circ / slot)
      if (n < 2 && Math.floor(circ / baseSlot) >= 2) n = 2
      if (n < 2) continue
      const offset = ring % 2 === 1 ? Math.PI / n : 0
      for (let k = 0; k < n; k++) {
        const theta = (k * 2 * Math.PI) / n + offset
        // One tangent all the way around. Flipping the lower half bends those
        // copies the other way and breaks the circle.
        const tangent = (theta * 180) / Math.PI + 90
        push({
          x: centerX + r * Math.cos(theta),
          y: centerY + r * Math.sin(theta),
          angle: tangent,
          arc: { cx: centerX, cy: centerY, r, continuous: true },
        })
      }
    }
  } else if (pattern === "border") {
    const margin = Math.max(8, gap * 0.45)
    const edgeY = margin + markH / 2
    const edgeX = margin + markH / 2
    const step = room(markW + gap)
    const hLo = edgeX + markH / 2 + gap + markW / 2
    const hHi = width - hLo
    const vLo = edgeY + markH / 2 + gap + markW / 2
    const vHi = height - vLo
    const hRun = hHi >= hLo ? axisCenters(hHi - hLo, step).map((v) => v + hLo) : []
    const vRun = vHi >= vLo ? axisCenters(vHi - vLo, step).map((v) => v + vLo) : []
    if (hRun.length === 0 && width > markW) hRun.push(width / 2)
    if (vRun.length === 0 && height > markW + edgeY * 2) vRun.push(height / 2)
    for (const x of hRun) {
      push({ x, y: edgeY, angle: 0 })
      push({ x, y: height - edgeY, angle: 0 })
    }
    for (const y of vRun) {
      push({ x: edgeX, y, angle: -90, readingOrientationOnly: true })
      push({ x: width - edgeX, y, angle: 90, readingOrientationOnly: true })
    }
  }

  const kept: GridPoint[] = []
  const placed: StampBox[] = []
  for (const pt of candidates) {
    const boxes = copyFootprints(pt, markW, markH, baseRotation, stackedMode, orientation, charWidths)
    if (boxes.some((box) => placed.some((other) => boxesOverlap(box, other, gap)))) continue
    kept.push(pt)
    placed.push(...boxes)
  }
  return kept
}

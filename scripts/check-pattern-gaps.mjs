import { createServer } from "vite"

const patterns = [
  "diagonal", "reverse-diagonal", "crisscross", "diamond", "grid", "checkerboard",
  "scattered", "wave", "zigzag", "brick", "honeycomb", "lattice", "radial",
  "spiral", "concentric", "border",
]
const photos = [
  ["square", 1400, 1400],
  ["wide", 2048, 1710],
  ["tall", 1152, 1955],
]
const densities = [40, 90, 220, 400]
const glyphRatios = [52, 47.6, 47.6, 30.4, 21.7, 47.6, 43.4, 43.4, 26]
const glyphSum = glyphRatios.reduce((sum, n) => sum + n, 0)

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true },
})
const layout = await server.ssrLoadModule("/src/lib/pattern-layout.ts")
const { getPatternPoints, copiesAreClear, MIN_COPY_GAP_RATIO } = layout

const failures = []
for (const [name, width, height] of photos) {
  const sizeScale = Math.sqrt(width * height) / 800
  const fontPx = Math.max(12, Math.round(48 * sizeScale))
  const markH = fontPx
  const markW = fontPx * 4.5
  const glyphs = glyphRatios.map((part) => (part / glyphSum) * markW)
  const square = fontPx * 2.4
  for (const pattern of patterns) {
    for (const density of densities) {
      const spacing = density * sizeScale
      const minGap = Math.max(4, markH * MIN_COPY_GAP_RATIO)
      for (const [kind, w, h, chars] of [
        ["text", markW, markH, glyphs],
        ["logo", square, square, []],
      ]) {
        const points = getPatternPoints(width, height, pattern, spacing, w, h, "readable", false, 0, chars)
        const clear = copiesAreClear(points, w, h, 0, false, "readable", chars, minGap)
        if (!clear) failures.push(`${pattern} ${name} ${kind} spacing ${density} copies ${points.length}`)
      }
    }
  }
}

await server.close()
if (failures.length) {
  console.error(failures.join("\n"))
  console.error(`\n${failures.length} overlap failures`)
  process.exit(1)
}
console.log(`clear: ${patterns.length} patterns, ${photos.length} photos, ${densities.length} spacings, text and logo`)

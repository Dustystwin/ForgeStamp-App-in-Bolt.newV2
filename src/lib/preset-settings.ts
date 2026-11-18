import {
  COLOR_PRESETS,
  DEFAULT_EDITOR_STATE,
  DENSITY_MAX,
  DENSITY_MIN,
  FONT_OPTIONS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  OPACITY_MAX,
  OPACITY_MIN,
  PATTERN_OPTIONS,
  PLACEMENT_GRID,
  ROTATION_MAX,
  ROTATION_MIN,
  STAMP_SIZE_MAX,
  STAMP_SIZE_MIN,
  TEXT_DIRECTION_OPTIONS,
  isWatermarkMode,
  type CoverageMode,
  type CurveOrientation,
  type EditorState,
  type ExportFormat,
  type Pattern,
  type Placement,
  type TextDirection,
} from "@/lib/editor-types"

/** Saved with a preset. The logo file stays on this device and is not included. */
export interface PresetSettings {
  watermarkMode: EditorState["watermarkMode"]
  watermarkText: string
  fontFamily: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  placement: Placement
  textDirection: TextDirection
  coverageMode: CoverageMode
  pattern: Pattern
  density: number
  curveOrientation: CurveOrientation
  stampSize: number
  qrUrl: string
  qrColor: string
  exportFormat: ExportFormat
}

const PLACEMENTS = new Set<string>(PLACEMENT_GRID.map((item) => item.value))
const PATTERNS = new Set<string>(PATTERN_OPTIONS.map((item) => item.value))
const DIRECTIONS = new Set<string>(TEXT_DIRECTION_OPTIONS.map((item) => item.value))
const FONTS = new Set<string>(FONT_OPTIONS.map((item) => item.value))
const COLORS = new Set<string>(COLOR_PRESETS.map((item) => item.value))

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, Math.round(number)))
}

function pick<T extends string>(value: unknown, allowed: Set<string>, fallback: T): T {
  return typeof value === "string" && allowed.has(value) ? (value as T) : fallback
}

function hexColor(value: unknown, fallback: string): string {
  if (typeof value === "string" && COLORS.has(value)) return value
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) return value.toUpperCase()
  return fallback
}

function shortText(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback
  const trimmed = value.trim()
  if (!trimmed) return fallback
  return trimmed.slice(0, max)
}

export function isExportFormat(value: unknown): value is ExportFormat {
  return value === "png" || value === "jpeg" || value === "webp"
}

export function settingsFromEditor(state: EditorState): PresetSettings {
  return {
    watermarkMode: state.watermarkMode,
    watermarkText: state.watermarkText,
    fontFamily: state.fontFamily,
    fontSize: state.fontSize,
    color: state.color,
    opacity: state.opacity,
    rotation: state.rotation,
    placement: state.placement,
    textDirection: state.textDirection,
    coverageMode: state.coverageMode,
    pattern: state.pattern,
    density: state.density,
    curveOrientation: state.curveOrientation,
    stampSize: state.stampSize,
    qrUrl: state.qrUrl,
    qrColor: state.qrColor,
    exportFormat: state.exportFormat,
  }
}

export function parsePresetSettings(raw: unknown): PresetSettings | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const defaults = DEFAULT_EDITOR_STATE
  const coverage: CoverageMode = row.coverageMode === "full" ? "full" : "single"
  const curve: CurveOrientation = row.curveOrientation === "natural" ? "natural" : "readable"
  return {
    watermarkMode: isWatermarkMode(row.watermarkMode) ? row.watermarkMode : defaults.watermarkMode,
    watermarkText: shortText(row.watermarkText, defaults.watermarkText, 200),
    fontFamily: pick(row.fontFamily, FONTS, defaults.fontFamily),
    fontSize: clampNumber(row.fontSize, FONT_SIZE_MIN, FONT_SIZE_MAX, defaults.fontSize),
    color: hexColor(row.color, defaults.color),
    opacity: clampNumber(row.opacity, OPACITY_MIN, OPACITY_MAX, defaults.opacity),
    rotation: clampNumber(row.rotation, ROTATION_MIN, ROTATION_MAX, defaults.rotation),
    placement: pick(row.placement, PLACEMENTS, defaults.placement),
    textDirection: pick(row.textDirection, DIRECTIONS, defaults.textDirection),
    coverageMode: coverage,
    pattern: pick(row.pattern, PATTERNS, defaults.pattern),
    density: clampNumber(row.density, DENSITY_MIN, DENSITY_MAX, defaults.density),
    curveOrientation: curve,
    stampSize: clampNumber(row.stampSize, STAMP_SIZE_MIN, STAMP_SIZE_MAX, defaults.stampSize),
    qrUrl: typeof row.qrUrl === "string" ? row.qrUrl.trim().slice(0, 2000) : "",
    qrColor: hexColor(row.qrColor, defaults.qrColor),
    exportFormat: isExportFormat(row.exportFormat) ? row.exportFormat : "png",
  }
}

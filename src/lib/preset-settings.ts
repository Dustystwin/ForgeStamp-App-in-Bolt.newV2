import {
  COLOR_PRESETS,
  DEFAULT_EDITOR_STATE,
  DENSITY_MAX,
  DENSITY_MIN,
  EXPORT_QUALITY_MAX,
  EXPORT_QUALITY_MIN,
  FONT_OPTIONS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  OPACITY_MAX,
  OPACITY_MIN,
  OUTLINE_WIDTH_MAX,
  OUTLINE_WIDTH_MIN,
  PATTERN_OPTIONS,
  PLACEMENT_GRID,
  ROTATION_MAX,
  ROTATION_MIN,
  SHADOW_BLUR_MAX,
  SHADOW_BLUR_MIN,
  SHADOW_OFFSET_MAX,
  SHADOW_OFFSET_MIN,
  STAMP_SIZE_MAX,
  STAMP_SIZE_MIN,
  TEXT_DIRECTION_OPTIONS,
  isCropAspect,
  isDateStampFormat,
  isWatermarkMode,
  type CoverageMode,
  type CropAspect,
  type CurveOrientation,
  type DateStampFormat,
  type EditorState,
  type ExportFormat,
  type Pattern,
  type Placement,
  type TextDirection,
} from "@/lib/editor-types"

/** Saved with a preset. The logo file and signature drawing stay on this device. */
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
  exportLongEdge: number
  exportQuality: number
  outlineWidth: number
  outlineColor: string
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  dateStamp: DateStampFormat
  cropAspect: CropAspect
  quarterTurns: number
  emoji: string
  stickerId: string
  freeX: number | null
  freeY: number | null
  gradientOn: boolean
  gradientA: string
  gradientB: string
  gradientC: string
  gradientAngle: number
  grayscale: boolean
  keepInfo: boolean
  layers?: import("@/lib/mark-layer").MarkLayer[]
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
    exportLongEdge: state.exportLongEdge,
    exportQuality: state.exportQuality,
    outlineWidth: state.outlineWidth,
    outlineColor: state.outlineColor,
    shadowEnabled: state.shadowEnabled,
    shadowColor: state.shadowColor,
    shadowBlur: state.shadowBlur,
    shadowOffsetX: state.shadowOffsetX,
    shadowOffsetY: state.shadowOffsetY,
    dateStamp: state.dateStamp,
    cropAspect: state.cropAspect,
    quarterTurns: state.quarterTurns,
    emoji: state.emoji,
    stickerId: state.stickerId,
    freeX: state.freeX,
    freeY: state.freeY,
    gradientOn: state.gradientOn,
    gradientA: state.gradientA,
    gradientB: state.gradientB,
    gradientC: state.gradientC,
    gradientAngle: state.gradientAngle,
    grayscale: state.grayscale,
    keepInfo: state.keepInfo,
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
    exportLongEdge: [0, 1080, 1600, 2048].includes(Number(row.exportLongEdge))
      ? Number(row.exportLongEdge)
      : 0,
    exportQuality: clampNumber(row.exportQuality, EXPORT_QUALITY_MIN, EXPORT_QUALITY_MAX, defaults.exportQuality),
    outlineWidth: clampNumber(row.outlineWidth, OUTLINE_WIDTH_MIN, OUTLINE_WIDTH_MAX, defaults.outlineWidth),
    outlineColor: hexColor(row.outlineColor, defaults.outlineColor),
    shadowEnabled: row.shadowEnabled === true,
    shadowColor: hexColor(row.shadowColor, defaults.shadowColor),
    shadowBlur: clampNumber(row.shadowBlur, SHADOW_BLUR_MIN, SHADOW_BLUR_MAX, defaults.shadowBlur),
    shadowOffsetX: clampNumber(row.shadowOffsetX, SHADOW_OFFSET_MIN, SHADOW_OFFSET_MAX, defaults.shadowOffsetX),
    shadowOffsetY: clampNumber(row.shadowOffsetY, SHADOW_OFFSET_MIN, SHADOW_OFFSET_MAX, defaults.shadowOffsetY),
    dateStamp: isDateStampFormat(row.dateStamp) ? row.dateStamp : "off",
    cropAspect: isCropAspect(row.cropAspect) ? row.cropAspect : "original",
    quarterTurns: clampNumber(row.quarterTurns, 0, 3, 0),
    emoji: typeof row.emoji === "string" && row.emoji ? row.emoji.slice(0, 8) : defaults.emoji,
    stickerId: typeof row.stickerId === "string" && row.stickerId ? row.stickerId.slice(0, 40) : defaults.stickerId,
    freeX: typeof row.freeX === "number" && Number.isFinite(row.freeX) ? row.freeX : null,
    freeY: typeof row.freeY === "number" && Number.isFinite(row.freeY) ? row.freeY : null,
    gradientOn: row.gradientOn === true,
    gradientA: hexColor(row.gradientA, defaults.gradientA),
    gradientB: hexColor(row.gradientB, defaults.gradientB),
    gradientC: typeof row.gradientC === "string" ? hexColor(row.gradientC, "") : "",
    gradientAngle: clampNumber(row.gradientAngle, 0, 360, defaults.gradientAngle),
    grayscale: row.grayscale === true,
    keepInfo: row.keepInfo === true,
    layers: Array.isArray(row.layers) ? row.layers as PresetSettings["layers"] : undefined,
  }
}

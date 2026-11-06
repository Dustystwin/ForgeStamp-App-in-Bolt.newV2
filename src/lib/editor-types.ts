export type Placement =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right"

export type TextDirection = "horizontal" | "vertical-down" | "vertical-up"

export type CurveOrientation = "readable" | "natural"

export type CoverageMode = "single" | "full"

export type WatermarkMode = "text" | "logo" | "qr"

export function isWatermarkMode(value: unknown): value is WatermarkMode {
  return value === "text" || value === "logo" || value === "qr"
}

export type Pattern =
  | "diagonal"
  | "reverse-diagonal"
  | "crisscross"
  | "diamond"
  | "grid"
  | "checkerboard"
  | "scattered"
  | "wave"
  | "zigzag"
  | "brick"
  | "honeycomb"
  | "lattice"
  | "radial"
  | "spiral"
  | "concentric"
  | "border"

export interface EditorState {
  image: File | null
  imagePreviewUrl: string | null
  watermarkMode: WatermarkMode
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
  // Pixel size of a logo or QR stamp before it is scaled to the photo.
  stampSize: number
  qrUrl: string
  // Separate from text color so a scannable black QR does not recolor the words.
  qrColor: string
  // Session-only. The logo file is not stored with saved images.
  logoPreviewUrl: string | null
  logoName: string | null
  error: string | null
}

export const FREE_FONTS = [
  { value: "Inter", label: "Inter" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Courier New", label: "Courier New" },
  { value: "Impact", label: "Impact" },
] as const

export const PRO_FONTS = [
  { value: "Montserrat", label: "Montserrat" },
  { value: "Poppins", label: "Poppins" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Lora", label: "Lora" },
  { value: "Merriweather", label: "Merriweather" },
  { value: "Dancing Script", label: "Dancing Script" },
  { value: "Caveat", label: "Caveat" },
  { value: "Pacifico", label: "Pacifico" },
] as const

// Keep FONT_OPTIONS for any legacy reference
export const FONT_OPTIONS = [...FREE_FONTS, ...PRO_FONTS]

export const FREE_COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#FFFFFF", label: "White" },
  { value: "#FF8A00", label: "Orange" },
  { value: "#18B66A", label: "Green" },
  { value: "#6B7280", label: "Gray" },
] as const

export const PRO_COLORS = [
  { value: "#FF5E62", label: "Coral" },
  { value: "#2DD4BF", label: "Teal" },
  { value: "#FBBF24", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#F97316", label: "Orange Alt" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#22C55E", label: "Lime" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#8B5CF6", label: "Violet" },
  { value: "#EC4899", label: "Pink" },
  { value: "#A855F7", label: "Purple" },
  { value: "#64748B", label: "Slate" },
  { value: "#111827", label: "Dark" },
] as const

// Keep COLOR_PRESETS for legacy reference
export const COLOR_PRESETS = [...FREE_COLORS, ...PRO_COLORS]

export const PLACEMENT_GRID: { value: Placement; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-center", label: "Top Center" },
  { value: "top-right", label: "Top Right" },
  { value: "middle-left", label: "Middle Left" },
  { value: "center", label: "Center" },
  { value: "middle-right", label: "Middle Right" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-center", label: "Bottom Center" },
  { value: "bottom-right", label: "Bottom Right" },
]

// Keep PLACEMENT_OPTIONS for legacy reference
export const PLACEMENT_OPTIONS = PLACEMENT_GRID

export const PATTERN_OPTIONS: { value: Pattern; label: string }[] = [
  { value: "diagonal", label: "Diagonal" },
  { value: "reverse-diagonal", label: "Reverse Diagonal" },
  { value: "crisscross", label: "Crisscross" },
  { value: "diamond", label: "Diamond" },
  { value: "grid", label: "Grid" },
  { value: "checkerboard", label: "Checkerboard" },
  { value: "scattered", label: "Scattered" },
  { value: "wave", label: "Wave" },
  { value: "zigzag", label: "Zigzag" },
  { value: "brick", label: "Brick" },
  { value: "honeycomb", label: "Honeycomb" },
  { value: "lattice", label: "Lattice" },
  { value: "radial", label: "Radial" },
  { value: "spiral", label: "Spiral" },
  { value: "concentric", label: "Concentric" },
  { value: "border", label: "Border" },
]

export const TEXT_DIRECTION_OPTIONS: { value: TextDirection; label: string }[] = [
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical-down", label: "Vertical Down" },
  { value: "vertical-up", label: "Vertical Up" },
]

export const DEFAULT_EDITOR_STATE: Omit<EditorState, "image" | "imagePreviewUrl" | "logoPreviewUrl" | "logoName" | "error"> = {
  watermarkMode: "text",
  watermarkText: "Your Text",
  fontFamily: "Inter",
  fontSize: 48,
  color: "#FF8A00",
  opacity: 65,
  rotation: 0,
  placement: "center",
  textDirection: "horizontal",
  coverageMode: "single",
  pattern: "diagonal",
  density: 90,
  curveOrientation: "readable",
  stampSize: 112,
  qrUrl: "",
  qrColor: "#000000",
}

export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"]
export const MAX_FILE_SIZE_MB = 15
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const LOGO_MAX_FILE_SIZE_MB = 8
export const LOGO_MAX_FILE_SIZE_BYTES = LOGO_MAX_FILE_SIZE_MB * 1024 * 1024
export const LOGO_MAX_EDGE_PX = 8000

export const FONT_SIZE_MIN = 12
export const FONT_SIZE_MAX = 160
export const STAMP_SIZE_MIN = 24
export const STAMP_SIZE_MAX = 240
export const OPACITY_MIN = 0
export const OPACITY_MAX = 100
export const ROTATION_MIN = -180
export const ROTATION_MAX = 180
export const DENSITY_MIN = 40
export const DENSITY_MAX = 400

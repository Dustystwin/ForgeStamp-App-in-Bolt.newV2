import { DEFAULT_EDITOR_STATE, type EditorState } from "@/lib/editor-types"

export interface MarkSnap {
  watermarkMode: EditorState["watermarkMode"]
  watermarkText: string
  emoji: string
  stickerId: string
  fontFamily: string
  fontSize: number
  color: string
  opacity: number
  rotation: number
  placement: EditorState["placement"]
  freeX: number | null
  freeY: number | null
  textDirection: EditorState["textDirection"]
  coverageMode: EditorState["coverageMode"]
  pattern: EditorState["pattern"]
  density: number
  curveOrientation: EditorState["curveOrientation"]
  stampSize: number
  qrUrl: string
  qrColor: string
  outlineWidth: number
  outlineColor: string
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  dateStamp: EditorState["dateStamp"]
  gradientOn: boolean
  gradientA: string
  gradientB: string
  gradientC: string
  gradientAngle: number
}

export interface MarkLayer {
  id: string
  name: string
  hidden: boolean
  locked: boolean
  snap: MarkSnap
}

export function blankSnap(partial: Partial<MarkSnap> = {}): MarkSnap {
  return {
    watermarkMode: DEFAULT_EDITOR_STATE.watermarkMode,
    watermarkText: DEFAULT_EDITOR_STATE.watermarkText,
    emoji: "📷",
    stickerId: "heart",
    fontFamily: DEFAULT_EDITOR_STATE.fontFamily,
    fontSize: DEFAULT_EDITOR_STATE.fontSize,
    color: DEFAULT_EDITOR_STATE.color,
    opacity: DEFAULT_EDITOR_STATE.opacity,
    rotation: DEFAULT_EDITOR_STATE.rotation,
    placement: DEFAULT_EDITOR_STATE.placement,
    freeX: null,
    freeY: null,
    textDirection: DEFAULT_EDITOR_STATE.textDirection,
    coverageMode: DEFAULT_EDITOR_STATE.coverageMode,
    pattern: DEFAULT_EDITOR_STATE.pattern,
    density: DEFAULT_EDITOR_STATE.density,
    curveOrientation: DEFAULT_EDITOR_STATE.curveOrientation,
    stampSize: DEFAULT_EDITOR_STATE.stampSize,
    qrUrl: DEFAULT_EDITOR_STATE.qrUrl,
    qrColor: DEFAULT_EDITOR_STATE.qrColor,
    outlineWidth: DEFAULT_EDITOR_STATE.outlineWidth,
    outlineColor: DEFAULT_EDITOR_STATE.outlineColor,
    shadowEnabled: DEFAULT_EDITOR_STATE.shadowEnabled,
    shadowColor: DEFAULT_EDITOR_STATE.shadowColor,
    shadowBlur: DEFAULT_EDITOR_STATE.shadowBlur,
    shadowOffsetX: DEFAULT_EDITOR_STATE.shadowOffsetX,
    shadowOffsetY: DEFAULT_EDITOR_STATE.shadowOffsetY,
    dateStamp: DEFAULT_EDITOR_STATE.dateStamp,
    gradientOn: false,
    gradientA: "#FF8A00",
    gradientB: "#FFFFFF",
    gradientC: "",
    gradientAngle: 90,
    ...partial,
  }
}

export function layerName(mode: MarkSnap["watermarkMode"]): string {
  if (mode === "logo") return "Logo"
  if (mode === "qr") return "QR"
  if (mode === "signature") return "Signature"
  if (mode === "emoji") return "Emoji"
  if (mode === "sticker") return "Sticker"
  return "Text"
}

export function createLayer(partial: Partial<MarkSnap> = {}, name?: string): MarkLayer {
  const snap = blankSnap(partial)
  return {
    id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: name ?? layerName(snap.watermarkMode),
    hidden: false,
    locked: false,
    snap,
  }
}

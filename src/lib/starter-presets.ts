import { DEFAULT_EDITOR_STATE } from "@/lib/editor-types"
import type { PresetSettings } from "@/lib/preset-settings"

export interface StarterPreset {
  id: string
  name: string
  blurb: string
  settings: PresetSettings
}

function look(id: string, name: string, blurb: string, partial: Partial<PresetSettings>): StarterPreset {
  return {
    id,
    name,
    blurb,
    settings: { ...DEFAULT_EDITOR_STATE, ...partial },
  }
}

/** Built-in looks. They are not saved presets and do not count toward a plan's cap. */
export const STARTER_PRESETS: StarterPreset[] = [
  look("corner-text", "Corner text", "Your Text in the bottom right", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "single",
    placement: "bottom-right",
  }),
  look("corner-logo", "Corner logo", "A logo in the bottom right", {
    watermarkMode: "logo",
    coverageMode: "single",
    placement: "bottom-right",
  }),
  look("qr-corner", "QR corner", "A QR code in the bottom right", {
    watermarkMode: "qr",
    coverageMode: "single",
    placement: "bottom-right",
  }),
  look("diagonal", "Diagonal", "Your Text repeated on a diagonal", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "full",
    pattern: "diagonal",
  }),
  look("grid", "Grid", "Your Text in even rows", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "full",
    pattern: "grid",
  }),
  look("border", "Border", "Your Text around the edges", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "full",
    pattern: "border",
  }),
  look("date", "Date stamp", "Your Text with today's date", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "single",
    placement: "bottom-center",
    dateStamp: "medium",
  }),
  look("soft-shadow", "Soft shadow", "Your Text with a drop shadow", {
    watermarkMode: "text",
    watermarkText: "Your Text",
    coverageMode: "single",
    placement: "center",
    shadowEnabled: true,
    shadowBlur: 10,
    shadowOffsetX: 2,
    shadowOffsetY: 4,
  }),
]

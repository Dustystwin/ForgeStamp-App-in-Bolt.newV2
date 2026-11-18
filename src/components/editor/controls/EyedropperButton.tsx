import { Pipette } from "lucide-react"

interface EyeDropperWindow {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
}

export async function pickScreenColor(): Promise<string | null> {
  const eye = (window as EyeDropperWindow).EyeDropper
  if (!eye) return null
  try {
    const result = await new eye().open()
    return result.sRGBHex
  } catch {
    return null
  }
}

export function EyedropperButton({ onPick, onFallback }: { onPick: (hex: string) => void; onFallback: () => void }) {
  return (
    <button
      type="button"
      aria-label="Pick a color from the screen"
      title="Pick a color"
      className="grid size-8 place-items-center rounded-md border border-border/60 bg-muted/40"
      onClick={() => {
        void pickScreenColor().then((hex) => {
          if (hex) onPick(hex)
          else onFallback()
        })
      }}
    >
      <Pipette className="size-3.5" />
    </button>
  )
}

import { RotateCw } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { CropAspect } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface FrameControlProps {
  aspect: CropAspect
  quarterTurns: number
  onAspectChange: (value: CropAspect) => void
  onQuarterTurnsChange: (value: number) => void
}

const ASPECTS: { value: CropAspect; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "3:4", label: "3:4" },
  { value: "2:3", label: "2:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
]

export function FrameControl({ aspect, quarterTurns, onAspectChange, onQuarterTurnsChange }: FrameControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Crop and rotate</Label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Crop shape">
        {ASPECTS.map((option) => {
          const selected = aspect === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onAspectChange(option.value)}
              className={cn(
                "min-h-9 rounded-md border px-2.5 py-1 text-[11px] font-medium",
                selected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <button
        type="button"
        onClick={() => onQuarterTurnsChange((quarterTurns + 1) % 4)}
        className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-[11px] font-medium text-foreground hover:bg-muted"
      >
        <RotateCw className="size-3.5" />
        Rotate 90°{quarterTurns ? ` · ${quarterTurns * 90}°` : ""}
      </button>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Crops from the center before the watermark. A batch uses the same crop on every photo.
      </p>
    </div>
  )
}

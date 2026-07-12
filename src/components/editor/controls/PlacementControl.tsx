import { Label } from "@/components/ui/label"
import { PLACEMENT_GRID, type Placement } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface PlacementControlProps {
  value: Placement
  onChange: (value: Placement) => void
}

const SHORT_LABELS: Record<Placement, string> = {
  "top-left":      "TL",
  "top-center":    "TC",
  "top-right":     "TR",
  "middle-left":   "ML",
  "center":        "C",
  "middle-right":  "MR",
  "bottom-left":   "BL",
  "bottom-center": "BC",
  "bottom-right":  "BR",
}

export function PlacementControl({ value, onChange }: PlacementControlProps) {
  const selectedLabel = PLACEMENT_GRID.find((o) => o.value === value)?.label ?? ""

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Placement</Label>
      <div
        role="group"
        aria-label="Watermark placement"
        className="grid grid-cols-3 gap-1 w-[108px]"
      >
        {PLACEMENT_GRID.map((option) => {
          const isSelected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-label={`${option.label}${isSelected ? " (selected)" : ""}`}
              aria-pressed={isSelected}
              title={option.label}
              className={cn(
                "h-8 w-8 rounded-md border text-[10px] font-semibold tracking-tight transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary/20 border-primary text-primary shadow-sm"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
              )}
            >
              {SHORT_LABELS[option.value]}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">{selectedLabel}</p>
    </div>
  )
}

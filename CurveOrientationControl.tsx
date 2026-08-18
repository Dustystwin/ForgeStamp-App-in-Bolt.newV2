import { Label } from "@/components/ui/label"
import type { CurveOrientation } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface CurveOrientationControlProps {
  value: CurveOrientation
  onChange: (value: CurveOrientation) => void
}

const OPTIONS: { value: CurveOrientation; label: string; description: string }[] = [
  {
    value: "readable",
    label: "Always Readable",
    description: "Words flip on the lower half so they never appear upside down",
  },
  {
    value: "natural",
    label: "Follow the Shape",
    description: "Words flow continuously around the shape, even upside down at the bottom",
  },
]

// Shown for circular patterns (Radial, Spiral, Concentric): choose whether
// words stay right-side-up or flow naturally around the shape.
export function CurveOrientationControl({ value, onChange }: CurveOrientationControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Word Direction</Label>
      <div className="flex gap-1.5" role="group" aria-label="Word direction">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              aria-label={opt.label}
              title={opt.description}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { Label } from "@/components/ui/label"
import type { CoverageMode } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface CoverageModeControlProps {
  value: CoverageMode
  onChange: (value: CoverageMode) => void
}

const OPTIONS: { value: CoverageMode; label: string; description: string }[] = [
  { value: "single", label: "Single", description: "One watermark at the chosen placement" },
  { value: "full", label: "Full Coverage", description: "Repeating pattern across the image" },
]

export function CoverageModeControl({ value, onChange }: CoverageModeControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Coverage Mode</Label>
      <div className="flex gap-1.5" role="group" aria-label="Coverage mode">
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

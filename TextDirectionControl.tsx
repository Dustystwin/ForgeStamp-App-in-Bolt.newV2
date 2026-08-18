import { Label } from "@/components/ui/label"
import { TEXT_DIRECTION_OPTIONS, type TextDirection } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface TextDirectionControlProps {
  value: TextDirection
  onChange: (value: TextDirection) => void
}

export function TextDirectionControl({ value, onChange }: TextDirectionControlProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-xs font-medium">Text Direction</Label>
        <span className="text-[9px] text-muted-foreground/60">
          Use Rotation to add angle
        </span>
      </div>
      <div className="flex gap-1.5" role="group" aria-label="Text direction">
        {TEXT_DIRECTION_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              aria-label={opt.label}
              title={opt.label}
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

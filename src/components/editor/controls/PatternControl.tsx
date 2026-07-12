import { Label } from "@/components/ui/label"
import { PATTERN_OPTIONS, type Pattern } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface PatternControlProps {
  value: Pattern
  onChange: (value: Pattern) => void
}

export function PatternControl({ value, onChange }: PatternControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Pattern</Label>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Coverage pattern">
        {PATTERN_OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              aria-label={opt.label}
              className={cn(
                "rounded-md border px-2.5 py-1 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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

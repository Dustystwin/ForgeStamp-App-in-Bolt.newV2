import { Label } from "@/components/ui/label"
import type { DateStampFormat } from "@/lib/editor-types"
import { formatDateStamp } from "@/lib/text-style"
import { cn } from "@/lib/utils"

interface DateStampControlProps {
  value: DateStampFormat
  onChange: (value: DateStampFormat) => void
}

const OPTIONS: { value: DateStampFormat }[] = [
  { value: "off" },
  { value: "medium" },
  { value: "numeric" },
  { value: "year" },
]

export function DateStampControl({ value, onChange }: DateStampControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Date stamp</Label>
      <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="Date stamp">
        {OPTIONS.map((option) => {
          const selected = value === option.value
          const sample = option.value === "off" ? "Off" : formatDateStamp(option.value)
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-9 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {option.value === "off" ? "Off" : sample}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Adds today's date after your words. The sample above is the shape of each format.
      </p>
    </div>
  )
}

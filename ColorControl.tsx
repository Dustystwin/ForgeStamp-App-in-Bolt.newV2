import { Label } from "@/components/ui/label"
import { FREE_COLORS, PRO_COLORS } from "@/lib/editor-types"
import { BUILDER_MODE } from "@/lib/builder-mode"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { toast } from "sonner"

interface ColorControlProps {
  value: string
  onChange: (value: string) => void
}

export function ColorControl({ value, onChange }: ColorControlProps) {
  const handleProClick = (colorValue: string) => {
    if (BUILDER_MODE) {
      onChange(colorValue)
    } else {
      toast("Pro colors will be available with paid plans.")
    }
  }

  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-medium">Color</Label>

      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">Free</p>
        <div className="flex flex-wrap gap-2">
          {FREE_COLORS.map((preset) => {
            const isSelected = value === preset.value
            const isLight = preset.value === "#FFFFFF" || preset.value === "#6B7280"
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange(preset.value)}
                aria-label={`${preset.label}${isSelected ? " (selected)" : ""}`}
                aria-pressed={isSelected}
                title={preset.label}
                className={cn(
                  "relative h-7 w-7 rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "ring-2 ring-ring ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-110",
                  isLight ? "border-border/60" : "border-transparent"
                )}
                style={{ backgroundColor: preset.value }}
              >
                {isSelected && (
                  <Check
                    className={cn(
                      "absolute inset-0 m-auto size-3.5",
                      isLight ? "text-foreground" : "text-white"
                    )}
                    strokeWidth={3}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5">
          <span className="text-muted-foreground/60">Pro</span>
          {BUILDER_MODE && (
            <span className="rounded px-1 py-0.5 text-[8px] font-semibold bg-primary/10 text-primary leading-none">
              UNLOCKED
            </span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {PRO_COLORS.map((preset) => {
            const isSelected = value === preset.value
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleProClick(preset.value)}
                aria-label={`${preset.label}${BUILDER_MODE ? "" : " (Pro)"}${isSelected ? " (selected)" : ""}`}
                aria-pressed={isSelected}
                title={`${preset.label}${BUILDER_MODE ? "" : " (Pro)"}`}
                className={cn(
                  "relative h-7 w-7 rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  BUILDER_MODE
                    ? isSelected
                      ? "ring-2 ring-ring ring-offset-2 ring-offset-background scale-110 border-transparent"
                      : "border-transparent hover:scale-110"
                    : "border-transparent opacity-50 hover:opacity-70"
                )}
                style={{ backgroundColor: preset.value }}
              >
                {isSelected && BUILDER_MODE && (
                  <Check
                    className="absolute inset-0 m-auto size-3.5 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]"
                    strokeWidth={3}
                  />
                )}
                {!BUILDER_MODE && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.7)]"
                    aria-hidden="true"
                  >
                    PRO
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

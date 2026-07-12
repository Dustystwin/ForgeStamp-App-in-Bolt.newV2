import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DENSITY_MIN, DENSITY_MAX } from "@/lib/editor-types"

interface DensityControlProps {
  value: number
  onChange: (value: number) => void
}

export function DensityControl({ value, onChange }: DensityControlProps) {
  const clamp = useCallback((v: number) => {
    return Math.min(DENSITY_MAX, Math.max(DENSITY_MIN, Math.round(v)))
  }, [])

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      onChange(isNaN(parsed) ? DENSITY_MIN : clamp(parsed))
    },
    [onChange, clamp]
  )

  return (
    <div className="space-y-1.5">
      <Label htmlFor="density" className="text-xs font-medium">
        Spacing
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={DENSITY_MIN}
          max={DENSITY_MAX}
          step={1}
          className="flex-1"
          aria-label="Spacing slider"
        />
        <Input
          id="density"
          type="number"
          inputMode="numeric"
          min={DENSITY_MIN}
          max={DENSITY_MAX}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10)
            if (!isNaN(parsed)) onChange(clamp(parsed))
          }}
          onBlur={handleInputBlur}
          className="h-8 w-16 text-center text-xs"
          aria-label="Spacing value"
        />
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Lower = closer together (more watermarks) · Higher = more space between
      </p>
    </div>
  )
}

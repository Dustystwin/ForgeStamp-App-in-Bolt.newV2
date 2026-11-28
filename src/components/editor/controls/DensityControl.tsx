import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { DENSITY_MIN, DENSITY_MAX } from "@/lib/editor-types"
import { useBlockNumberWheel } from "@/hooks/use-block-number-wheel"

interface DensityControlProps {
  value: number
  onChange: (value: number) => void
}

export function DensityControl({ value, onChange }: DensityControlProps) {
  const numberRef = useBlockNumberWheel()
  // Keep the raw text while typing. Clamping each key turns "220" into 40,
  // because "2" is below the minimum before the rest of the number arrives.
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = useCallback((v: number) => {
    return Math.min(DENSITY_MAX, Math.max(DENSITY_MIN, Math.round(v)))
  }, [])

  const commit = useCallback((raw: string) => {
    const parsed = parseInt(raw, 10)
    onChange(Number.isNaN(parsed) ? DENSITY_MIN : clamp(parsed))
    setDraft(null)
  }, [onChange, clamp])

  return (
    <div className="space-y-1.5">
      <Label htmlFor="density" className="text-xs font-medium">
        Spacing
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => {
            setDraft(null)
            onChange(v)
          }}
          min={DENSITY_MIN}
          max={DENSITY_MAX}
          step={1}
          className="flex-1"
          aria-label="Spacing slider"
        />
        <Input
          ref={numberRef}
          id="density"
          type="number"
          inputMode="numeric"
          min={DENSITY_MIN}
          max={DENSITY_MAX}
          value={draft ?? String(value)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            const parsed = parseInt(next, 10)
            if (!Number.isNaN(parsed) && parsed >= DENSITY_MIN && parsed <= DENSITY_MAX) onChange(parsed)
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit(e.currentTarget.value)
              e.currentTarget.blur()
            }
          }}
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

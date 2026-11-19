import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { OPACITY_MIN, OPACITY_MAX } from "@/lib/editor-types"
import { useBlockNumberWheel } from "@/hooks/use-block-number-wheel"

interface OpacityControlProps {
  value: number
  onChange: (value: number) => void
}

export function OpacityControl({ value, onChange }: OpacityControlProps) {
  const numberRef = useBlockNumberWheel()
  const clamp = useCallback((v: number) => {
    return Math.min(OPACITY_MAX, Math.max(OPACITY_MIN, Math.round(v)))
  }, [])

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      if (isNaN(parsed)) {
        onChange(OPACITY_MAX)
      } else {
        onChange(clamp(parsed))
      }
    },
    [onChange, clamp]
  )

  return (
    <div className="space-y-1.5">
      <Label htmlFor="opacity" className="text-xs font-medium">
        Opacity
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={OPACITY_MIN}
          max={OPACITY_MAX}
          step={1}
          suffix="%"
          className="flex-1"
          aria-label="Opacity slider"
        />
        <div className="flex items-center gap-0.5">
          <Input
            ref={numberRef}
            id="opacity"
            type="number"
            inputMode="numeric"
            min={OPACITY_MIN}
            max={OPACITY_MAX}
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10)
              if (!isNaN(parsed)) onChange(clamp(parsed))
            }}
            onBlur={handleInputBlur}
            className="h-8 w-14 text-center text-xs"
            aria-label="Opacity percentage"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </div>
    </div>
  )
}

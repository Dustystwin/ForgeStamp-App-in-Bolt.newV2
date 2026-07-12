import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ROTATION_MIN, ROTATION_MAX } from "@/lib/editor-types"

interface RotationControlProps {
  value: number
  onChange: (value: number) => void
}

export function RotationControl({ value, onChange }: RotationControlProps) {
  const clamp = useCallback((v: number) => {
    return Math.min(ROTATION_MAX, Math.max(ROTATION_MIN, Math.round(v)))
  }, [])

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      if (isNaN(parsed)) {
        onChange(0)
      } else {
        onChange(clamp(parsed))
      }
    },
    [onChange, clamp]
  )

  return (
    <div className="space-y-1.5">
      <Label htmlFor="rotation" className="text-xs font-medium">
        Rotation
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={ROTATION_MIN}
          max={ROTATION_MAX}
          step={1}
          className="flex-1"
          aria-label="Rotation slider"
        />
        <div className="flex items-center gap-0.5">
          <Input
            id="rotation"
            type="number"
            inputMode="numeric"
            min={ROTATION_MIN}
            max={ROTATION_MAX}
            value={value}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10)
              if (!isNaN(parsed)) onChange(clamp(parsed))
            }}
            onBlur={handleInputBlur}
            className="h-8 w-16 text-center text-xs"
            aria-label="Rotation degrees"
          />
          <span className="text-xs text-muted-foreground">&deg;</span>
        </div>
      </div>
    </div>
  )
}

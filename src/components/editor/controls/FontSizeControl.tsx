import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/lib/editor-types"

interface FontSizeControlProps {
  value: number
  onChange: (value: number) => void
  label?: string
  min?: number
  max?: number
  id?: string
}

export function FontSizeControl({
  value,
  onChange,
  label = "Font Size",
  min = FONT_SIZE_MIN,
  max = FONT_SIZE_MAX,
  id = "font-size",
}: FontSizeControlProps) {
  const clamp = useCallback((v: number) => {
    return Math.min(max, Math.max(min, Math.round(v)))
  }, [min, max])

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      if (isNaN(parsed)) {
        onChange(min)
      } else {
        onChange(clamp(parsed))
      }
    },
    [onChange, clamp, min]
  )

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={1}
          className="flex-1"
          aria-label={`${label} slider`}
        />
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10)
            if (!isNaN(parsed)) onChange(clamp(parsed))
          }}
          onBlur={handleInputBlur}
          className="h-8 w-16 text-center text-xs"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  )
}

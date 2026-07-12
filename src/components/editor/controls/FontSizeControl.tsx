import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/lib/editor-types"

interface FontSizeControlProps {
  value: number
  onChange: (value: number) => void
}

export function FontSizeControl({ value, onChange }: FontSizeControlProps) {
  const clamp = useCallback((v: number) => {
    return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, Math.round(v)))
  }, [])

  const handleInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10)
      if (isNaN(parsed)) {
        onChange(FONT_SIZE_MIN)
      } else {
        onChange(clamp(parsed))
      }
    },
    [onChange, clamp]
  )

  return (
    <div className="space-y-1.5">
      <Label htmlFor="font-size" className="text-xs font-medium">
        Font Size
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          step={1}
          className="flex-1"
          aria-label="Font size slider"
        />
        <Input
          id="font-size"
          type="number"
          inputMode="numeric"
          min={FONT_SIZE_MIN}
          max={FONT_SIZE_MAX}
          value={value}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10)
            if (!isNaN(parsed)) onChange(clamp(parsed))
          }}
          onBlur={handleInputBlur}
          className="h-8 w-16 text-center text-xs"
          aria-label="Font size value"
        />
      </div>
    </div>
  )
}

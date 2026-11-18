import { useCallback, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { FONT_SIZE_MIN, FONT_SIZE_MAX } from "@/lib/editor-types"
import { useBlockNumberWheel } from "@/hooks/use-block-number-wheel"

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
  const numberRef = useBlockNumberWheel()
  // While the field is being typed, keep the raw text. Clamping each key
  // turns "40" into 120: "4" is raised to the minimum, then "0" is appended.
  const [draft, setDraft] = useState<string | null>(null)
  const clamp = useCallback((v: number) => {
    return Math.min(max, Math.max(min, Math.round(v)))
  }, [min, max])

  const commit = useCallback((raw: string) => {
    const parsed = parseInt(raw, 10)
    onChange(Number.isNaN(parsed) ? min : clamp(parsed))
    setDraft(null)
  }, [onChange, clamp, min])

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <Slider
          value={[value]}
          onValueChange={([v]) => {
            setDraft(null)
            onChange(v)
          }}
          min={min}
          max={max}
          step={1}
          className="flex-1"
          aria-label={`${label} slider`}
        />
        <Input
          ref={numberRef}
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? String(value)}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const next = e.target.value
            setDraft(next)
            const parsed = parseInt(next, 10)
            if (!Number.isNaN(parsed) && parsed >= min && parsed <= max) onChange(parsed)
          }}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commit(e.currentTarget.value)
              e.currentTarget.blur()
            }
          }}
          className="h-8 w-16 text-center text-xs"
          aria-label={`${label} value`}
        />
      </div>
    </div>
  )
}

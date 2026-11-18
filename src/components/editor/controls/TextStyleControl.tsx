import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  OUTLINE_WIDTH_MAX,
  OUTLINE_WIDTH_MIN,
  SHADOW_BLUR_MAX,
  SHADOW_BLUR_MIN,
  SHADOW_OFFSET_MAX,
  SHADOW_OFFSET_MIN,
} from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface TextStyleControlProps {
  outlineWidth: number
  outlineColor: string
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  shadowUnlocked: boolean
  onOutlineWidthChange: (value: number) => void
  onOutlineColorChange: (value: string) => void
  onShadowEnabledChange: (value: boolean) => void
  onShadowColorChange: (value: string) => void
  onShadowBlurChange: (value: number) => void
  onShadowOffsetXChange: (value: number) => void
  onShadowOffsetYChange: (value: number) => void
}

function Row({ label, value, min, max, onChange }: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium">{label}</Label>
        <span className="text-[10px] tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={1}
        onValueChange={([next]) => onChange(next)}
        aria-label={label}
      />
    </div>
  )
}

export function TextStyleControl({
  outlineWidth,
  outlineColor,
  shadowEnabled,
  shadowColor,
  shadowBlur,
  shadowOffsetX,
  shadowOffsetY,
  shadowUnlocked,
  onOutlineWidthChange,
  onOutlineColorChange,
  onShadowEnabledChange,
  onShadowColorChange,
  onShadowBlurChange,
  onShadowOffsetXChange,
  onShadowOffsetYChange,
}: TextStyleControlProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Outline</Label>
        <Row
          label="Width"
          value={outlineWidth}
          min={OUTLINE_WIDTH_MIN}
          max={OUTLINE_WIDTH_MAX}
          onChange={onOutlineWidthChange}
        />
        {outlineWidth > 0 && (
          <label className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-muted-foreground">Color</span>
            <input
              type="color"
              value={outlineColor}
              aria-label="Outline color"
              onChange={(event) => onOutlineColorChange(event.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
            />
          </label>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-medium">Drop shadow</Label>
          <button
            type="button"
            aria-pressed={shadowEnabled && shadowUnlocked}
            onClick={() => {
              if (!shadowUnlocked) {
                toast("Drop shadow is included with Spark and Forge. Those plans are not for sale.")
                return
              }
              onShadowEnabledChange(!shadowEnabled)
            }}
            className={cn(
              "min-h-8 rounded-md border px-2 py-1 text-[10px] font-medium",
              shadowEnabled && shadowUnlocked
                ? "border-primary bg-primary/15 text-primary"
                : "border-border/60 bg-muted/40 text-muted-foreground",
              !shadowUnlocked && "opacity-60"
            )}
          >
            {shadowUnlocked ? (shadowEnabled ? "On" : "Off") : "Spark"}
          </button>
        </div>
        {shadowUnlocked && shadowEnabled && (
          <div className="space-y-2">
            <label className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-muted-foreground">Color</span>
              <input
                type="color"
                value={shadowColor}
                aria-label="Shadow color"
                onChange={(event) => onShadowColorChange(event.target.value)}
                className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
            </label>
            <Row label="Blur" value={shadowBlur} min={SHADOW_BLUR_MIN} max={SHADOW_BLUR_MAX} onChange={onShadowBlurChange} />
            <Row label="Across" value={shadowOffsetX} min={SHADOW_OFFSET_MIN} max={SHADOW_OFFSET_MAX} onChange={onShadowOffsetXChange} />
            <Row label="Down" value={shadowOffsetY} min={SHADOW_OFFSET_MIN} max={SHADOW_OFFSET_MAX} onChange={onShadowOffsetYChange} />
          </div>
        )}
        {!shadowUnlocked && (
          <p className="text-[10px] leading-snug text-muted-foreground">Included with Spark and Forge. Not for sale.</p>
        )}
      </div>
    </div>
  )
}

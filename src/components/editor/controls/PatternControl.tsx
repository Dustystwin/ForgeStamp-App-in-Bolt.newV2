import { useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { PATTERN_OPTIONS, type Pattern } from "@/lib/editor-types"
import { paintPatternThumb } from "@/lib/pattern-thumb"
import { cn } from "@/lib/utils"

interface PatternControlProps {
  value: Pattern
  coverage: "single" | "full"
  onChange: (value: Pattern) => void
  onSingle: () => void
}

const THUMB_W = 160
const THUMB_H = 160

function Thumb({ pattern }: { pattern: Pattern | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(THUMB_W * dpr)
    canvas.height = Math.round(THUMB_H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    paintPatternThumb(ctx, pattern, THUMB_W, THUMB_H)
  }, [pattern])
  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="h-16 w-16 rounded-md bg-[#f4f1ec]"
    />
  )
}

export function PatternControl({ value, coverage, onChange, onSingle }: PatternControlProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Pattern</Label>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Coverage pattern">
        <button
          type="button"
          aria-pressed={coverage === "single"}
          onClick={onSingle}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg border p-1",
            coverage === "single"
              ? "border-primary bg-primary/10 ring-2 ring-primary/40"
              : "border-black/10 bg-white/70 hover:bg-white"
          )}
        >
          <Thumb pattern={null} />
          <span className="text-center text-[9px] font-medium leading-tight">Single</span>
        </button>
        {PATTERN_OPTIONS.map((opt) => {
          const selected = coverage === "full" && value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              aria-label={opt.label}
              title={opt.label}
              onClick={() => onChange(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border p-1",
                selected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                  : "border-black/10 bg-white/70 hover:bg-white"
              )}
            >
              <Thumb pattern={opt.value} />
              <span className="line-clamp-2 min-h-6 text-center text-[9px] font-medium leading-tight">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

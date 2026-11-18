import { useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { PATTERN_OPTIONS, type Pattern } from "@/lib/editor-types"
import { getPatternPoints } from "@/lib/pattern-layout"
import { cn } from "@/lib/utils"

interface PatternControlProps {
  value: Pattern
  coverage: "single" | "full"
  onChange: (value: Pattern) => void
  onSingle: () => void
}

function Thumb({ pattern }: { pattern: Pattern | null }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.width = 96
    canvas.height = 64
    ctx.fillStyle = "#efe8df"
    ctx.fillRect(0, 0, 96, 64)
    ctx.fillStyle = "#2a2420"
    ctx.font = "bold 7px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    if (!pattern) {
      ctx.font = "bold 9px sans-serif"
      ctx.fillText("Your Text", 48, 32)
      return
    }
    const points = getPatternPoints(96, 64, pattern, 16, 18, 7, "readable", false, 0)
    for (const pt of points) {
      ctx.save()
      ctx.translate(pt.x, pt.y)
      ctx.rotate((pt.angle * Math.PI) / 180)
      const scale = pt.fontScale && pt.fontScale > 0 ? pt.fontScale : 1
      ctx.scale(scale, scale)
      ctx.fillText("T", 0, 0)
      ctx.restore()
    }
  }, [pattern])
  return <canvas ref={ref} className="h-10 w-full rounded-sm bg-[#efe8df]" />
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
            "rounded-md border p-1 text-center",
            coverage === "single" ? "border-primary bg-primary/10" : "border-border/60 bg-muted/30"
          )}
        >
          <Thumb pattern={null} />
          <span className="mt-1 block text-[10px] font-medium">Single</span>
        </button>
        {PATTERN_OPTIONS.map((opt) => {
          const selected = coverage === "full" && value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              aria-label={opt.label}
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-md border p-1 text-center",
                selected ? "border-primary bg-primary/10" : "border-border/60 bg-muted/30"
              )}
            >
              <Thumb pattern={opt.value} />
              <span className="mt-1 block text-[10px] font-medium leading-tight">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

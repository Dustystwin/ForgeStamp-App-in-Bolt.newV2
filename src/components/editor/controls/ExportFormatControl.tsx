import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import type { ExportFormat } from "@/lib/editor-types"
import { FORMAT_OPTIONS, EXPORT_LONG_EDGES, allowedFormats, resolveExportFormat, resolveLongEdge, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface ExportFormatControlProps {
  value: ExportFormat
  plan: PlanId
  longEdge: number
  quality: number
  onChange: (value: ExportFormat) => void
  onLongEdgeChange: (value: number) => void
  onQualityChange: (value: number) => void
}

export function ExportFormatControl({
  value,
  plan,
  longEdge,
  quality,
  onChange,
  onLongEdgeChange,
  onQualityChange,
}: ExportFormatControlProps) {
  const allowed = allowedFormats(plan)
  const shown = resolveExportFormat(plan, value)
  const shownEdge = resolveLongEdge(plan, longEdge) ?? 0
  const paid = plan !== "free"

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Export format</Label>
      <div className="flex gap-1.5" role="group" aria-label="Export format">
        {FORMAT_OPTIONS.map((option) => {
          const unlocked = allowed.includes(option.value)
          const selected = shown === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              title={unlocked ? option.label : "Included with Spark and Forge. Not for sale."}
              onClick={() => {
                if (!unlocked) {
                  toast("JPG and WebP export are included with Spark and Forge. Those plans are not for sale.")
                  return
                }
                onChange(option.value)
              }}
              className={cn(
                "flex-1 rounded-md border px-2 py-1.5 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                !unlocked && "opacity-60"
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Export size</Label>
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Export size">
          {[{ value: 0, label: "Original" }, ...EXPORT_LONG_EDGES.map((edge) => ({ value: edge, label: String(edge) }))].map((option) => {
            const unlocked = option.value === 0 || paid
            const selected = shownEdge === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                title={unlocked ? option.label : "Included with Spark and Forge. Not for sale."}
                onClick={() => {
                  if (!unlocked) {
                    toast("Choosing a smaller export size is included with Spark and Forge. Those plans are not for sale.")
                    return
                  }
                  onLongEdgeChange(option.value)
                }}
                className={cn(
                  "min-h-9 rounded-md border px-1 py-1.5 text-[10px] font-medium",
                  selected
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
                  !unlocked && "opacity-60"
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
      {paid && shown !== "png" && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Quality</Label>
            <span className="text-[10px] tabular-nums text-muted-foreground">{quality}</span>
          </div>
          <Slider
            value={[quality]}
            min={60}
            max={100}
            step={1}
            onValueChange={([next]) => onQualityChange(next)}
            aria-label="Export quality"
          />
        </div>
      )}
      <p className="text-[10px] leading-snug text-muted-foreground">
        {plan === "free"
          ? "Free downloads a PNG at the photo's original size. Outline, date, and crop are included."
          : "PNG, JPG, or WebP. Original keeps the full photo. 2048, 1600, and 1080 fit the long edge. JPG and WebP use the quality slider."}
      </p>
    </div>
  )
}

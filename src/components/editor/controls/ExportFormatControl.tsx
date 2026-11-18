import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import type { ExportFormat } from "@/lib/editor-types"
import { FORMAT_OPTIONS, allowedFormats, resolveExportFormat, type PlanId } from "@/lib/plans"
import { cn } from "@/lib/utils"

interface ExportFormatControlProps {
  value: ExportFormat
  plan: PlanId
  onChange: (value: ExportFormat) => void
}

export function ExportFormatControl({ value, plan, onChange }: ExportFormatControlProps) {
  const allowed = allowedFormats(plan)
  const shown = resolveExportFormat(plan, value)

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
      <p className="text-[10px] leading-snug text-muted-foreground">
        {plan === "free"
          ? "Free downloads a PNG at the photo's original size."
          : "PNG, JPG, or WebP, at the photo's original size. The same format is used for the download and My Images."}
      </p>
    </div>
  )
}

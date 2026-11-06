import { ImageIcon, QrCode, Type } from "lucide-react"
import type { WatermarkMode } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface WatermarkModeControlProps {
  value: WatermarkMode
  onChange: (value: WatermarkMode) => void
}

const OPTIONS: { value: WatermarkMode; label: string; hint: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", hint: "Words stamped on the photo.", icon: Type },
  { value: "logo", label: "Logo", hint: "Your own image, stamped on the photo.", icon: ImageIcon },
  { value: "qr", label: "QR", hint: "A scannable code that opens a link.", icon: QrCode },
]

export function WatermarkModeControl({ value, onChange }: WatermarkModeControlProps) {
  const selected = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[0]

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">Watermark</p>
      <div className="flex gap-1.5" role="group" aria-label="Watermark type">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              title={opt.hint}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">{selected.hint}</p>
    </div>
  )
}

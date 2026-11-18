import { ImageIcon, PenLine, QrCode, Type } from "lucide-react"
import { toast } from "sonner"
import type { WatermarkMode } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface WatermarkModeControlProps {
  value: WatermarkMode
  signatureUnlocked: boolean
  onChange: (value: WatermarkMode) => void
}

const OPTIONS: { value: WatermarkMode; label: string; hint: string; icon: typeof Type }[] = [
  { value: "text", label: "Text", hint: "Words stamped on the photo.", icon: Type },
  { value: "logo", label: "Logo", hint: "Your own image, stamped on the photo.", icon: ImageIcon },
  { value: "qr", label: "QR", hint: "A scannable code that opens a link.", icon: QrCode },
  { value: "signature", label: "Sign", hint: "A signature you draw, stamped like a logo.", icon: PenLine },
]

export function WatermarkModeControl({ value, signatureUnlocked, onChange }: WatermarkModeControlProps) {
  const selected = OPTIONS.find((opt) => opt.value === value) ?? OPTIONS[0]

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">Watermark</p>
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Watermark type">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value
          const locked = opt.value === "signature" && !signatureUnlocked
          const Icon = opt.icon
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (locked) {
                  toast("Signature watermarks are included with Spark and Forge. Those plans are not for sale.")
                  return
                }
                onChange(opt.value)
              }}
              aria-pressed={isSelected}
              title={locked ? "Included with Spark and Forge. Not for sale." : opt.hint}
              className={cn(
                "flex min-h-9 items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-[11px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "bg-primary/15 border-primary text-primary"
                  : "bg-muted/40 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                locked && "opacity-60"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {opt.label}
            </button>
          )
        })}
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">{selected.hint}</p>
    </div>
  )
}

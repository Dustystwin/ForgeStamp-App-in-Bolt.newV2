import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inspectQrUrl, isHardToScanColor } from "@/lib/qr-watermark"

interface QrControlProps {
  value: string
  color: string
  onChange: (value: string) => void
}

export function QrControl({ value, color, onChange }: QrControlProps) {
  const status = useMemo(() => inspectQrUrl(value), [value])
  const light = isHardToScanColor(color)

  return (
    <div className="space-y-1.5">
      <Label htmlFor="qr-url" className="text-xs font-medium">
        Link
      </Label>
      <Input
        id="qr-url"
        type="url"
        inputMode="url"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        placeholder="https://your-site.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={status.problem === "invalid" || status.problem === "too-long"}
        className="h-9"
      />
      {status.problem === "invalid" && (
        <p className="text-[10px] leading-relaxed text-destructive">
          Use a full link starting with http:// or https://.
        </p>
      )}
      {status.problem === "too-long" && (
        <p className="text-[10px] leading-relaxed text-destructive">
          That link is too long for a QR code. Try a shorter one.
        </p>
      )}
      {status.problem === "empty" && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Paste a shop, portfolio, or other link.
        </p>
      )}
      {status.problem === null && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {light
            ? "This color is very light and may not scan. Pick a darker one."
            : "Scanning this code opens that link. A dark color and higher opacity scan more reliably."}
        </p>
      )}
    </div>
  )
}

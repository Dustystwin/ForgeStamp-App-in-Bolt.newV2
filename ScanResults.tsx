import { useEffect, useRef, useState } from "react"
import { Loader2, ScanSearch, ShieldAlert, ShieldCheck, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { scanImageForWatermarks, type ScanReport } from "@/lib/watermark-scan"

interface ScanResultsProps {
  /** The uploaded original file to scan. Panel hides itself when null. */
  file: File | null
  /** Preview URL of the same file, used for the annotated thumbnail. */
  previewUrl: string | null
}

// Runs the watermark scan whenever a new image is uploaded and shows an
// honest verdict: what was found, where (highlighted), and what this scan
// can and cannot see.
export function ScanResults({ file, previewUrl }: ScanResultsProps) {
  const [report, setReport] = useState<ScanReport | null>(null)
  const [scanning, setScanning] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    setReport(null)
    setDismissed(false)
    if (!file) return
    let cancelled = false
    setScanning(true)
    scanImageForWatermarks(file)
      .then((r) => {
        if (!cancelled) setReport(r)
      })
      .catch(() => {
        if (!cancelled) setReport(null)
      })
      .finally(() => {
        if (!cancelled) setScanning(false)
      })
    return () => {
      cancelled = true
    }
  }, [file])

  // Draw the annotated thumbnail (image + highlight boxes) when findings exist.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !report || report.highlights.length === 0 || !previewUrl) return
    const img = new Image()
    img.onload = () => {
      const maxW = 480
      const scale = Math.min(1, maxW / img.naturalWidth)
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0, w, h)
      ctx.fillStyle = "rgba(220, 38, 38, 0.18)"
      ctx.strokeStyle = "rgba(220, 38, 38, 0.9)"
      ctx.lineWidth = 1.5
      for (const r of report.highlights) {
        ctx.fillRect(r.x * w, r.y * h, r.w * w, r.h * h)
        ctx.strokeRect(r.x * w, r.y * h, r.w * w, r.h * h)
      }
    }
    img.src = previewUrl
  }, [report, previewUrl])

  if (!file || dismissed) return null
  if (!scanning && !report) return null

  const verdict = report?.verdict ?? "none"
  const found = verdict !== "none"

  return (
    <div
      className={cn(
        "mt-3 rounded-lg border px-4 py-3",
        scanning
          ? "border-border/50 bg-muted/20"
          : found
            ? "border-amber-500/40 bg-amber-500/[0.06]"
            : report?.aiDetected
              ? "border-violet-500/40 bg-violet-500/[0.06]"
              : "border-emerald-500/30 bg-emerald-500/[0.05]"
      )}
      aria-live="polite"
    >
      {scanning ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Scanning your photo for existing watermarks…
        </div>
      ) : report ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {found ? (
                <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              ) : report.aiDetected ? (
                <Sparkles className="size-4 shrink-0 text-violet-600" />
              ) : (
                <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
              )}
              <p className={cn("text-sm font-semibold", found ? "text-amber-700 dark:text-amber-400" : report.aiDetected ? "text-violet-700 dark:text-violet-400" : "text-emerald-700 dark:text-emerald-400")}>
                {found
                  ? "Existing watermark indicators found in this photo"
                  : report.aiDetected
                    ? "AI-generation markers found — no other watermarks detected"
                    : "Scan complete — no existing watermarks detected"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="h-6 w-6 shrink-0 p-0 text-muted-foreground"
              aria-label="Dismiss scan results"
            >
              <X className="size-3.5" />
            </Button>
          </div>

          {found && (
            <ul className="flex flex-col gap-1.5">
              {report.findings
                .filter((f) => f.severity === "warning" && f.type !== "ai")
                .map((f, i) => (
                  <li key={i} className="text-xs leading-relaxed text-foreground/80">
                    <span className="font-semibold">{f.label}:</span> {f.detail}
                  </li>
                ))}
            </ul>
          )}

          {report.aiDetected && (
            <div className="rounded-md border border-violet-500/40 bg-violet-500/[0.07] px-3 py-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-400">
                <Sparkles className="size-3.5 shrink-0" />
                This photo appears to be AI-generated
              </p>
              <ul className="mt-1 flex flex-col gap-1">
                {report.findings
                  .filter((f) => f.type === "ai")
                  .map((f, i) => (
                    <li key={i} className="text-xs leading-relaxed text-foreground/80">
                      <span className="font-semibold">{f.label}:</span> {f.detail}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {found && report.highlights.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border/40">
              <canvas ref={canvasRef} className="block h-auto w-full max-w-[480px]" />
            </div>
          )}

          {found && (
            <p className="text-xs text-muted-foreground">
              If this photo isn't yours, please make sure you have the right to use it
              before adding your own watermark.
            </p>
          )}

          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
            <ScanSearch className="size-3 shrink-0" />
            Checks file ownership metadata, repeated overlay patterns, hidden-data
            signals, and AI-generation markers. No scan can guarantee detection of
            professional invisible watermarks, or of AI images stripped of their metadata.
          </p>
        </div>
      ) : null}
    </div>
  )
}

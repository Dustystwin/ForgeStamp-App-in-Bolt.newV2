import { useState, useCallback } from "react"
import { ArrowLeft, RotateCcw, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useEditorState } from "@/hooks/use-editor-state"
import { WatermarkPreview } from "./WatermarkPreview"
import { WatermarkControls } from "./WatermarkControls"
import { ImageUploader } from "./ImageUploader"
import { FinishedImages, type FinishedImage } from "./FinishedImages"
import { ScanResults } from "./ScanResults"
import { exportToPng } from "@/lib/watermark-utils"

interface EditorPageProps {
  onNavigateHome: () => void
}

export function EditorPage({ onNavigateHome }: EditorPageProps) {
  const {
    state,
    setImage,
    setWatermarkText,
    setFontFamily,
    setFontSize,
    setColor,
    setOpacity,
    setRotation,
    setPlacement,
    setTextDirection,
    setCoverageMode,
    setPattern,
    setDensity,
    setCurveOrientation,
    reset,
    clearError,
  } = useEditorState()

  const [finishedImages, setFinishedImages] = useState<FinishedImage[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [coverageClearedAt, setCoverageClearedAt] = useState(0)

  const handleClearCoverage = useCallback(() => {
    setCoverageClearedAt(Date.now())
  }, [])

  const handleExport = useCallback(async () => {
    if (!state.image) {
      toast.error("Please upload an image before exporting.")
      return
    }
    setIsExporting(true)
    try {
      const dataUrl = await exportToPng(state.image, {
        text: state.watermarkText,
        fontFamily: state.fontFamily,
        fontSize: state.fontSize,
        color: state.color,
        opacity: state.opacity,
        rotation: state.rotation,
        placement: state.placement,
        textDirection: state.textDirection,
        coverageMode: state.coverageMode,
        pattern: state.pattern,
        curveOrientation: state.curveOrientation,
        density: state.density,
        imageWidth: 0,
        imageHeight: 0,
      })

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, "0")
      const timestamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
      const filename = `forgestamp-export-${timestamp}.png`

      // Trigger browser download
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setFinishedImages((prev) => [
        { id, dataUrl, createdAt: now, filename },
        ...prev,
      ])
      toast.success("PNG exported successfully.")
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }, [state])

  const handleRemoveImage = useCallback((id: string) => {
    setFinishedImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleClearImages = useCallback(() => {
    setFinishedImages([])
  }, [])

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateHome}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to Home
            </Button>
          </div>
          <span className="text-sm font-black tracking-tight">
            ForgeStamp
            <span className="ml-1.5 align-middle rounded bg-muted px-1 py-0.5 text-[9px] font-semibold text-muted-foreground">
              v6
            </span>
          </span>
          <div className="flex items-center gap-2">
            {state.image && (
              <ImageUploader onImageSelect={setImage} hasImage={true} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {state.error && (
        <div className="mx-auto w-full max-w-7xl px-4 pt-3 md:px-6">
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/[0.04] px-4 py-2.5">
            <p className="text-sm text-destructive">{state.error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main layout: preview left, controls right */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-5 md:p-6 lg:grid-cols-[1fr_320px]">

        {/* Preview section — sticky on desktop so it stays in view while scrolling controls */}
        <section
          className="flex-1 min-w-0 md:sticky md:top-16"
          aria-label="Image preview"
        >
          <WatermarkPreview state={state} onImageSelect={setImage} coverageClearedAt={coverageClearedAt} />
          <ScanResults file={state.image} previewUrl={state.imagePreviewUrl} />
        </section>

        {/* Controls sidebar */}
        <aside
          className="md:max-h-[calc(100svh-80px)] md:overflow-y-auto md:rounded-xl md:border md:border-border/40 md:bg-card md:p-4 md:shadow-sm"
          aria-label="Watermark controls"
        >
          <WatermarkControls
            state={state}
            onTextChange={setWatermarkText}
            onFontChange={setFontFamily}
            onFontSizeChange={setFontSize}
            onOpacityChange={setOpacity}
            onRotationChange={setRotation}
            onColorChange={setColor}
            onPlacementChange={setPlacement}
            onTextDirectionChange={setTextDirection}
            onCoverageModeChange={setCoverageMode}
            onCurveOrientationChange={setCurveOrientation}
            onPatternChange={setPattern}
            onDensityChange={setDensity}
            onClearCoverage={handleClearCoverage}
          />

          {/* Export button */}
          <div className="mt-5 pt-4 border-t border-border/40">
            <Button
              className="w-full gap-2 shadow-sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {isExporting ? "Exporting..." : "Export PNG"}
            </Button>
            {!state.image && (
              <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
                Upload an image to export
              </p>
            )}
          </div>
        </aside>
      </main>

      {/* Finished images gallery */}
      <FinishedImages
        images={finishedImages}
        onRemove={handleRemoveImage}
        onClearAll={handleClearImages}
      />
    </div>
  )
}

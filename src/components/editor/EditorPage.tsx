import { useState, useCallback } from "react"
import { ArrowLeft, RotateCcw, Download, Loader as Loader2, Infinity, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useEditorState } from "@/hooks/use-editor-state"
import { WatermarkPreview } from "./WatermarkPreview"
import { WatermarkControls } from "./WatermarkControls"
import { ImageUploader } from "./ImageUploader"
import { FinishedImages, type FinishedImage } from "./FinishedImages"
import { ScanResults } from "./ScanResults"
import { exportToPng, type CanvasWatermarkOptions } from "@/lib/watermark-utils"
import { inspectQrUrl } from "@/lib/qr-watermark"
import { dataUrlToBytes, downloadBlob, downloadUrl, stampedFileName, zipPngs } from "@/lib/batch-export"
import { batchLimitForTier, FREE_BATCH_LIMIT, PRO_BATCH_LIMIT } from "@/lib/builder-mode"
import { BatchStrip } from "./BatchStrip"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"
import { supabase } from "@/lib/supabase"
import type { EditorInitialData } from "@/App"

interface EditorPageProps {
  onNavigateHome: () => void
  initialData?: EditorInitialData
}

export function EditorPage({ onNavigateHome, initialData }: EditorPageProps) {
  const {
    state,
    photos,
    activePhotoId,
    addPhotos,
    selectPhoto,
    removePhoto,
    setImage,
    setWatermarkMode,
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
    setStampSize,
    setQrUrl,
    setQrColor,
    setLogo,
    clearLogo,
    reset,
    clearError,
  } = useEditorState(initialData)

  const { session, profile } = useAuth()
  const batchLimit = batchLimitForTier(profile?.tier, Boolean(profile?.is_admin))
  const { openAuthModal } = useNavigation()

  const [finishedImages, setFinishedImages] = useState<FinishedImage[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [coverageClearedAt, setCoverageClearedAt] = useState(0)

  const handleClearCoverage = useCallback(() => {
    setCoverageClearedAt(Date.now())
  }, [])

  const saveToMyImages = useCallback(async (
    file: File,
    dataUrl: string,
    filename: string
  ) => {
    if (!session?.user) return
    const userId = session.user.id
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    const originalPath = `${userId}/originals/${id}_${file.name}`
    const { error: origErr } = await supabase.storage
      .from("watermark-images")
      .upload(originalPath, file, { contentType: file.type || "image/png" })
    if (origErr) throw new Error(`Failed to upload original: ${origErr.message}`)

    const outputBlob = await fetch(dataUrl).then((r) => r.blob())
    const outputPath = `${userId}/outputs/${id}_${filename}`
    const { error: outErr } = await supabase.storage
      .from("watermark-images")
      .upload(outputPath, outputBlob, { contentType: "image/png" })
    if (outErr) throw new Error(`Failed to upload output: ${outErr.message}`)

    const totalSize = file.size + outputBlob.size

    const settings = {
      watermarkMode: state.watermarkMode,
      watermarkText: state.watermarkText,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      color: state.color,
      opacity: state.opacity,
      rotation: state.rotation,
      placement: state.placement,
      textDirection: state.textDirection,
      coverageMode: state.coverageMode,
      pattern: state.pattern,
      density: state.density,
      curveOrientation: state.curveOrientation,
      stampSize: state.stampSize,
      qrUrl: state.qrUrl,
      qrColor: state.qrColor,
    }

    const { error: dbErr } = await supabase.from("images").insert({
      user_id: userId,
      original_path: originalPath,
      output_path: outputPath,
      settings,
      filename,
      total_size: totalSize,
    })
    if (dbErr) throw new Error(`Failed to save record: ${dbErr.message}`)
  }, [session, state])

  const handleAddPhotos = useCallback((files: File[]) => {
    const result = addPhotos(files, batchLimit)
    if (result.leftOut > 0) {
      toast(
        batchLimit <= FREE_BATCH_LIMIT
          ? `Free exports up to ${FREE_BATCH_LIMIT} photos at a time. A ${PRO_BATCH_LIMIT}-photo batch will be available with paid plans.`
          : `A batch stops at ${batchLimit} photos. Unlimited batches are not available yet.`
      )
    }
  }, [addPhotos, batchLimit])

  const handleExport = useCallback(async () => {
    if (!state.image) {
      toast.error("Please upload an image before exporting.")
      return
    }
    if (state.watermarkMode === "logo" && !state.logoPreviewUrl) {
      toast.error("Upload a logo before exporting.")
      return
    }
    if (state.watermarkMode === "qr") {
      const qr = inspectQrUrl(state.qrUrl)
      if (qr.problem === "too-long") {
        toast.error("That link is too long for a QR code. Try a shorter one.")
        return
      }
      if (!qr.href) {
        toast.error("Enter a full link starting with http:// or https://.")
        return
      }
    }
    const queue = photos.slice(0, batchLimit)
    if (queue.length === 0) {
      toast.error("Please upload an image before exporting.")
      return
    }

    const options: CanvasWatermarkOptions = {
      mode: state.watermarkMode,
      text: state.watermarkText,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      opacity: state.opacity,
      rotation: state.rotation,
      placement: state.placement,
      textDirection: state.textDirection,
      coverageMode: state.coverageMode,
      pattern: state.pattern,
      curveOrientation: state.curveOrientation,
      density: state.density,
      stampSize: state.stampSize,
      logoUrl: state.logoPreviewUrl,
      qrUrl: state.qrUrl,
      color: state.watermarkMode === "qr" ? state.qrColor : state.color,
      imageWidth: 0,
      imageHeight: 0,
    }

    setIsExporting(true)
    setExportProgress(queue.length > 1 ? `Exporting 1 of ${queue.length}...` : "Exporting...")
    try {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, "0")
      const stamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
        `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`

      const exported: { id: string; dataUrl: string; filename: string; file: File }[] = []
      for (let i = 0; i < queue.length; i++) {
        setExportProgress(queue.length > 1 ? `Exporting ${i + 1} of ${queue.length}...` : "Exporting...")
        const file = queue[i].file
        const dataUrl = await exportToPng(file, options)
        exported.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`,
          dataUrl,
          filename: stampedFileName(file, i, queue.length, stamp),
          file,
        })
      }

      if (exported.length === 1) {
        downloadUrl(exported[0].dataUrl, exported[0].filename)
      } else {
        downloadBlob(
          zipPngs(exported.map((item) => ({ name: item.filename, bytes: dataUrlToBytes(item.dataUrl) }))),
          `forgestamp-batch-${stamp}.zip`
        )
      }

      setFinishedImages((prev) => [
        ...exported.map(({ id, dataUrl, filename }) => ({ id, dataUrl, createdAt: now, filename })),
        ...prev,
      ])

      if (session) {
        setIsSaving(true)
        try {
          for (const item of exported) {
            await saveToMyImages(item.file, item.dataUrl, item.filename)
          }
          toast.success(
            exported.length === 1
              ? "Saved to My Images. Expires in 30 days."
              : `Saved ${exported.length} images to My Images. Each expires in 30 days.`
          )
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Failed to save image.")
        } finally {
          setIsSaving(false)
        }
      } else {
        toast.info("Sign in to save to My Images (stored 30 days)", {
          action: {
            label: "Sign In",
            onClick: () => openAuthModal("sign-in"),
          },
          duration: 6000,
        })
      }
    } catch {
      toast.error("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }, [state, photos, batchLimit, session, saveToMyImages, openAuthModal])

  const handleRemoveImage = useCallback((id: string) => {
    setFinishedImages((prev) => prev.filter((img) => img.id !== id))
  }, [])

  const handleClearImages = useCallback(() => {
    setFinishedImages([])
  }, [])

  // Full Reset: return the EDITOR to a fresh session (image + all settings),
  // via the hook's reset(). Deliberately does NOT clear finishedImages — those
  // are the user's exported keepers (and, for logged-in users, already saved
  // to their account) and must survive a reset.
  const handleFullReset = useCallback(() => {
    reset()
    setCoverageClearedAt(0)
    toast.dismiss()
  }, [reset])

  const isProcessing = isExporting || isSaving

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
              v7
            </span>
          </span>
          <div className="flex items-center gap-2">
            {state.image && (
              <ImageUploader onImageSelect={setImage} hasImage={true} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullReset}
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

      {/* Main layout */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:grid md:grid-cols-[1fr_300px] md:items-start md:gap-5 md:p-6 lg:grid-cols-[1fr_320px]">
        <section
          className="flex-1 min-w-0 md:sticky md:top-16"
          aria-label="Image preview"
        >
          <WatermarkPreview
            state={state}
            onImageSelect={setImage}
            onFiles={handleAddPhotos}
            multiple={batchLimit > 1}
            uploadDetail={
              batchLimit > FREE_BATCH_LIMIT
                ? `or click to browse. PNG, JPG, or WebP up to 15MB each. Up to ${PRO_BATCH_LIMIT} photos.`
                : `or click to browse. PNG, JPG, or WebP up to 15MB each. Up to ${FREE_BATCH_LIMIT} photos on the Free plan.`
            }
            coverageClearedAt={coverageClearedAt}
          />
          {photos.length > 0 && (
            <BatchStrip
              photos={photos}
              activeId={activePhotoId}
              limit={batchLimit}
              disabled={isProcessing}
              onSelect={selectPhoto}
              onRemove={removePhoto}
              onAdd={handleAddPhotos}
            />
          )}
          <ScanResults file={state.image} previewUrl={state.imagePreviewUrl} />
        </section>

        <aside
          className="md:max-h-[calc(100svh-80px)] md:overflow-y-auto md:rounded-xl md:border md:border-border/40 md:bg-card md:p-4 md:shadow-sm"
          aria-label="Watermark controls"
        >
          <WatermarkControls
            state={state}
            onModeChange={setWatermarkMode}
            onTextChange={setWatermarkText}
            onFontChange={setFontFamily}
            onFontSizeChange={setFontSize}
            onStampSizeChange={setStampSize}
            onOpacityChange={setOpacity}
            onRotationChange={setRotation}
            onColorChange={setColor}
            onPlacementChange={setPlacement}
            onTextDirectionChange={setTextDirection}
            onCoverageModeChange={setCoverageMode}
            onCurveOrientationChange={setCurveOrientation}
            onPatternChange={setPattern}
            onDensityChange={setDensity}
            onQrUrlChange={setQrUrl}
            onQrColorChange={setQrColor}
            onLogoSelect={setLogo}
            onLogoClear={clearLogo}
            onClearCoverage={handleClearCoverage}
          />

          {/* Export button */}
          <div className="mt-5 pt-4 border-t border-border/40 flex flex-col gap-2">
            <Button
              className="w-full gap-2 shadow-sm"
              onClick={handleExport}
              disabled={isProcessing}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isSaving ? (
                <Save className="size-4 animate-pulse" />
              ) : (
                <Download className="size-4" />
              )}
              {isExporting
                ? (exportProgress ?? "Exporting...")
                : isSaving
                  ? "Saving..."
                  : photos.length > 1
                    ? `Export ${photos.length} photos`
                    : "Export Image"}
            </Button>

            {session && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Infinity className="size-3" />
                Unlimited downloads
              </div>
            )}

            {photos.length > 1 && (
              <p className="text-center text-[10px] text-muted-foreground">
                Downloads a ZIP. Every photo gets this watermark.
              </p>
            )}

            {!state.image && (
              <p className="text-center text-[10px] text-muted-foreground">
                Upload an image to export
              </p>
            )}

            {!session && state.image && (
              <p className="text-center text-[10px] text-muted-foreground">
                <button
                  className="underline hover:text-foreground transition-colors"
                  onClick={() => openAuthModal("sign-up")}
                >
                  Sign up free
                </button>{" "}
                to save images for 30 days
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

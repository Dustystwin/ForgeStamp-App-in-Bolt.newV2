import { useState, useCallback, useEffect, useRef } from "react"
import { ArrowLeft, RotateCcw, Download, Loader as Loader2, Infinity, Save, Undo2, Redo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useEditorState } from "@/hooks/use-editor-state"
import { WatermarkPreview } from "./WatermarkPreview"
import { WatermarkControls } from "./WatermarkControls"
import { ImageUploader } from "./ImageUploader"
import { FinishedImages, type FinishedImage } from "./FinishedImages"
import { ScanResults } from "./ScanResults"
import { exportWatermarked, type CanvasWatermarkOptions } from "@/lib/watermark-utils"
import { inspectQrUrl } from "@/lib/qr-watermark"
import { downloadBlob, downloadUrl, stampedFileName, zipFiles } from "@/lib/batch-export"
import {
  FREE_BATCH_LIMIT,
  FORGE_BATCH_LIMIT,
  SPARK_BATCH_LIMIT,
  batchLimitForPlan,
  effectivePlan,
  formatOption,
  historyCap,
  historySavePhrase,
  resolveExportFormat,
  resolveExportQuality,
  resolveLongEdge,
  layerLimitForPlan,
  savedCountLabel,
  saveFitWarning,
} from "@/lib/plans"
import { ExportFormatControl } from "./controls/ExportFormatControl"
import { BatchStrip } from "./BatchStrip"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"
import { supabase } from "@/lib/supabase"
import {
  STORAGE_LIMIT_MESSAGE,
  calmStorageError,
  fetchSavedImageUsage,
  savedImagesExceedLimit,
  storageObjectPath,
  type SavedImageUsage,
} from "@/lib/storage-quota"
import { replaceFileExtension, savedImageCapFailure, saveResultMessages, shouldRetryOutputCompact, type SaveFailure } from "@/lib/save-messages"
import { compactWatermark, outputForStorage } from "@/lib/stored-output"
import { cn } from "@/lib/utils"
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
    setExportFormat,
    setExportLongEdge,
    setExportQuality,
    setOutlineWidth,
    setOutlineColor,
    setShadowEnabled,
    setShadowColor,
    setShadowBlur,
    setShadowOffsetX,
    setShadowOffsetY,
    setDateStamp,
    setCropAspect,
    setQuarterTurns,
    setEmoji,
    setStickerId,
    setFreeX,
    setFreeY,
    setGradientOn,
    setGradientA,
    setGradientB,
    setGradientC,
    setGradientAngle,
    setGrayscale,
    setKeepInfo,
    layers,
    activeLayerId,
    canUndo,
    canRedo,
    undo,
    redo,
    selectLayer,
    addLayer,
    duplicateLayer,
    deleteLayer,
    moveLayer,
    toggleLayerHidden,
    toggleLayerLocked,
    applySettings,
    setLogo,
    clearLogo,
    setSignature,
    clearSignature,
    reset,
    clearError,
  } = useEditorState(initialData)

  const { session, profile } = useAuth()
  const plan = effectivePlan(profile?.tier, Boolean(profile?.is_admin))
  const layerLimit = layerLimitForPlan(plan)
  const [sampling, setSampling] = useState<"color" | "outline" | "shadow" | null>(null)
  const batchLimit = batchLimitForPlan(plan)
  const exportFormat = resolveExportFormat(plan, state.exportFormat)
  const { openAuthModal } = useNavigation()

  const [finishedImages, setFinishedImages] = useState<FinishedImage[]>([])
  const outputBlobs = useRef(new Map<string, Blob>())
  const previewUrls = useRef<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [coverageClearedAt, setCoverageClearedAt] = useState(0)
  const [savedUsage, setSavedUsage] = useState<SavedImageUsage | null>(null)

  useEffect(() => {
    if (!session) {
      setSavedUsage(null)
      return
    }
    let cancelled = false
    fetchSavedImageUsage().then((usage) => {
      if (!cancelled && usage) setSavedUsage(usage)
    })
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    const blobs = outputBlobs.current
    const urls = previewUrls
    return () => {
      for (const url of urls.current) URL.revokeObjectURL(url)
      urls.current = []
      blobs.clear()
    }
  }, [])

  const handleClearCoverage = useCallback(() => {
    setCoverageClearedAt(Date.now())
  }, [])

  const saveToMyImages = useCallback(async (
    file: File,
    output: Blob,
    filename: string
  ) => {
    if (!session?.user) throw new Error("Sign in to save images.")
    const userId = session.user.id
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const prepared = await outputForStorage(output, filename)
    let outputBlob = prepared.blob
    let contentType = prepared.contentType
    let storedFilename = prepared.filename
    if (await savedImagesExceedLimit(file.size + outputBlob.size)) {
      throw new Error(STORAGE_LIMIT_MESSAGE)
    }

    const originalPath = storageObjectPath(userId, "originals", id, file.name)
    let outputPath = storageObjectPath(userId, "outputs", id, storedFilename)
    let uploadedOriginal = false
    let uploadedOutput = false

    try {
      const { error: origErr } = await supabase.storage
        .from("watermark-images")
        .upload(originalPath, file, { contentType: file.type || "image/png" })
      if (origErr) throw new Error(calmStorageError(`Failed to upload original: ${origErr.message}`))
      uploadedOriginal = true

      const uploadOutput = (path: string, blob: Blob, type: string) =>
        supabase.storage.from("watermark-images").upload(path, blob, { contentType: type })

      let outErr = (await uploadOutput(outputPath, outputBlob, contentType)).error
      // A file between 15 MB and 50 MB needs the newer bucket limit. Until that
      // migration is applied, keep a smaller copy of the same picture instead.
      if (outErr && shouldRetryOutputCompact(contentType, outputBlob.size, outErr.message)) {
        await supabase.storage.from("watermark-images").remove([outputPath])
        const compact = await compactWatermark(output)
        outputBlob = compact.blob
        contentType = compact.contentType
        storedFilename = replaceFileExtension(filename, compact.extension)
        outputPath = storageObjectPath(userId, "outputs", id, storedFilename)
        outErr = (await uploadOutput(outputPath, outputBlob, contentType)).error
      }
      if (outErr) throw new Error(calmStorageError(`Failed to upload output: ${outErr.message}`))
      uploadedOutput = true

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
        exportFormat,
        exportLongEdge: state.exportLongEdge,
        exportQuality: state.exportQuality,
        outlineWidth: state.outlineWidth,
        outlineColor: state.outlineColor,
        shadowEnabled: plan !== "free" && state.shadowEnabled,
        shadowColor: state.shadowColor,
        shadowBlur: state.shadowBlur,
        shadowOffsetX: state.shadowOffsetX,
        shadowOffsetY: state.shadowOffsetY,
        dateStamp: state.dateStamp,
        cropAspect: state.cropAspect,
        quarterTurns: state.quarterTurns,
      }

      const { error: dbErr } = await supabase.from("images").insert({
        user_id: userId,
        original_path: originalPath,
        output_path: outputPath,
        settings,
        filename: storedFilename,
        total_size: file.size + outputBlob.size,
      })
      if (dbErr) throw new Error(calmStorageError(`Failed to save record: ${dbErr.message}`))
    } catch (error) {
      const paths = [
        uploadedOriginal ? originalPath : null,
        uploadedOutput ? outputPath : null,
      ].filter((path): path is string => path !== null)
      if (paths.length > 0) {
        try {
          await supabase.storage.from("watermark-images").remove(paths)
        } catch {
          // Show the upload error. A leftover file still counts toward the 500 MB cap.
        }
      }
      throw error
    }
  }, [session, state, exportFormat, plan])

  const handleAddPhotos = useCallback((files: File[]) => {
    const result = addPhotos(files, batchLimit)
    if (result.leftOut > 0) {
      toast(
        batchLimit <= FREE_BATCH_LIMIT
          ? `Free exports up to ${FREE_BATCH_LIMIT} photos at a time. Spark can export ${SPARK_BATCH_LIMIT}, and Forge can export ${FORGE_BATCH_LIMIT}. Those plans are not for sale.`
          : batchLimit < FORGE_BATCH_LIMIT
            ? `Spark exports up to ${SPARK_BATCH_LIMIT} photos at a time. Forge can export ${FORGE_BATCH_LIMIT}.`
            : `A batch stops at ${batchLimit} photos.`
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
      signatureUrl: state.signaturePreviewUrl,
      outlineWidth: state.outlineWidth,
      outlineColor: state.outlineColor,
      shadowEnabled: plan !== "free" && state.shadowEnabled,
      shadowColor: state.shadowColor,
      shadowBlur: state.shadowBlur,
      shadowOffsetX: state.shadowOffsetX,
      shadowOffsetY: state.shadowOffsetY,
      dateStamp: state.dateStamp,
      emoji: state.emoji,
      stickerId: state.stickerId,
      freeX: state.freeX,
      freeY: state.freeY,
      gradientOn: plan !== "free" && state.gradientOn,
      gradientA: state.gradientA,
      gradientB: state.gradientB,
      gradientC: state.gradientC,
      gradientAngle: state.gradientAngle,
      grayscale: state.grayscale,
      keepInfo: state.keepInfo,
      frameAspect: state.cropAspect,
      quarterTurns: state.quarterTurns,
      longEdge: resolveLongEdge(plan, state.exportLongEdge),
      exportQuality: resolveExportQuality(plan, state.exportQuality) / 100,
      color: state.watermarkMode === "qr" ? state.qrColor : state.color,
      extraMarks: layers.filter((layer) => !layer.hidden).map((layer) => {
        const snap = layer.id === activeLayerId ? state : layer.snap
        return {
          mode: snap.watermarkMode,
          text: snap.watermarkText,
          emoji: "emoji" in snap ? snap.emoji : state.emoji,
          stickerId: "stickerId" in snap ? snap.stickerId : state.stickerId,
          fontFamily: snap.fontFamily,
          fontSize: snap.fontSize,
          color: snap.watermarkMode === "qr" ? snap.qrColor : snap.color,
          opacity: snap.opacity,
          rotation: snap.rotation,
          placement: snap.placement,
          freeX: snap.freeX,
          freeY: snap.freeY,
          textDirection: snap.textDirection,
          coverageMode: snap.coverageMode,
          pattern: snap.pattern,
          density: snap.density,
          curveOrientation: snap.curveOrientation,
          stampSize: snap.stampSize,
          qrUrl: snap.qrUrl,
          outlineWidth: snap.outlineWidth,
          outlineColor: snap.outlineColor,
          shadowEnabled: plan !== "free" && snap.shadowEnabled,
          shadowColor: snap.shadowColor,
          shadowBlur: snap.shadowBlur,
          shadowOffsetX: snap.shadowOffsetX,
          shadowOffsetY: snap.shadowOffsetY,
          dateStamp: snap.dateStamp,
          gradientOn: plan !== "free" && snap.gradientOn,
          gradientA: snap.gradientA,
          gradientB: snap.gradientB,
          gradientC: snap.gradientC,
          gradientAngle: snap.gradientAngle,
          logoUrl: state.logoPreviewUrl,
          signatureUrl: state.signaturePreviewUrl,
          imageWidth: 0,
          imageHeight: 0,
        }
      }),
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

      const made: { id: string; filename: string; file: File; previewUrl: string; blob: Blob }[] = []
      try {
        for (let i = 0; i < queue.length; i++) {
          setExportProgress(queue.length > 1 ? `Exporting ${i + 1} of ${queue.length}...` : "Exporting...")
          const file = queue[i].file
          const exported = await exportWatermarked(file, options, exportFormat)
          const id = `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 5)}`
          const previewUrl = URL.createObjectURL(exported.preview)
          outputBlobs.current.set(id, exported.blob)
          made.push({
            id,
            previewUrl,
            filename: stampedFileName(file, i, queue.length, stamp, formatOption(exportFormat).extension),
            file,
            blob: exported.blob,
          })
        }
      } catch (error) {
        for (const item of made) {
          URL.revokeObjectURL(item.previewUrl)
          outputBlobs.current.delete(item.id)
        }
        throw error
      }

      if (made.length === 1) {
        downloadBlob(made[0].blob, made[0].filename)
      } else {
        const entries: { name: string; bytes: Uint8Array }[] = []
        for (const item of made) {
          entries.push({ name: item.filename, bytes: new Uint8Array(await item.blob.arrayBuffer()) })
        }
        const zip = zipFiles(entries)
        entries.length = 0
        downloadBlob(zip, `forgestamp-batch-${stamp}.zip`)
      }

      const finished = made.map(({ id, previewUrl, filename }) => ({ id, previewUrl, createdAt: now, filename }))
      previewUrls.current = [...finished.map((item) => item.previewUrl), ...previewUrls.current]
      setFinishedImages((prev) => [...finished, ...prev])

      setIsExporting(false)

      if (session) {
        setIsSaving(true)
        const cap = historyCap(plan)
        const room = savedUsage && cap != null ? Math.max(0, cap - savedUsage.count) : made.length
        const toSave = made.slice(0, room)
        const skipped = made.slice(room)
        try {
          const failures: SaveFailure[] = skipped.map((item) => ({
            filename: item.filename,
            message: savedImageCapFailure(plan),
          }))
          let savedCount = 0
          let capHit = false
          for (let i = 0; i < toSave.length; i++) {
            setExportProgress(`Downloaded. Saving to My Images ${savedCount + 1} of ${made.length}...`)
            const item = toSave[i]
            if (capHit) {
              failures.push({ filename: item.filename, message: savedImageCapFailure(plan) })
              continue
            }
            try {
              await saveToMyImages(item.file, item.blob, item.filename)
              savedCount += 1
              setExportProgress(`Downloaded. Saving to My Images ${savedCount} of ${made.length}...`)
            } catch (err) {
              const message = err instanceof Error ? err.message : "Failed to save image."
              failures.push({ filename: item.filename, message })
              if (message.toLowerCase().includes("can keep") && message.toLowerCase().includes("saved images")) {
                capHit = true
              }
            }
          }
          const report = saveResultMessages(
            savedCount,
            made.length,
            failures,
            historySavePhrase(plan, savedCount || made.length)
          )
          if (report.success) toast.success(report.success)
          if (report.warning) toast.warning(report.warning, { duration: 8000 })
          if (report.error) toast.error(report.error)
          const nextUsage = await fetchSavedImageUsage()
          if (nextUsage) setSavedUsage(nextUsage)
        } finally {
          setIsSaving(false)
        }
      } else {
        toast.info("Sign in to save to My Images (30 days, up to 20 images)", {
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
  }, [state, photos, batchLimit, exportFormat, plan, session, savedUsage, saveToMyImages, openAuthModal])

  const handleRemoveImage = useCallback((id: string) => {
    setFinishedImages((prev) => {
      const target = prev.find((img) => img.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      const next = prev.filter((img) => img.id !== id)
      previewUrls.current = next.map((img) => img.previewUrl)
      return next
    })
    outputBlobs.current.delete(id)
  }, [])

  const handleClearImages = useCallback(() => {
    for (const url of previewUrls.current) URL.revokeObjectURL(url)
    previewUrls.current = []
    outputBlobs.current.clear()
    setFinishedImages([])
  }, [])

  const handleDownloadFinished = useCallback((image: FinishedImage) => {
    const blob = outputBlobs.current.get(image.id)
    if (blob) downloadBlob(blob, image.filename)
    else downloadUrl(image.previewUrl, image.filename)
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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey
      if (!meta || event.key.toLowerCase() !== "z") return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [undo, redo])

  const isProcessing = isExporting || isSaving
  const exportCount = Math.min(photos.length, batchLimit)
  const fitWarning = session && savedUsage
    ? saveFitWarning(plan, savedUsage.count, exportCount)
    : null

  return (
    <div className="fs-studio flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/85 backdrop-blur-md">
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
            <Button variant="outline" size="sm" onClick={undo} disabled={!canUndo} aria-label="Undo" className="px-2">
              <Undo2 className="size-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={!canRedo} aria-label="Redo" className="px-2">
              <Redo2 className="size-3.5" />
            </Button>
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
          className="min-w-0 flex-1 rounded-2xl bg-white/95 p-2 shadow-[0_16px_40px_-24px_rgba(90,40,10,0.55)] md:sticky md:top-16 md:p-3"
          aria-label="Image preview"
        >
          <WatermarkPreview
            state={state}
            onImageSelect={setImage}
            onFiles={handleAddPhotos}
            multiple={batchLimit > 1}
            uploadDetail={`or click to browse. PNG, JPG, or WebP up to 15MB each. Up to ${batchLimit} photos.`}
            coverageClearedAt={coverageClearedAt}
            layers={layers}
            activeLayerId={activeLayerId}
            sampling={sampling}
            onSample={(hex) => {
              if (sampling === "outline") setOutlineColor(hex)
              else if (sampling === "shadow") setShadowColor(hex)
              else setColor(hex)
              setSampling(null)
            }}
            onFreeMove={(x, y) => {
              setFreeX(x)
              setFreeY(y)
            }}
            onRotate={setRotation}
            onResize={(size) => {
              if (state.watermarkMode === "text" || state.watermarkMode === "emoji") setFontSize(size)
              else setStampSize(size)
            }}
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
          className="rounded-2xl border border-black/5 bg-white/95 p-3 shadow-[0_16px_40px_-24px_rgba(90,40,10,0.45)] md:max-h-[calc(100svh-80px)] md:overflow-y-auto md:p-4"
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
            onSignatureChange={setSignature}
            onSignatureClear={clearSignature}
            onOutlineWidthChange={setOutlineWidth}
            onOutlineColorChange={setOutlineColor}
            onShadowEnabledChange={setShadowEnabled}
            onShadowColorChange={setShadowColor}
            onShadowBlurChange={setShadowBlur}
            onShadowOffsetXChange={setShadowOffsetX}
            onShadowOffsetYChange={setShadowOffsetY}
            onDateStampChange={setDateStamp}
            onCropAspectChange={setCropAspect}
            onQuarterTurnsChange={setQuarterTurns}
            onEmojiChange={setEmoji}
            onStickerChange={setStickerId}
            onGradientOnChange={setGradientOn}
            onGradientAChange={setGradientA}
            onGradientBChange={setGradientB}
            onGradientCChange={setGradientC}
            onGradientAngleChange={setGradientAngle}
            onGrayscaleChange={setGrayscale}
            onSampleRequest={setSampling}
            layers={layers}
            activeLayerId={activeLayerId}
            layerLimit={layerLimit}
            onSelectLayer={selectLayer}
            onAddLayer={addLayer}
            onDuplicateLayer={duplicateLayer}
            onDeleteLayer={deleteLayer}
            onMoveLayer={moveLayer}
            onHideLayer={toggleLayerHidden}
            onLockLayer={toggleLayerLocked}
            onClearCoverage={handleClearCoverage}
            onApplySettings={applySettings}
            onUseBrand={(kit) => {
              const handle = kit.handles.find((item) => item.trim())
              if (handle) setWatermarkText(handle)
              if (kit.fonts[0]) setFontFamily(kit.fonts[0])
              if (kit.colors[0]) setColor(kit.colors[0])
              if (kit.colors[1]) setOutlineColor(kit.colors[1])
              if (kit.website) setQrUrl(kit.website.startsWith("http") ? kit.website : `https://${kit.website}`)
              if (kit.logoDataUrl) {
                void fetch(kit.logoDataUrl)
                  .then((response) => response.blob())
                  .then((blob) => setLogo(new File([blob], "brand-logo.png", { type: blob.type || "image/png" })))
                  .catch(() => toast.error("The brand logo could not be loaded."))
              }
              toast.success(handle ? "Brand applied to this mark." : "Brand colors applied. Add a handle to fill the words.")
            }}
          />

          <div className="mt-5 flex flex-col gap-3 border-t border-border/40 pt-4">
            <ExportFormatControl
              value={state.exportFormat}
              plan={plan}
              longEdge={state.exportLongEdge}
              quality={state.exportQuality}
              onChange={setExportFormat}
              onLongEdgeChange={setExportLongEdge}
              onQualityChange={setExportQuality}
              keepInfo={state.keepInfo}
              onKeepInfoChange={setKeepInfo}
            />
            {session && savedUsage && (
              <p className={cn(
                "text-center text-[11px] font-medium",
                fitWarning ? "text-amber-800 dark:text-amber-200" : "text-foreground/80",
              )}>
                {savedCountLabel(savedUsage.count, plan)}
              </p>
            )}
            {fitWarning && (
              <p className="rounded-md bg-amber-500/10 px-2.5 py-1.5 text-center text-[11px] leading-snug text-amber-900 dark:text-amber-100">
                {fitWarning}
              </p>
            )}
            <Button
              className="h-auto min-h-9 w-full gap-2 whitespace-normal py-2 text-center leading-snug shadow-sm"
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
                  ? (exportProgress ?? "Downloaded. Saving to My Images...")
                  : photos.length > 1
                    ? `Export ${photos.length} ${formatOption(exportFormat).label} photos`
                    : `Export ${formatOption(exportFormat).label}`}
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
                to save images for 30 days (up to 20)
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
        onDownload={handleDownloadFinished}
      />
    </div>
  )
}

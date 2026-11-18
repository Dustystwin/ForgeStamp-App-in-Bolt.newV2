import { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react"
import { canvasToBlob, releaseCanvas } from "@/lib/image-resources"
import { frameFile, needsFrame, type FrameRequest } from "@/lib/frame-image"
import { composeWatermarkText, scaledTextPaint, textPaintPadding } from "@/lib/text-style"
import { watermarkStrength } from "@/lib/watermark-strength"
import { useAuth } from "@/context/AuthContext"
import { canUseSparkTools } from "@/lib/plans"
import type { EditorState } from "@/lib/editor-types"
import type { MarkLayer } from "@/lib/mark-layer"
import { ImageUploader } from "./ImageUploader"
import {
  isStackedDirection,
  isStackedUpward,
  drawWatermarkOnCanvas,
  placedStampCenter,
  measureTextStamp,
  scaledStampFont,
  stampPixelSize,
} from "@/lib/watermark-utils"
import { renderQrDataUrl } from "@/lib/qr-watermark"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface WatermarkPreviewProps {
  state: EditorState
  onImageSelect: (file: File) => void
  onFiles?: (files: File[]) => void
  multiple?: boolean
  uploadDetail?: string
  // Increment this timestamp to trigger a manual canvas clear without redrawing
  coverageClearedAt?: number
}

export function WatermarkPreview({
  state,
  onImageSelect,
  onFiles,
  multiple = false,
  uploadDetail,
  coverageClearedAt = 0,
  layers = [],
  activeLayerId = "",
  sampling = null,
  onSample,
  onFreeMove,
  onRotate,
  onResize,
}: WatermarkPreviewProps & {
  layers?: MarkLayer[]
  activeLayerId?: string
  sampling?: "color" | "outline" | "shadow" | null
  onSample?: (hex: string) => void
  onFreeMove?: (x: number, y: number) => void
  onRotate?: (degrees: number) => void
  onResize?: (scale: number) => void
}) {
  const { profile } = useAuth()
  const iconsUnlocked = canUseSparkTools(profile?.tier, Boolean(profile?.is_admin))
  const {
    imagePreviewUrl,
    watermarkMode,
    watermarkText,
    fontFamily,
    fontSize,
    color,
    opacity,
    rotation,
    placement,
    textDirection,
    coverageMode,
    pattern,
    density,
    curveOrientation,
    stampSize,
    qrUrl,
    qrColor,
    logoPreviewUrl,
    signaturePreviewUrl,
    outlineWidth,
    outlineColor,
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    dateStamp,
    cropAspect,
    frameMode,
    quarterTurns,
    flipHorizontal,
    flipVertical,
    emoji,
    stickerId,
    freeX,
    freeY,
    gradientOn,
    gradientA,
    gradientB,
    gradientC,
    gradientAngle,
    grayscale,
    autoContrast,
    handlePlatform,
  } = state

  const label = composeWatermarkText(watermarkText, dateStamp)

  const slotRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [stampSource, setStampSource] = useState<{ src: string; image: HTMLImageElement } | null>(null)
  const [framedUrl, setFramedUrl] = useState<string | null>(null)
  const [compare, setCompare] = useState(100)
  // Tracks the last clearAt value we have acted on
  const lastClearedAtRef = useRef(0)

  const qrDataUrl = useMemo(() => {
    if (watermarkMode !== "qr") return null
    return renderQrDataUrl(qrUrl, qrColor)
  }, [watermarkMode, qrUrl, qrColor])

  const stampSrc = watermarkMode === "logo"
    ? logoPreviewUrl
    : watermarkMode === "signature"
      ? signaturePreviewUrl
      : watermarkMode === "qr"
        ? qrDataUrl
        : null

  const frameRequest: FrameRequest = {
    aspect: cropAspect,
    mode: frameMode,
    quarterTurns,
    flipHorizontal,
    flipVertical,
    longEdge: 1600,
  }

  useEffect(() => {
    const file = state.image
    if (!file) {
      setFramedUrl((current) => {
        if (current) URL.revokeObjectURL(current)
        return null
      })
      return
    }
    let cancelled = false
    let committed = false
    let nextUrl: string | null = null
    const run = async () => {
      // Original + Fit, with no turn or flip, is the photo itself.
      if (!needsFrame(1, 1, { ...frameRequest, longEdge: null })) {
        if (!cancelled) {
          setFramedUrl((current) => {
            if (current) URL.revokeObjectURL(current)
            return null
          })
        }
        return
      }
      try {
        const canvas = await frameFile(file, frameRequest)
        const blob = await canvasToBlob(canvas, "image/jpeg", 0.92)
        releaseCanvas(canvas)
        if (!blob || cancelled) return
        nextUrl = URL.createObjectURL(blob)
        if (cancelled) {
          URL.revokeObjectURL(nextUrl)
          return
        }
        setFramedUrl((current) => {
          if (current && current !== nextUrl) URL.revokeObjectURL(current)
          return nextUrl
        })
        committed = true
      } catch {
        if (!cancelled) {
          setFramedUrl((current) => {
            if (current) URL.revokeObjectURL(current)
            return null
          })
        }
      }
    }
    void run()
    return () => {
      cancelled = true
      if (nextUrl && !committed) URL.revokeObjectURL(nextUrl)
    }
  }, [state.image, cropAspect, frameMode, quarterTurns, flipHorizontal, flipVertical])

  useEffect(() => {
    if (!stampSrc) {
      setStampSource(null)
      return
    }
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setStampSource({ src: stampSrc, image: img })
    }
    img.onerror = () => {
      if (!cancelled) setStampSource(null)
    }
    img.src = stampSrc
    return () => {
      cancelled = true
    }
  }, [stampSrc])

  useEffect(() => {
    const canvas = canvasRef.current
    return () => {
      releaseCanvas(canvas)
    }
  }, [])

  // Size the stage from the photo's real pixels, fitted into the column.
  // The old stage stretched to the full column, so a short photo sat on the
  // left and the watermark canvas painted across the empty checkerboard.
  const measureStage = () => {
    const img = imageRef.current
    const slot = slotRef.current
    if (!img || !slot) return
    const naturalW = img.naturalWidth
    const naturalH = img.naturalHeight
    if (naturalW < 1 || naturalH < 1) return
    const maxW = Math.max(1, slot.clientWidth)
    const maxH = window.innerWidth >= 768
      ? Math.min(window.innerHeight * 0.45, 460)
      : Math.max(160, window.innerHeight * 0.45)
    let width = maxW
    let height = width * (naturalH / naturalW)
    if (height > maxH) {
      height = maxH
      width = height * (naturalW / naturalH)
    }
    const nextW = Math.max(1, Math.round(width))
    const nextH = Math.max(1, Math.round(height))
    setContainerWidth((prev) => (prev === nextW ? prev : nextW))
    setContainerHeight((prev) => (prev === nextH ? prev : nextH))
  }

  useEffect(() => {
    measureStage()
    const slot = slotRef.current
    if (!slot) return
    const observer = new ResizeObserver(() => measureStage())
    observer.observe(slot)
    window.addEventListener("resize", measureStage)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measureStage)
    }
  }, [imagePreviewUrl, framedUrl])


  // Full-coverage draw effect.
  //
  // All drawing dependencies are listed here directly — no intermediate useCallback —
  // so this effect reliably re-runs whenever anything affecting the pattern changes.
  //
  // The canvas is always kept in the DOM (never conditionally unmounted) to avoid the
  // React ref/timing race where canvasRef.current is null at the moment this effect fires
  // after a key={pattern}-driven remount. Instead, we CSS-hide the canvas when in single
  // mode and clear it explicitly via canvas.width reassignment at the top of every draw.
  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Manual clear requested: wipe without redrawing, then return.
    // The next change to any other dependency will trigger a normal draw.
    if (coverageClearedAt > lastClearedAtRef.current) {
      lastClearedAtRef.current = coverageClearedAt
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvas.width = 0
      canvas.height = 0
      return
    }

    if (!imagePreviewUrl || containerWidth <= 0 || containerHeight <= 0) {
      canvas.width = 0
      canvas.height = 0
      return
    }

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(containerWidth * dpr))
      canvas.height = Math.max(1, Math.round(containerHeight * dpr))
      const prep = canvas.getContext("2d")
      if (prep) prep.setTransform(dpr, 0, 0, dpr, 0, 0)
      const visible = layers.filter((layer) => !layer.hidden)
      const marks = visible.length > 0 ? visible : []
      void (async () => {
        let photo: HTMLImageElement | null = null
        if (autoContrast) {
          photo = new Image()
          photo.src = framedUrl ?? imagePreviewUrl
          try {
            await photo.decode()
          } catch {
            photo = null
          }
        }
        for (const layer of marks) {
          const snap = layer.id === activeLayerId ? null : layer.snap
          await drawWatermarkOnCanvas(canvas, canvas, {
            marksOnly: true,
            mode: snap?.watermarkMode ?? watermarkMode,
            text: snap?.watermarkText ?? watermarkText,
            emoji: snap?.emoji ?? emoji,
            stickerId: snap?.stickerId ?? stickerId,
            fontFamily: snap?.fontFamily ?? fontFamily,
            fontSize: snap?.fontSize ?? fontSize,
            color: (snap?.watermarkMode ?? watermarkMode) === "qr" ? (snap?.qrColor ?? qrColor) : (snap?.color ?? color),
            opacity: snap?.opacity ?? opacity,
            rotation: snap?.rotation ?? rotation,
            placement: snap?.placement ?? placement,
            freeX: snap ? snap.freeX : freeX,
            freeY: snap ? snap.freeY : freeY,
            textDirection: snap?.textDirection ?? textDirection,
            coverageMode: snap?.coverageMode ?? coverageMode,
            pattern: snap?.pattern ?? pattern,
            density: snap?.density ?? density,
            curveOrientation: snap?.curveOrientation ?? curveOrientation,
            stampSize: snap?.stampSize ?? stampSize,
            qrUrl: snap?.qrUrl ?? qrUrl,
            outlineWidth: snap?.outlineWidth ?? outlineWidth,
            outlineColor: snap?.outlineColor ?? outlineColor,
            shadowEnabled: snap?.shadowEnabled ?? shadowEnabled,
            shadowColor: snap?.shadowColor ?? shadowColor,
            shadowBlur: snap?.shadowBlur ?? shadowBlur,
            shadowOffsetX: snap?.shadowOffsetX ?? shadowOffsetX,
            shadowOffsetY: snap?.shadowOffsetY ?? shadowOffsetY,
            dateStamp: snap?.dateStamp ?? dateStamp,
            gradientOn: snap?.gradientOn ?? gradientOn,
            gradientA: snap?.gradientA ?? gradientA,
            gradientB: snap?.gradientB ?? gradientB,
            gradientC: snap?.gradientC ?? gradientC,
            gradientAngle: snap?.gradientAngle ?? gradientAngle,
            logoUrl: logoPreviewUrl,
            signatureUrl: signaturePreviewUrl,
            autoContrast,
            handlePlatform: iconsUnlocked ? (snap?.handlePlatform ?? handlePlatform) : "none",
            backdrop: photo,
            imageWidth: containerWidth,
            imageHeight: containerHeight,
          })
        }
      })()
    }

    draw()

    if (watermarkMode !== "text" && watermarkMode !== "emoji") return

    // Web fonts load lazily — if the selected font wasn't downloaded yet, the draw
    // above used a fallback font. Request it and redraw once it arrives so the
    // pattern (and its text-width-based spacing) reflects the real font.
    let cancelled = false
    try {
      const fontSpec = `bold ${Math.max(12, Math.round(fontSize * (Math.sqrt(containerWidth * containerHeight) / 800)))}px "${fontFamily}"`
      if (!document.fonts.check(fontSpec)) {
        document.fonts
          .load(fontSpec, label || "M")
          .then(() => {
            if (!cancelled) draw()
          })
          .catch(() => {
            // Local/system fonts aren't in the FontFaceSet — nothing to reload.
          })
      }
    } catch {
      // FontFaceSet API unavailable — the initial draw stands.
    }
    return () => {
      cancelled = true
    }
  }, [
    coverageMode,
    coverageClearedAt,
    containerWidth,
    containerHeight,
    fontSize,
    fontFamily,
    color,
    opacity,
    rotation,
    textDirection,
    density,
    pattern,
    watermarkText,
    label,
    outlineWidth,
    outlineColor,
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    curveOrientation,
    watermarkMode,
    stampSize,
    stampSource,
    stampSrc,
    placement,
    layers,
    activeLayerId,
    emoji,
    stickerId,
    freeX,
    freeY,
    gradientOn,
    gradientA,
    gradientB,
    gradientC,
    gradientAngle,
    qrUrl,
    qrColor,
    logoPreviewUrl,
    signaturePreviewUrl,
    coverageMode,
    imagePreviewUrl,
    autoContrast,
    framedUrl,
    handlePlatform,
    iconsUnlocked,
  ])

  const scaledFontSize = scaledStampFont(fontSize, containerWidth, containerHeight)
  const stampPx = stampPixelSize(containerWidth, containerHeight, stampSize)
  const [fontEpoch, setFontEpoch] = useState(0)
  useEffect(() => {
    const spec = `bold ${scaledFontSize}px "${fontFamily}"`
    let cancelled = false
    document.fonts
      .load(spec, watermarkText || "M")
      .then(() => {
        if (!cancelled) setFontEpoch((n) => n + 1)
      })
      .catch(() => {
        // System fonts are not in the FontFaceSet.
      })
    return () => {
      cancelled = true
    }
  }, [fontFamily, scaledFontSize, watermarkText])
  const singlePaint = scaledTextPaint({
    fontSize,
    scaledFont: scaledFontSize,
    outlineWidth,
    outlineColor,
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
  })
  const textBox = useMemo(() => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return { width: scaledFontSize * 4, height: scaledFontSize }
    const box = measureTextStamp(
      ctx,
      label,
      scaledFontSize,
      fontFamily,
      isStackedDirection(textDirection),
    )
    const pad = textPaintPadding(singlePaint)
    box.width += pad * 2
    box.height += pad * 2
    releaseCanvas(canvas)
    return box
  }, [label, scaledFontSize, fontFamily, textDirection, fontEpoch, singlePaint])
  const textCenter = placedStampCenter(
    placement,
    containerWidth,
    containerHeight,
    textBox.width,
    textBox.height,
    rotation,
  )
  const imageCenter = placedStampCenter(
    placement,
    containerWidth,
    containerHeight,
    stampPx,
    stampPx,
    rotation,
  )
  const singleImageStyle: React.CSSProperties = {
    position: "absolute",
    left: `${(imageCenter.x / Math.max(containerWidth, 1)) * 100}%`,
    top: `${(imageCenter.y / Math.max(containerHeight, 1)) * 100}%`,
    width: stampPx,
    height: stampPx,
    objectFit: "contain",
    opacity: opacity / 100,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    pointerEvents: "none",
    userSelect: "none",
  }

  const stackedSingle = isStackedDirection(textDirection)
  const stackedSingleUpward = isStackedUpward(textDirection)
  const singleWatermarkStyle: React.CSSProperties = {
    left: `${(textCenter.x / Math.max(containerWidth, 1)) * 100}%`,
    top: `${(textCenter.y / Math.max(containerHeight, 1)) * 100}%`,
    fontFamily,
    fontSize: `${scaledFontSize}px`,
    color,
    opacity: opacity / 100,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
    position: "absolute",
    whiteSpace: "nowrap",
    fontWeight: "bold",
    lineHeight: 1,
    // Vertical directions = upright letters stacked, readable without tilting
    // your head. For Vertical Up the character string is reversed (below) so the
    // word reads correctly from the bottom upward while still stacking downward.
    ...(stackedSingle ? { writingMode: "vertical-rl" as const, textOrientation: "upright" as const, letterSpacing: "0.05em" } : {}),
    ...(singlePaint && singlePaint.outlineWidth > 0
      ? { WebkitTextStroke: `${singlePaint.outlineWidth}px ${singlePaint.outlineColor}`, paintOrder: "stroke fill" as const }
      : {}),
    ...(singlePaint && (singlePaint.shadowBlur > 0 || singlePaint.shadowOffsetX !== 0 || singlePaint.shadowOffsetY !== 0)
      ? { textShadow: `${singlePaint.shadowOffsetX}px ${singlePaint.shadowOffsetY}px ${singlePaint.shadowBlur}px ${singlePaint.shadowColor}` }
      : {}),
    pointerEvents: "none",
    userSelect: "none",
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col items-stretch justify-center overflow-hidden",
        !imagePreviewUrl && "min-h-[260px] md:min-h-[360px]"
      )}
    >
      <div
        ref={slotRef}
        className={cn(
          "flex w-full justify-center",
          !imagePreviewUrl && "min-h-[260px] md:min-h-[360px]"
        )}
      >
      <div
        ref={containerRef}
        className={cn(
          "relative",
          imagePreviewUrl
            ? "bg-[#f3f1ee]"
            : "w-full min-h-[260px] md:min-h-[360px]"
        )}
        style={
          imagePreviewUrl && containerWidth > 0
            ? { width: containerWidth, height: containerHeight }
            : undefined
        }
      >
        {/* Uploaded image. Width and height match its aspect, so it fills this box. */}
        {imagePreviewUrl ? (
          <img
            ref={imageRef}
            src={framedUrl ?? imagePreviewUrl}
            style={{
              width: containerWidth > 0 ? containerWidth : undefined,
              height: containerHeight > 0 ? containerHeight : undefined,
              filter: grayscale ? "grayscale(1)" : undefined,
            }}
            alt="Uploaded image preview"
            className="block max-w-full object-fill"
            draggable={false}
            onLoad={measureStage}
          />
        ) : null}

        {/* Watermark overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden"
          style={imagePreviewUrl ? { clipPath: `inset(0 ${100 - compare}% 0 0)` } : undefined}
        >
          {/*
            Canvas stays in the DOM at all times so canvasRef is always valid.
            CSS-hidden (not unmounted) in single mode — no remount timing races.
          */}
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 h-full w-full"
            )}
          />
          {layers.length === 0 && coverageMode === "single" && watermarkMode === "text" && (
            <div style={singleWatermarkStyle}>
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                {stackedSingleUpward
                  ? Array.from(label || "\u00A0").reverse().join("")
                  : label || "\u00A0"}
              </span>
            </div>
          )}
          {layers.length === 0 && coverageMode === "single" && watermarkMode === "logo" && logoPreviewUrl && (
            <img src={logoPreviewUrl} alt="" style={singleImageStyle} draggable={false} />
          )}
          {layers.length === 0 && coverageMode === "single" && watermarkMode === "signature" && signaturePreviewUrl && (
            <img src={signaturePreviewUrl} alt="" style={singleImageStyle} draggable={false} />
          )}
          {layers.length === 0 && coverageMode === "single" && watermarkMode === "qr" && qrDataUrl && (
            <img
              src={qrDataUrl}
              alt=""
              style={singleImageStyle}
              draggable={false}
            />
          )}
          {coverageMode === "single" && imagePreviewUrl && onFreeMove && (
            <div
              className="absolute z-20 size-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary bg-white shadow"
              style={{
                left: `${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.x : imageCenter.x) / Math.max(containerWidth, 1)) * 100}%`,
                top: `${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.y : imageCenter.y) / Math.max(containerHeight, 1)) * 100}%`,
              }}
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId) || !containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                onFreeMove(
                  Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
                  Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
                )
              }}
              aria-label="Drag watermark"
            />
          )}
          {coverageMode === "single" && imagePreviewUrl && onRotate && (
            <div
              className="absolute z-20 size-4 -translate-x-1/2 cursor-alias rounded-full border border-primary bg-primary/30"
              style={{
                left: `${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.x : imageCenter.x) / Math.max(containerWidth, 1)) * 100}%`,
                top: `calc(${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.y : imageCenter.y) / Math.max(containerHeight, 1)) * 100}% - 28px)`,
              }}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId) || !containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const cx = (watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.x : imageCenter.x)
                const cy = (watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.y : imageCenter.y)
                const dx = event.clientX - rect.left - cx
                const dy = event.clientY - rect.top - cy
                onRotate(Math.round((Math.atan2(dy, dx) * 180) / Math.PI))
              }}
              aria-label="Rotate watermark"
            />
          )}
          {coverageMode === "single" && imagePreviewUrl && onResize && (
            <div
              className="absolute z-20 size-4 -translate-y-1/2 cursor-nwse-resize rounded-sm border border-primary bg-white"
              style={{
                left: `calc(${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.x : imageCenter.x) / Math.max(containerWidth, 1)) * 100}% + 28px)`,
                top: `${((watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.y : imageCenter.y) / Math.max(containerHeight, 1)) * 100}%`,
              }}
              onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
              onPointerMove={(event) => {
                if (!event.currentTarget.hasPointerCapture(event.pointerId) || !containerRef.current) return
                const rect = containerRef.current.getBoundingClientRect()
                const cx = watermarkMode === "text" || watermarkMode === "emoji" ? textCenter.x : imageCenter.x
                const dx = Math.abs(event.clientX - rect.left - cx)
                onResize(Math.min(160, Math.max(12, Math.round(dx))))
              }}
              aria-label="Resize watermark"
            />
          )}
          {sampling && (
            <div
              className="absolute inset-0 z-30 cursor-crosshair"
              onClick={(event) => {
                const host = event.currentTarget.parentElement
                const img = host?.querySelector("img")
                if (!(img instanceof HTMLImageElement) || !img.complete || !onSample) return
                const rect = img.getBoundingClientRect()
                const sample = document.createElement("canvas")
                sample.width = Math.max(1, img.naturalWidth)
                sample.height = Math.max(1, img.naturalHeight)
                const ctx = sample.getContext("2d")
                if (!ctx) return
                ctx.drawImage(img, 0, 0)
                const x = Math.min(sample.width - 1, Math.max(0, Math.round(((event.clientX - rect.left) / Math.max(rect.width, 1)) * sample.width)))
                const y = Math.min(sample.height - 1, Math.max(0, Math.round(((event.clientY - rect.top) / Math.max(rect.height, 1)) * sample.height)))
                const pixel = ctx.getImageData(x, y, 1, 1).data
                const hex = `#${[pixel[0], pixel[1], pixel[2]].map((part) => part.toString(16).padStart(2, "0")).join("")}`
                releaseCanvas(sample)
                onSample(hex)
              }}
            />
          )}
          {imagePreviewUrl && watermarkMode === "signature" && !signaturePreviewUrl && (
            <p className="absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground/80 shadow-sm">
                Draw a signature to stamp it here
              </span>
            </p>
          )}
          {imagePreviewUrl && watermarkMode === "logo" && !logoPreviewUrl && (
            <p className="absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground/80 shadow-sm">
                Upload a logo to stamp it here
              </span>
            </p>
          )}
          {imagePreviewUrl && watermarkMode === "qr" && !qrDataUrl && (
            <p className="absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium text-foreground/80 shadow-sm">
                {qrUrl.trim() ? "Check the link to stamp a QR code" : "Enter a link to stamp a QR code"}
              </span>
            </p>
          )}
        </div>

        {/* Upload prompt — shown when no image */}
        {!imagePreviewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 py-8">
            <div className="w-full max-w-sm rounded-xl border-2 border-dashed border-border/50 bg-background/60 backdrop-blur-sm shadow-sm">
              <ImageUploader
                onImageSelect={onImageSelect}
                onFiles={onFiles}
                hasImage={false}
                multiple={multiple}
                detail={uploadDetail}
              />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <ImageIcon className="size-3.5" />
              Watermark preview is live — upload an image to see the final result
            </p>
          </div>
        )}
      </div>
      </div>
      <StrengthBar state={state} compare={compare} onCompare={setCompare} />
    </div>
  )
}

function StrengthBar({
  state,
  compare,
  onCompare,
}: {
  state: EditorState
  compare: number
  onCompare: (value: number) => void
}) {
  const result = watermarkStrength(state)
  return (
    <div data-panel="strength" className="space-y-2 border-t border-black/5 bg-white px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{result.label}</p>
        <p className="text-[11px] text-muted-foreground">Before / after</p>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{result.note}</p>
      <Slider
        min={0}
        max={100}
        step={1}
        suffix="%"
        value={[compare]}
        aria-label="Compare before and after"
        onValueChange={([next]) => onCompare(next)}
      />
    </div>
  )
}

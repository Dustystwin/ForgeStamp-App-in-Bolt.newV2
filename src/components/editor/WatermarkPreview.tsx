import { useRef, useState, useEffect, useLayoutEffect } from "react"
import type { EditorState } from "@/lib/editor-types"
import { ImageUploader } from "./ImageUploader"
import {
  getPlacementPositionStyle,
  getWatermarkTransform,
  getPatternPoints,
  getDirectionRotationOffset,
  isStackedDirection,
  getPatternTextAngle,
  drawStamp,
} from "@/lib/watermark-utils"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface WatermarkPreviewProps {
  state: EditorState
  onImageSelect: (file: File) => void
  // Increment this timestamp to trigger a manual canvas clear without redrawing
  coverageClearedAt?: number
}

export function WatermarkPreview({
  state,
  onImageSelect,
  coverageClearedAt = 0,
}: WatermarkPreviewProps) {
  const {
    imagePreviewUrl,
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
  } = state

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [containerHeight, setContainerHeight] = useState(400)
  // Tracks the last clearAt value we have acted on
  const lastClearedAtRef = useRef(0)

  // Track container size via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setContainerWidth(width)
          setContainerHeight(height)
        }
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Wipe the canvas whenever we leave full-coverage mode so there is no
  // stale content if the user returns to full coverage later.
  useLayoutEffect(() => {
    if (coverageMode !== "full") {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      canvas.width = 0
      canvas.height = 0
    }
  }, [coverageMode])

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
    if (coverageMode !== "full") return

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

    if (containerWidth <= 0 || containerHeight <= 0) return

    const draw = () => {
      // Assigning canvas.width erases all pixel data — this is the authoritative clear
      // that eliminates any previously drawn pattern before drawing the new one.
      canvas.width = containerWidth
      canvas.height = containerHeight

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Match export scaling: geometric mean of dimensions, so ultra-wide or
      // ultra-tall images get proportionate text instead of oversized rows.
      const sizeScale = Math.sqrt(containerWidth * containerHeight) / 800
      const scaledFontSize = Math.max(12, Math.round(fontSize * sizeScale))
      ctx.font = `bold ${scaledFontSize}px "${fontFamily}", sans-serif`
      ctx.fillStyle = color
      ctx.globalAlpha = opacity / 100
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const patternAngle = getPatternTextAngle(pattern)
      const stacked = isStackedDirection(textDirection)
      const stackedLineHeight = stacked ? scaledFontSize * 1.02 : undefined
      const totalRotation = rotation + getDirectionRotationOffset(textDirection) + patternAngle
      const normalizedSpacing = density * sizeScale
      const text = watermarkText || "\u00A0"
      // Measure the rendered text (font already set on ctx above); stacked
      // vertical text occupies a narrow-but-tall box instead.
      const chars = Array.from(text)
      const textWidth = stacked
        ? Math.max(...chars.map((c) => ctx.measureText(c).width), 1)
        : ctx.measureText(text).width
      const effTextHeight = stacked ? chars.length * scaledFontSize * 1.02 : scaledFontSize
      const points = getPatternPoints(containerWidth, containerHeight, pattern, normalizedSpacing, textWidth, effTextHeight, curveOrientation)

      for (const pt of points) {
        drawStamp(ctx, text, pt, totalRotation, curveOrientation, stackedLineHeight)
      }
    }

    draw()

    // Web fonts load lazily — if the selected font wasn't downloaded yet, the draw
    // above used a fallback font. Request it and redraw once it arrives so the
    // pattern (and its text-width-based spacing) reflects the real font.
    let cancelled = false
    try {
      const fontSpec = `bold ${Math.max(12, Math.round(fontSize * (Math.sqrt(containerWidth * containerHeight) / 800)))}px "${fontFamily}"`
      if (!document.fonts.check(fontSpec)) {
        document.fonts
          .load(fontSpec, watermarkText || "M")
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
    curveOrientation,
  ])

  const scaledFontSize = Math.max(12, Math.round(fontSize * (Math.sqrt(containerWidth * containerHeight) / 800)))
  const positionStyle = getPlacementPositionStyle(placement)
  const transformStyle = getWatermarkTransform(placement, rotation, textDirection)

  const stackedSingle = isStackedDirection(textDirection)
  const singleWatermarkStyle: React.CSSProperties = {
    ...positionStyle,
    fontFamily,
    fontSize: `${scaledFontSize}px`,
    color,
    opacity: opacity / 100,
    transform: transformStyle,
    position: "absolute",
    whiteSpace: "nowrap",
    fontWeight: "bold",
    lineHeight: 1,
    // Vertical Down = upright letters stacked top-to-bottom, readable without
    // tilting your head (sign style).
    ...(stackedSingle ? { writingMode: "vertical-rl" as const, textOrientation: "upright" as const, letterSpacing: "0.05em" } : {}),
    pointerEvents: "none",
    userSelect: "none",
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-xl border border-border/40 overflow-hidden",
        "min-h-[260px] md:min-h-[360px]",
        imagePreviewUrl
          ? "bg-[repeating-conic-gradient(oklch(0.93_0_0)_0%_25%,oklch(0.97_0_0)_0%_50%)] bg-[length:16px_16px]"
          : "bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-background"
      )}
    >
      <div
        ref={containerRef}
        className={cn(
          "relative",
          imagePreviewUrl
            ? "inline-block max-h-full max-w-full"
            : "w-full min-h-[260px] md:min-h-[360px]"
        )}
        onLoad={() => {
          if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth)
            setContainerHeight(containerRef.current.offsetHeight)
          }
        }}
      >
        {/* Uploaded image */}
        {imagePreviewUrl ? (
          <img
            src={imagePreviewUrl}
            alt="Uploaded image preview"
            className="block max-h-[45vh] md:max-h-[min(45vh,460px)] max-w-full object-contain"
            draggable={false}
            onLoad={() => {
              if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
                setContainerHeight(containerRef.current.offsetHeight)
              }
            }}
          />
        ) : null}

        {/* Watermark overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 overflow-hidden"
        >
          {/*
            Canvas stays in the DOM at all times so canvasRef is always valid.
            CSS-hidden (not unmounted) in single mode — no remount timing races.
          */}
          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 w-full h-full",
              coverageMode !== "full" && "hidden"
            )}
          />
          {coverageMode === "single" && (
            <div style={singleWatermarkStyle}>
              <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
                {watermarkText || "\u00A0"}
              </span>
            </div>
          )}
        </div>

        {/* Upload prompt — shown when no image */}
        {!imagePreviewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 py-8">
            <div className="w-full max-w-sm rounded-xl border-2 border-dashed border-border/50 bg-background/60 backdrop-blur-sm shadow-sm">
              <ImageUploader onImageSelect={onImageSelect} hasImage={false} />
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <ImageIcon className="size-3.5" />
              Watermark preview is live — upload an image to see the final result
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

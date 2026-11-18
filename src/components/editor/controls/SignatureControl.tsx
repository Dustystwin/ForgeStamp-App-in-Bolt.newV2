import { useEffect, useRef, type PointerEvent } from "react"
import { Eraser } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { canvasToBlob, releaseCanvas } from "@/lib/image-resources"

interface SignatureControlProps {
  onChange: (blob: Blob) => void
  onClear: () => void
}

interface Point {
  x: number
  y: number
}

function paintStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: Point[][],
  lineWidth: number,
  offsetX = 0,
  offsetY = 0,
) {
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.strokeStyle = "#1a1a1a"
  ctx.lineWidth = lineWidth
  for (const points of strokes) {
    if (points.length === 0) continue
    ctx.beginPath()
    ctx.moveTo(points[0].x + offsetX, points[0].y + offsetY)
    if (points.length === 1) {
      ctx.lineTo(points[0].x + offsetX + 0.1, points[0].y + offsetY)
    } else {
      for (let i = 1; i < points.length - 1; i++) {
        const midX = (points[i].x + points[i + 1].x) / 2
        const midY = (points[i].y + points[i + 1].y) / 2
        ctx.quadraticCurveTo(points[i].x + offsetX, points[i].y + offsetY, midX + offsetX, midY + offsetY)
      }
      const last = points[points.length - 1]
      ctx.lineTo(last.x + offsetX, last.y + offsetY)
    }
    ctx.stroke()
  }
}

/**
 * The pad is mostly empty. Stamping that whole rectangle shrinks the ink
 * to a hairline. Fit the strokes to their own bounds and keep the pen a
 * steady share of that mark, so size changes the signature itself.
 */
function renderSignatureMark(strokes: Point[][]): HTMLCanvasElement | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const stroke of strokes) {
    for (const point of stroke) {
      if (point.x < minX) minX = point.x
      if (point.y < minY) minY = point.y
      if (point.x > maxX) maxX = point.x
      if (point.y > maxY) maxY = point.y
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null
  const inkW = Math.max(1, maxX - minX)
  const inkH = Math.max(1, maxY - minY)
  const longSide = Math.max(inkW, inkH)
  const pen = Math.max(2, longSide * 0.045)
  const margin = pen * 1.6
  const width = inkW + margin * 2
  const height = inkH + margin * 2
  const scale = Math.max(2, 640 / Math.max(width, height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width * scale))
  canvas.height = Math.max(1, Math.round(height * scale))
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  paintStrokes(ctx, strokes, pen, margin - minX, margin - minY)
  return canvas
}

export function SignatureControl({ onChange, onClear }: SignatureControlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Point[][]>([])
  const active = useRef<Point[] | null>(null)

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width < 2 || height < 2) return
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    const pen = Math.max(2.75, Math.min(width, height) * 0.02)
    const marks = active.current ? [...strokes.current, active.current] : strokes.current
    paintStrokes(ctx, marks, pen)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new ResizeObserver(() => draw())
    observer.observe(canvas)
    draw()
    return () => observer.disconnect()
  }, [])

  const pointFrom = (event: PointerEvent<HTMLCanvasElement>): Point => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const publish = () => {
    if (strokes.current.length === 0) return
    const mark = renderSignatureMark(strokes.current)
    if (!mark) return
    void canvasToBlob(mark, "image/png").then((blob) => {
      releaseCanvas(mark)
      if (blob) onChange(blob)
    })
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">Signature</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2 text-[11px]"
          onClick={() => {
            strokes.current = []
            active.current = null
            draw()
            onClear()
          }}
        >
          <Eraser className="size-3.5" />
          Clear
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-lg border border-border/70 bg-white"
        aria-label="Draw a signature"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          active.current = [pointFrom(event)]
          draw()
        }}
        onPointerMove={(event) => {
          if (!active.current) return
          active.current.push(pointFrom(event))
          draw()
        }}
        onPointerUp={(event) => {
          if (!active.current) return
          active.current.push(pointFrom(event))
          if (active.current.length > 0) strokes.current.push(active.current)
          active.current = null
          draw()
          publish()
        }}
        onPointerCancel={() => {
          active.current = null
          draw()
        }}
      />
      <p className="text-[10px] leading-snug text-muted-foreground">
        Draw with a finger or mouse. The drawing stays on this device and is stamped like a logo.
      </p>
    </div>
  )
}

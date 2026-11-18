import { useEffect, useRef, type PointerEvent } from "react"
import { Eraser } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { canvasToBlob } from "@/lib/image-resources"

interface SignatureControlProps {
  onChange: (blob: Blob) => void
  onClear: () => void
}

interface Point {
  x: number
  y: number
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
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2.75
    const paint = (points: Point[]) => {
      if (points.length === 0) return
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      if (points.length === 1) {
        ctx.lineTo(points[0].x + 0.1, points[0].y)
      } else {
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2
          const midY = (points[i].y + points[i + 1].y) / 2
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
        }
        const last = points[points.length - 1]
        ctx.lineTo(last.x, last.y)
      }
      ctx.stroke()
    }
    for (const stroke of strokes.current) paint(stroke)
    if (active.current) paint(active.current)
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
    const canvas = canvasRef.current
    if (!canvas || strokes.current.length === 0) return
    void canvasToBlob(canvas, "image/png").then((blob) => {
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

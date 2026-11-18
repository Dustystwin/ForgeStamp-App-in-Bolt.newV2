import { FlipHorizontal, FlipVertical, RotateCcw, RotateCw } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { CropAspect, FrameMode } from "@/lib/editor-types"
import { cn } from "@/lib/utils"

interface FrameControlProps {
  aspect: CropAspect
  mode: FrameMode
  quarterTurns: number
  flipHorizontal: boolean
  flipVertical: boolean
  grayscale: boolean
  onAspectChange: (value: CropAspect) => void
  onModeChange: (value: FrameMode) => void
  onQuarterTurnsChange: (value: number) => void
  onFlipHorizontalChange: (value: boolean) => void
  onFlipVerticalChange: (value: boolean) => void
  onGrayscaleChange: (value: boolean) => void
}

const ASPECTS: { value: CropAspect; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
]

const MODES: { value: FrameMode; label: string; hint: string }[] = [
  { value: "fit", label: "Fit", hint: "Show the whole photo. Empty space uses a soft blurred copy." },
  { value: "fill", label: "Fill", hint: "Cover the frame. The usual choice for a new ratio." },
  { value: "stretch", label: "Stretch", hint: "Pull the photo to the edges. The shape changes." },
]

function Pill({
  pressed,
  label,
  title,
  onClick,
  children,
}: {
  pressed?: boolean
  label: string
  title?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      title={title ?? label}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-8 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        pressed
          ? "border-primary bg-primary/15 text-primary"
          : "border-black/10 bg-white/75 text-foreground hover:bg-white"
      )}
    >
      {children}
    </button>
  )
}

export function FrameControl({
  aspect,
  mode,
  quarterTurns,
  flipHorizontal,
  flipVertical,
  grayscale,
  onAspectChange,
  onModeChange,
  onQuarterTurnsChange,
  onFlipHorizontalChange,
  onFlipVerticalChange,
  onGrayscaleChange,
}: FrameControlProps) {
  const turns = ((quarterTurns % 4) + 4) % 4
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Frame</Label>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Frame shape">
        {ASPECTS.map((option) => (
          <Pill
            key={option.value}
            pressed={aspect === option.value}
            label={option.label}
            onClick={() => {
              onAspectChange(option.value)
              onModeChange(option.value === "original" ? "fit" : "fill")
            }}
          >
            {option.label}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="How the photo fills the frame">
        {MODES.map((option) => (
          <Pill
            key={option.value}
            pressed={mode === option.value}
            label={option.label}
            title={option.hint}
            onClick={() => onModeChange(option.value)}
          >
            {option.label}
          </Pill>
        ))}
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Turn and flip">
        <Pill label="Rotate left" onClick={() => onQuarterTurnsChange((turns + 3) % 4)}>
          <RotateCcw className="size-3.5" />
          Left
        </Pill>
        <Pill label="Rotate right" onClick={() => onQuarterTurnsChange((turns + 1) % 4)}>
          <RotateCw className="size-3.5" />
          Right
        </Pill>
        <Pill pressed={flipHorizontal} label="Flip horizontal" onClick={() => onFlipHorizontalChange(!flipHorizontal)}>
          <FlipHorizontal className="size-3.5" />
          Flip H
        </Pill>
        <Pill pressed={flipVertical} label="Flip vertical" onClick={() => onFlipVerticalChange(!flipVertical)}>
          <FlipVertical className="size-3.5" />
          Flip V
        </Pill>
        <Pill pressed={grayscale} label={grayscale ? "Black and white on" : "Black and white"} onClick={() => onGrayscaleChange(!grayscale)}>
          B&W
        </Pill>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        {turns ? `Turned ${turns * 90}°. ` : ""}
        Fill covers the frame. Fit keeps the whole photo. The same frame is used on every photo in a batch.
      </p>
    </div>
  )
}

import type {
  EditorState,
  Placement,
  TextDirection,
  CoverageMode,
  CurveOrientation,
  Pattern,
} from "@/lib/editor-types"
import { TextControl } from "./controls/TextControl"
import { FontControl } from "./controls/FontControl"
import { FontSizeControl } from "./controls/FontSizeControl"
import { OpacityControl } from "./controls/OpacityControl"
import { RotationControl } from "./controls/RotationControl"
import { ColorControl } from "./controls/ColorControl"
import { PlacementControl } from "./controls/PlacementControl"
import { TextDirectionControl } from "./controls/TextDirectionControl"
import { CoverageModeControl } from "./controls/CoverageModeControl"
import { PatternControl } from "./controls/PatternControl"
import { DensityControl } from "./controls/DensityControl"
import { CurveOrientationControl } from "./controls/CurveOrientationControl"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface WatermarkControlsProps {
  state: EditorState
  onTextChange: (value: string) => void
  onFontChange: (value: string) => void
  onFontSizeChange: (value: number) => void
  onOpacityChange: (value: number) => void
  onRotationChange: (value: number) => void
  onColorChange: (value: string) => void
  onPlacementChange: (value: Placement) => void
  onTextDirectionChange: (value: TextDirection) => void
  onCoverageModeChange: (value: CoverageMode) => void
  onCurveOrientationChange: (value: CurveOrientation) => void
  onPatternChange: (value: Pattern) => void
  onDensityChange: (value: number) => void
  onClearCoverage: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 pb-0.5">
      {children}
    </p>
  )
}

export function WatermarkControls({
  state,
  onTextChange,
  onFontChange,
  onFontSizeChange,
  onOpacityChange,
  onRotationChange,
  onColorChange,
  onPlacementChange,
  onTextDirectionChange,
  onCoverageModeChange,
  onCurveOrientationChange,
  onPatternChange,
  onDensityChange,
  onClearCoverage,
}: WatermarkControlsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <SectionLabel>Text</SectionLabel>
        <TextControl value={state.watermarkText} onChange={onTextChange} />
        <TextDirectionControl value={state.textDirection} onChange={onTextDirectionChange} />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionLabel>Font</SectionLabel>
        <FontControl value={state.fontFamily} onChange={onFontChange} />
        <FontSizeControl value={state.fontSize} onChange={onFontSizeChange} />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionLabel>Style</SectionLabel>
        <ColorControl value={state.color} onChange={onColorChange} />
        <OpacityControl value={state.opacity} onChange={onOpacityChange} />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionLabel>Transform</SectionLabel>
        <RotationControl value={state.rotation} onChange={onRotationChange} />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionLabel>Coverage</SectionLabel>
        <CoverageModeControl value={state.coverageMode} onChange={onCoverageModeChange} />
        {state.coverageMode === "full" && (
          <>
            <PatternControl value={state.pattern} onChange={onPatternChange} />
            {["radial", "spiral", "concentric"].includes(state.pattern) && (
              <CurveOrientationControl
                value={state.curveOrientation}
                onChange={onCurveOrientationChange}
              />
            )}
            <DensityControl value={state.density} onChange={onDensityChange} />
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCoverage}
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Clear Full Coverage Layer
            </Button>
          </>
        )}
        {state.coverageMode === "single" && (
          <PlacementControl value={state.placement} onChange={onPlacementChange} />
        )}
      </div>
    </div>
  )
}

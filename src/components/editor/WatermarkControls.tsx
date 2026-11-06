import type {
  EditorState,
  Placement,
  TextDirection,
  CoverageMode,
  CurveOrientation,
  Pattern,
  WatermarkMode,
} from "@/lib/editor-types"
import { STAMP_SIZE_MAX, STAMP_SIZE_MIN } from "@/lib/editor-types"
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
import { WatermarkModeControl } from "./controls/WatermarkModeControl"
import { LogoControl } from "./controls/LogoControl"
import { QrControl } from "./controls/QrControl"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface WatermarkControlsProps {
  state: EditorState
  onModeChange: (value: WatermarkMode) => void
  onTextChange: (value: string) => void
  onFontChange: (value: string) => void
  onFontSizeChange: (value: number) => void
  onStampSizeChange: (value: number) => void
  onOpacityChange: (value: number) => void
  onRotationChange: (value: number) => void
  onColorChange: (value: string) => void
  onPlacementChange: (value: Placement) => void
  onTextDirectionChange: (value: TextDirection) => void
  onCoverageModeChange: (value: CoverageMode) => void
  onCurveOrientationChange: (value: CurveOrientation) => void
  onPatternChange: (value: Pattern) => void
  onDensityChange: (value: number) => void
  onQrUrlChange: (value: string) => void
  onQrColorChange: (value: string) => void
  onLogoSelect: (file: File) => void
  onLogoClear: () => void
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
  onModeChange,
  onTextChange,
  onFontChange,
  onFontSizeChange,
  onStampSizeChange,
  onOpacityChange,
  onRotationChange,
  onColorChange,
  onPlacementChange,
  onTextDirectionChange,
  onCoverageModeChange,
  onCurveOrientationChange,
  onPatternChange,
  onDensityChange,
  onQrUrlChange,
  onQrColorChange,
  onLogoSelect,
  onLogoClear,
  onClearCoverage,
}: WatermarkControlsProps) {
  const mode = state.watermarkMode
  // Curve direction changes radial stamp angles. Spiral and concentric only
  // bend text, so those toggles stay hidden for a logo or QR.
  const showCurve =
    state.coverageMode === "full" &&
    (mode === "text"
      ? ["radial", "spiral", "concentric"].includes(state.pattern)
      : state.pattern === "radial")

  return (
    <div className="space-y-4">
      <WatermarkModeControl value={mode} onChange={onModeChange} />

      <Separator />

      {mode === "text" && (
        <div className="space-y-3">
          <SectionLabel>Text</SectionLabel>
          <TextControl value={state.watermarkText} onChange={onTextChange} />
          <FontControl value={state.fontFamily} onChange={onFontChange} />
          <FontSizeControl value={state.fontSize} onChange={onFontSizeChange} />
          <TextDirectionControl value={state.textDirection} onChange={onTextDirectionChange} />
        </div>
      )}

      {mode === "logo" && (
        <div className="space-y-3">
          <SectionLabel>Logo</SectionLabel>
          <LogoControl
            previewUrl={state.logoPreviewUrl}
            fileName={state.logoName}
            onSelect={onLogoSelect}
            onClear={onLogoClear}
          />
          <FontSizeControl
            id="stamp-size"
            label="Size"
            min={STAMP_SIZE_MIN}
            max={STAMP_SIZE_MAX}
            value={state.stampSize}
            onChange={onStampSizeChange}
          />
        </div>
      )}

      {mode === "qr" && (
        <div className="space-y-3">
          <SectionLabel>QR code</SectionLabel>
          <QrControl value={state.qrUrl} color={state.qrColor} onChange={onQrUrlChange} />
          <FontSizeControl
            id="stamp-size"
            label="Size"
            min={STAMP_SIZE_MIN}
            max={STAMP_SIZE_MAX}
            value={state.stampSize}
            onChange={onStampSizeChange}
          />
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <SectionLabel>Style</SectionLabel>
        {mode === "text" && <ColorControl value={state.color} onChange={onColorChange} />}
        {mode === "qr" && <ColorControl value={state.qrColor} onChange={onQrColorChange} />}
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
            {showCurve && (
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
      </div>

      {state.coverageMode === "single" && (
        <>
          <Separator />
          <div className="space-y-3">
            <SectionLabel>Position</SectionLabel>
            <PlacementControl value={state.placement} onChange={onPlacementChange} />
          </div>
        </>
      )}
    </div>
  )
}

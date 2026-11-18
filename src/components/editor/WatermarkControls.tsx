import type {
  EditorState,
  Placement,
  TextDirection,
  CoverageMode,
  CurveOrientation,
  Pattern,
  WatermarkMode,
  DateStampFormat,
  CropAspect,
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
import { PresetControl } from "./controls/PresetControl"
import { DateStampControl } from "./controls/DateStampControl"
import { TextStyleControl } from "./controls/TextStyleControl"
import { FrameControl } from "./controls/FrameControl"
import { SignatureControl } from "./controls/SignatureControl"
import { useAuth } from "@/context/AuthContext"
import { canUseSparkTools } from "@/lib/plans"
import type { PresetSettings } from "@/lib/preset-settings"
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
  onSignatureChange: (blob: Blob) => void
  onSignatureClear: () => void
  onOutlineWidthChange: (value: number) => void
  onOutlineColorChange: (value: string) => void
  onShadowEnabledChange: (value: boolean) => void
  onShadowColorChange: (value: string) => void
  onShadowBlurChange: (value: number) => void
  onShadowOffsetXChange: (value: number) => void
  onShadowOffsetYChange: (value: number) => void
  onDateStampChange: (value: DateStampFormat) => void
  onCropAspectChange: (value: CropAspect) => void
  onQuarterTurnsChange: (value: number) => void
  onClearCoverage: () => void
  onApplySettings: (settings: PresetSettings) => void
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
  onSignatureChange,
  onSignatureClear,
  onOutlineWidthChange,
  onOutlineColorChange,
  onShadowEnabledChange,
  onShadowColorChange,
  onShadowBlurChange,
  onShadowOffsetXChange,
  onShadowOffsetYChange,
  onDateStampChange,
  onCropAspectChange,
  onQuarterTurnsChange,
  onClearCoverage,
  onApplySettings,
}: WatermarkControlsProps) {
  const { profile } = useAuth()
  const spark = canUseSparkTools(profile?.tier, Boolean(profile?.is_admin))
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
      <WatermarkModeControl value={mode} signatureUnlocked={spark} onChange={onModeChange} />
      <FrameControl
        aspect={state.cropAspect}
        quarterTurns={state.quarterTurns}
        onAspectChange={onCropAspectChange}
        onQuarterTurnsChange={onQuarterTurnsChange}
      />
      <PresetControl state={state} onApply={onApplySettings} />

      <Separator />

      {mode === "text" && (
        <div className="space-y-3">
          <SectionLabel>Text</SectionLabel>
          <TextControl value={state.watermarkText} onChange={onTextChange} />
          <DateStampControl value={state.dateStamp} onChange={onDateStampChange} />
          <FontControl value={state.fontFamily} onChange={onFontChange} />
          <FontSizeControl value={state.fontSize} onChange={onFontSizeChange} />
          <TextDirectionControl value={state.textDirection} onChange={onTextDirectionChange} />
          <TextStyleControl
            outlineWidth={state.outlineWidth}
            outlineColor={state.outlineColor}
            shadowEnabled={state.shadowEnabled}
            shadowColor={state.shadowColor}
            shadowBlur={state.shadowBlur}
            shadowOffsetX={state.shadowOffsetX}
            shadowOffsetY={state.shadowOffsetY}
            shadowUnlocked={spark}
            onOutlineWidthChange={onOutlineWidthChange}
            onOutlineColorChange={onOutlineColorChange}
            onShadowEnabledChange={onShadowEnabledChange}
            onShadowColorChange={onShadowColorChange}
            onShadowBlurChange={onShadowBlurChange}
            onShadowOffsetXChange={onShadowOffsetXChange}
            onShadowOffsetYChange={onShadowOffsetYChange}
          />
        </div>
      )}

      {mode === "signature" && (
        <div className="space-y-3">
          <SectionLabel>Signature</SectionLabel>
          <SignatureControl onChange={onSignatureChange} onClear={onSignatureClear} />
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

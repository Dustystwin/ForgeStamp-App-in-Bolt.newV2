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
  FrameMode,
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
import { TrackQrControl } from "./controls/TrackQrControl"
import { PresetControl } from "./controls/PresetControl"
import { DateStampControl } from "./controls/DateStampControl"
import { TextStyleControl } from "./controls/TextStyleControl"
import { FrameControl } from "./controls/FrameControl"
import { SignatureControl } from "./controls/SignatureControl"
import { LayerPanel } from "./controls/LayerPanel"
import { BrandKitControl } from "./controls/BrandKitControl"
import { HandleControl } from "./controls/HandleControl"
import type { BrandKit } from "@/lib/brand-kit"
import { EyedropperButton } from "./controls/EyedropperButton"
import { EMOJI_CHOICES, STICKERS } from "@/lib/stickers"
import type { MarkLayer } from "@/lib/mark-layer"
import { useAuth } from "@/context/AuthContext"
import { canUseSparkTools, effectivePlan } from "@/lib/plans"
import { toast } from "sonner"
import type { PresetSettings } from "@/lib/preset-settings"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
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
  onFrameModeChange: (value: FrameMode) => void
  onQuarterTurnsChange: (value: number) => void
  onFlipHorizontalChange: (value: boolean) => void
  onFlipVerticalChange: (value: boolean) => void
  onEmojiChange: (value: string) => void
  onStickerChange: (value: string) => void
  onGradientOnChange: (value: boolean) => void
  onGradientAChange: (value: string) => void
  onGradientBChange: (value: string) => void
  onGradientCChange: (value: string) => void
  onGradientAngleChange: (value: number) => void
  onGrayscaleChange: (value: boolean) => void
  onSampleRequest: (target: "color" | "outline" | "shadow") => void
  layers: MarkLayer[]
  activeLayerId: string
  layerLimit: number
  onSelectLayer: (id: string) => void
  onAddLayer: (limit: number) => boolean
  onDuplicateLayer: (limit: number) => boolean
  onDeleteLayer: (id: string) => void
  onMoveLayer: (id: string, direction: -1 | 1) => void
  onHideLayer: (id: string) => void
  onLockLayer: (id: string) => void
  onClearCoverage: () => void
  onApplySettings: (settings: PresetSettings) => void
  onUseBrand: (kit: BrandKit) => void
  onAutoContrastChange: (value: boolean) => void
  onHandlePlatformChange: (value: EditorState["handlePlatform"]) => void
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
  onFrameModeChange,
  onQuarterTurnsChange,
  onFlipHorizontalChange,
  onFlipVerticalChange,
  onEmojiChange,
  onStickerChange,
  onGradientOnChange,
  onGradientAChange,
  onGradientBChange,
  onGradientCChange,
  onGradientAngleChange,
  onGrayscaleChange,
  onSampleRequest,
  layers,
  activeLayerId,
  layerLimit,
  onSelectLayer,
  onAddLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onMoveLayer,
  onHideLayer,
  onLockLayer,
  onClearCoverage,
  onApplySettings,
  onUseBrand,
  onAutoContrastChange,
  onHandlePlatformChange,
}: WatermarkControlsProps) {
  const { profile } = useAuth()
  const spark = canUseSparkTools(profile?.tier, Boolean(profile?.is_admin))
  const plan = effectivePlan(profile?.tier, Boolean(profile?.is_admin))
  const mode = state.watermarkMode
  // Curve direction changes radial stamp angles. Spiral and concentric only
  // bend text, so those toggles stay hidden for a logo or QR.
  const showCurve =
    state.coverageMode === "full" &&
    (mode === "text" || mode === "emoji"
      ? ["radial", "spiral", "concentric"].includes(state.pattern)
      : state.pattern === "radial")

  return (
    <div className="space-y-4">
      <BrandKitControl plan={plan} onUse={onUseBrand} />
      <div data-panel="auto-contrast" className="space-y-1">
        <button
          type="button"
          aria-pressed={state.autoContrast}
          onClick={() => onAutoContrastChange(!state.autoContrast)}
          className={cn(
            "min-h-10 w-full rounded-lg border px-3 text-sm font-medium",
            state.autoContrast ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-white text-foreground",
          )}
        >
          {state.autoContrast ? "Auto contrast on" : "Auto contrast"}
        </button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Looks at the photo under each mark and picks black or white. A gray area also gets an outline, or a plate behind a logo or QR.
        </p>
      </div>
      <LayerPanel
        layers={layers}
        activeId={activeLayerId}
        limit={layerLimit}
        onSelect={onSelectLayer}
        onAdd={onAddLayer}
        onDuplicate={onDuplicateLayer}
        onDelete={onDeleteLayer}
        onMove={onMoveLayer}
        onHide={onHideLayer}
        onLock={onLockLayer}
      />
      <WatermarkModeControl value={mode} signatureUnlocked={spark} stickerUnlocked={spark} onChange={onModeChange} />
      <FrameControl
        aspect={state.cropAspect}
        mode={state.frameMode}
        quarterTurns={state.quarterTurns}
        flipHorizontal={state.flipHorizontal}
        flipVertical={state.flipVertical}
        grayscale={state.grayscale}
        onAspectChange={onCropAspectChange}
        onModeChange={onFrameModeChange}
        onQuarterTurnsChange={onQuarterTurnsChange}
        onFlipHorizontalChange={onFlipHorizontalChange}
        onFlipVerticalChange={onFlipVerticalChange}
        onGrayscaleChange={onGrayscaleChange}
      />
      <PresetControl state={state} onApply={onApplySettings} />

      <Separator />

      {mode === "text" && (
        <div className="space-y-3">
          <SectionLabel>Text</SectionLabel>
          <TextControl value={state.watermarkText} onChange={onTextChange} />
          <HandleControl
            text={state.watermarkText}
            platform={state.handlePlatform}
            iconsUnlocked={spark}
            onTextChange={onTextChange}
            onPlatformChange={onHandlePlatformChange}
          />
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Gradient fill</p>
              <button
                type="button"
                className={cn("min-h-8 rounded-md border px-2 text-[10px] font-medium", state.gradientOn && spark ? "border-primary text-primary" : "border-border/60", !spark && "opacity-60")}
                onClick={() => {
                  if (!spark) {
                    toast("Gradient text is included with Spark and Forge. Those plans are not for sale.")
                    return
                  }
                  onGradientOnChange(!state.gradientOn)
                }}
              >
                {spark ? (state.gradientOn ? "On" : "Off") : "Spark"}
              </button>
            </div>
            {spark && state.gradientOn && (
              <div className="flex flex-wrap items-center gap-2">
                <input aria-label="Gradient start" type="color" value={state.gradientA} onChange={(e) => onGradientAChange(e.target.value)} className="h-8 w-10" />
                <input aria-label="Gradient middle" type="color" value={state.gradientB} onChange={(e) => onGradientBChange(e.target.value)} className="h-8 w-10" />
                <input aria-label="Gradient end" type="color" value={state.gradientC || "#111111"} onChange={(e) => onGradientCChange(e.target.value)} className="h-8 w-10" />
                <label className="text-[10px] text-muted-foreground">Angle {state.gradientAngle}</label>
                <input aria-label="Gradient angle" type="range" min={0} max={360} value={state.gradientAngle} onChange={(e) => onGradientAngleChange(Number(e.target.value))} className="w-full" />
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "emoji" && (
        <div className="space-y-2">
          <SectionLabel>Emoji</SectionLabel>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_CHOICES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={state.emoji === item}
                className={cn("min-h-9 rounded-md border text-lg", state.emoji === item ? "border-primary bg-primary/10" : "border-border/50")}
                onClick={() => onEmojiChange(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <FontSizeControl value={state.fontSize} onChange={onFontSizeChange} />
        </div>
      )}

      {mode === "sticker" && (
        <div className="space-y-2">
          <SectionLabel>Stickers</SectionLabel>
          <div className="grid grid-cols-4 gap-1.5">
            {STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                aria-pressed={state.stickerId === sticker.id}
                className={cn("rounded-md border p-1 text-[10px]", state.stickerId === sticker.id ? "border-primary" : "border-border/50")}
                onClick={() => onStickerChange(sticker.id)}
              >
                <img src={`data:image/svg+xml;utf8,${encodeURIComponent(sticker.svg)}`} alt="" className="mx-auto h-10 w-10" />
                {sticker.label}
              </button>
            ))}
          </div>
          <FontSizeControl
            id="sticker-size"
            label="Size"
            min={STAMP_SIZE_MIN}
            max={STAMP_SIZE_MAX}
            value={state.stampSize}
            onChange={onStampSizeChange}
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
          <TrackQrControl onUseLink={onQrUrlChange} />
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
        {mode === "text" && (
          <div className="flex items-end gap-2">
            <div className="flex-1"><ColorControl value={state.color} onChange={onColorChange} /></div>
            <EyedropperButton onPick={onColorChange} onFallback={() => onSampleRequest("color")} />
          </div>
        )}
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
            <PatternControl
              value={state.pattern}
              coverage={state.coverageMode}
              onSingle={() => onCoverageModeChange("single")}
              onChange={(pattern) => {
                onCoverageModeChange("full")
                onPatternChange(pattern)
              }}
            />
            {showCurve && (
              <CurveOrientationControl
                value={state.curveOrientation}
                onChange={onCurveOrientationChange}
              />
            )}
            <p className="text-[10px] leading-snug text-muted-foreground">
              Spacing, size, rotation, and opacity apply to every pattern and every kind of mark.
            </p>
            <DensityControl value={state.density} onChange={onDensityChange} />
            {mode === "text" || mode === "emoji" ? (
              <FontSizeControl value={state.fontSize} onChange={onFontSizeChange} />
            ) : (
              <FontSizeControl id="pattern-stamp-size" label="Size" min={STAMP_SIZE_MIN} max={STAMP_SIZE_MAX} value={state.stampSize} onChange={onStampSizeChange} />
            )}
            <RotationControl value={state.rotation} onChange={onRotationChange} />
            <OpacityControl value={state.opacity} onChange={onOpacityChange} />
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

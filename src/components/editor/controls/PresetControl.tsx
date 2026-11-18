import { useCallback, useEffect, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"
import { FREE_COLORS, FREE_FONTS, type EditorState } from "@/lib/editor-types"
import {
  effectivePlan,
  planName,
  presetLimitForPlan,
  type PlanId,
} from "@/lib/plans"
import { parsePresetSettings, settingsFromEditor, type PresetSettings } from "@/lib/preset-settings"
import { supabase, type WatermarkPreset } from "@/lib/supabase"

interface PresetControlProps {
  state: EditorState
  onApply: (settings: PresetSettings) => void
}

const FREE_FONT_VALUES = new Set<string>(FREE_FONTS.map((font) => font.value))
const FREE_COLOR_VALUES = new Set<string>(FREE_COLORS.map((color) => color.value))

function forPlan(settings: PresetSettings, plan: PlanId): { settings: PresetSettings; notes: string[] } {
  if (plan !== "free") return { settings, notes: [] }
  const next = { ...settings }
  const notes: string[] = []
  if (!FREE_FONT_VALUES.has(next.fontFamily)) {
    next.fontFamily = "Inter"
    notes.push("The premium font stays off on Free.")
  }
  if (!FREE_COLOR_VALUES.has(next.color)) {
    next.color = "#FF8A00"
    notes.push("The premium color stays off on Free.")
  }
  if (next.watermarkMode === "qr" && !FREE_COLOR_VALUES.has(next.qrColor)) {
    next.qrColor = "#000000"
    notes.push("The premium QR color stays off on Free.")
  }
  if (next.exportFormat !== "png") {
    next.exportFormat = "png"
    notes.push("Free exports PNG.")
  }
  return { settings: next, notes }
}

export function PresetControl({ state, onApply }: PresetControlProps) {
  const { session, profile } = useAuth()
  const { openAuthModal } = useNavigation()
  const plan = effectivePlan(profile?.tier, Boolean(profile?.is_admin))
  const limit = presetLimitForPlan(plan)
  const [presets, setPresets] = useState<WatermarkPreset[]>([])
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<WatermarkPreset | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadPresets = useCallback(async () => {
    if (!session?.user) {
      setPresets([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from("watermark_presets")
      .select("id, name, settings, created_at, updated_at, user_id")
      .order("created_at", { ascending: false })
    if (error) {
      if (!/watermark_presets|schema cache|does not exist|could not find/i.test(error.message)) {
        toast.error("Could not load presets.")
      }
      setPresets([])
    } else {
      setPresets((data as WatermarkPreset[]) ?? [])
    }
    setLoading(false)
  }, [session?.user])

  useEffect(() => {
    let cancelled = false
    if (!session?.user) {
      setPresets([])
      return
    }
    setLoading(true)
    supabase
      .from("watermark_presets")
      .select("id, name, settings, created_at, updated_at, user_id")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          if (!/watermark_presets|schema cache|does not exist|could not find/i.test(error.message)) {
            toast.error("Could not load presets.")
          }
          setPresets([])
        } else {
          setPresets((data as WatermarkPreset[]) ?? [])
        }
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session?.user])

  const applyPreset = (preset: WatermarkPreset) => {
    const parsed = parsePresetSettings(preset.settings)
    if (!parsed) {
      toast.error("That preset could not be read.")
      return
    }
    const fitted = forPlan(parsed, plan)
    onApply(fitted.settings)
    if (fitted.settings.watermarkMode === "logo") {
      toast("Preset loaded. Upload the logo again — presets don't keep the logo file.")
    } else if (fitted.notes.length > 0) {
      toast(fitted.notes[0])
    } else {
      toast.success(`Loaded “${preset.name}”.`)
    }
  }

  const savePreset = async () => {
    if (!session?.user) {
      toast("Sign in to save a preset.", {
        action: { label: "Sign in", onClick: () => openAuthModal("sign-in") },
      })
      return
    }
    if (limit === 0) {
      toast("Saved presets are included with Spark (up to 10) and Forge (up to 200). Those plans are not for sale.")
      return
    }
    if (presets.length >= limit) {
      toast(
        plan === "spark"
          ? "Spark accounts can save 10 presets. Delete one to save another."
          : "Forge accounts can save 200 presets. Delete one to save another."
      )
      return
    }
    const trimmed = name.trim().slice(0, 60) || defaultPresetName(state)
    setSaving(true)
    const { error } = await supabase.from("watermark_presets").insert({
      user_id: session.user.id,
      name: trimmed,
      settings: settingsFromEditor(state),
    })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setName("")
    toast.success(`Saved “${trimmed}”.`)
    await loadPresets()
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const { error } = await supabase.from("watermark_presets").delete().eq("id", pendingDelete.id)
    setDeleting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setPresets((current) => current.filter((preset) => preset.id !== pendingDelete.id))
    setPendingDelete(null)
    toast.success("Preset deleted.")
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-xs font-medium">Saved presets</Label>
        {session && limit > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {presets.length} of {limit}
          </span>
        )}
      </div>

      {!session && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Sign in to save a preset. Spark saves up to 10. Forge saves up to 200. The logo file is not stored.
        </p>
      )}
      {session && limit === 0 && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Saved presets are included with Spark (up to 10) and Forge (up to 200). Those plans are not for sale.
          {presets.length > 0 ? " You can still load or delete presets already on this account." : ""}
        </p>
      )}
      {session && limit > 0 && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          {planName(plan)} saves the text, logo, or QR settings. Upload the logo again after loading a logo preset.
        </p>
      )}

      {session && limit > 0 && (
        <div className="flex gap-1.5">
          <Input
            value={name}
            maxLength={60}
            placeholder={defaultPresetName(state)}
            aria-label="Preset name"
            onChange={(event) => setName(event.target.value)}
            className="h-8 text-xs"
          />
          <Button type="button" size="sm" className="h-8 shrink-0 px-2.5 text-xs" disabled={saving} onClick={savePreset}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Save"}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
        </div>
      ) : presets.length > 0 ? (
        <ul className="max-h-36 space-y-1 overflow-y-auto">
          {presets.map((preset) => (
            <li key={preset.id} className="flex items-center gap-1">
              <button
                type="button"
                className="min-w-0 flex-1 truncate rounded-md px-1.5 py-1 text-left text-xs font-medium hover:bg-muted"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </button>
              <button
                type="button"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={`Delete preset ${preset.name}`}
                onClick={() => setPendingDelete(preset)}
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this preset?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `“${pendingDelete.name}” will be removed from this account.` : "This preset will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function defaultPresetName(state: EditorState): string {
  if (state.watermarkMode === "logo") return "Logo preset"
  if (state.watermarkMode === "qr") return "QR preset"
  const text = state.watermarkText.trim()
  return (text || "Your Text").slice(0, 60)
}

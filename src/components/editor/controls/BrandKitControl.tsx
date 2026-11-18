import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FONT_OPTIONS } from "@/lib/editor-types"
import {
  BRAND_COLOR_LIMIT,
  BRAND_FONT_LIMIT,
  BRAND_HANDLE_LIMIT,
  SAMPLE_BRAND_KIT,
  brandKitLimit,
  deleteBrandKit,
  loadBrandKits,
  saveBrandKit,
  tidyKit,
  type BrandKit,
} from "@/lib/brand-kit"
import type { PlanId } from "@/lib/plans"
import { useAuth } from "@/context/AuthContext"

function Swatches({ kit }: { kit: BrandKit }) {
  return (
    <div className="space-y-2 rounded-xl border border-black/5 bg-[#fffaf4] p-3">
      <p className="text-sm font-semibold text-foreground">{kit.name}</p>
      <div className="flex flex-wrap gap-1.5">
        {kit.colors.map((color) => (
          <span key={color} className="size-6 rounded-full border border-black/10" style={{ background: color }} title={color} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{kit.fonts.join(" · ")}</p>
      <p className="text-xs text-muted-foreground">{kit.handles.join("  ")}{kit.website ? ` · ${kit.website.replace(/^https?:\/\//, "")}` : ""}</p>
    </div>
  )
}

export function BrandKitControl({
  plan,
  onUse,
}: {
  plan: PlanId
  onUse: (kit: BrandKit) => void
}) {
  const { session } = useAuth()
  const limit = brandKitLimit(plan)
  const [kits, setKits] = useState<BrandKit[]>([])
  const [name, setName] = useState("My brand")
  const [fonts, setFonts] = useState<string[]>(["Inter"])
  const [colors, setColors] = useState<string[]>(["#FF8A00", "#111111"])
  const [handles, setHandles] = useState<string[]>(["@yourhandle"])
  const [website, setWebsite] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let gone = false
    loadBrandKits(session?.user.id ?? null).then((result) => {
      if (!gone) setKits(result.kits.slice(0, Math.max(limit, 0)))
    })
    return () => {
      gone = true
    }
  }, [session?.user.id, limit])

  if (limit < 1) {
    return (
      <section data-panel="brand-kit" className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Brand kit</p>
        <div className="space-y-2 rounded-xl border border-dashed border-black/10 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Lock className="size-3.5" />
            Spark keeps 1 brand kit. Forge keeps up to 5.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Free can look at a kit. Saving a logo, fonts, colors, and handle is on Spark and Forge. Those plans are not for sale.
          </p>
          <Swatches kit={SAMPLE_BRAND_KIT} />
        </div>
      </section>
    )
  }

  const save = async () => {
    setBusy(true)
    try {
      const kit = tidyKit({ name, fonts, colors, handles, website })
      const result = await saveBrandKit(session?.user.id ?? null, kit, kits, logoFile, limit)
      setKits(result.kits)
      setLogoFile(null)
      toast.success(result.note ?? "Brand kit saved.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save that kit.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section data-panel="brand-kit" className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Brand kit</p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Save a logo, up to {BRAND_FONT_LIMIT} fonts, {BRAND_COLOR_LIMIT} colors, and your handle. The logo sits in your account folder and counts toward 500 MB.
        {limit === 1 ? " Spark keeps 1 kit." : ` Forge keeps up to ${limit} kits.`}
      </p>
      {kits.map((kit) => (
        <div key={kit.id} className="space-y-2">
          <Swatches kit={kit} />
          <div className="flex gap-2">
            <Button type="button" size="sm" className="min-h-10 flex-1" onClick={() => onUse(kit)}>
              Use my brand
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10"
              onClick={async () => setKits(await deleteBrandKit(session?.user.id ?? null, kit.id, kits))}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
      {kits.length < limit && (
        <div className="space-y-2 rounded-xl border border-black/5 p-3">
          <Input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} aria-label="Brand name" />
          <label className="block text-xs text-muted-foreground">
            Logo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="mt-1 block w-full text-xs"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {fonts.map((font, index) => (
            <select
              key={index}
              className="h-10 w-full rounded-md border border-input bg-white px-2 text-sm"
              value={font}
              aria-label={`Brand font ${index + 1}`}
              onChange={(event) => setFonts(fonts.map((item, i) => (i === index ? event.target.value : item)))}
            >
              {FONT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ))}
          {fonts.length < BRAND_FONT_LIMIT && (
            <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={() => setFonts([...fonts, "Georgia"])}>
              Add font
            </Button>
          )}
          <div className="flex flex-wrap gap-2">
            {colors.map((color, index) => (
              <input
                key={index}
                type="color"
                value={color}
                aria-label={`Brand color ${index + 1}`}
                className="size-10 cursor-pointer rounded-md border border-black/10 bg-white"
                onChange={(event) => setColors(colors.map((item, i) => (i === index ? event.target.value : item)))}
              />
            ))}
            {colors.length < BRAND_COLOR_LIMIT && (
              <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={() => setColors([...colors, "#18B66A"])}>
                Add color
              </Button>
            )}
          </div>
          {handles.map((handle, index) => (
            <Input
              key={index}
              value={handle}
              maxLength={32}
              aria-label={`Handle ${index + 1}`}
              onChange={(event) => setHandles(handles.map((item, i) => (i === index ? event.target.value : item)))}
            />
          ))}
          {handles.length < BRAND_HANDLE_LIMIT && (
            <Button type="button" variant="outline" size="sm" className="min-h-10" onClick={() => setHandles([...handles, "@yourhandle"])}>
              Add handle
            </Button>
          )}
          <Input
            value={website}
            placeholder="https://example.com"
            aria-label="Website or shop link"
            onChange={(event) => setWebsite(event.target.value)}
          />
          <Button type="button" className="min-h-10 w-full" disabled={busy} onClick={save}>
            Save brand kit
          </Button>
        </div>
      )}
    </section>
  )
}

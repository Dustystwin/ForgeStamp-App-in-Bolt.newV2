import { useEffect, useState } from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { effectivePlan } from "@/lib/plans"
import {
  EMPTY_SOCIALS,
  loadOwnTrackPage,
  saveTrackPage,
  tidySlug,
  trackingUrl,
  type TrackSocials,
} from "@/lib/tracking"

export function TrackQrControl({ onUseLink }: { onUseLink: (url: string) => void }) {
  const { profile, session } = useAuth()
  const forge = effectivePlan(profile?.tier, Boolean(profile?.is_admin)) === "forge"
  const [slug, setSlug] = useState("your-shop")
  const [shopUrl, setShopUrl] = useState("https://example.com")
  const [contact, setContact] = useState("@yourhandle")
  const [socials, setSocials] = useState<TrackSocials>(EMPTY_SOCIALS)
  const [scans, setScans] = useState<number | null>(null)
  const [id, setId] = useState<string | undefined>()
  const [schemaMissing, setSchemaMissing] = useState(false)

  useEffect(() => {
    if (!forge || !session) return
    let gone = false
    loadOwnTrackPage().then((result) => {
      if (gone) return
      setSchemaMissing(result.schemaMissing)
      const page = result.page
      if (!page) return
      setId(page.id)
      setSlug(page.slug)
      setShopUrl(page.shopUrl)
      setContact(page.contact)
      setSocials(page.socials)
      setScans(page.scans ?? 0)
    })
    return () => {
      gone = true
    }
  }, [forge, session])

  if (!forge) {
    return (
      <section data-panel="tracking" className="space-y-2 rounded-xl border border-dashed border-black/10 p-3">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <Lock className="size-3.5" />
          Photo tracking is on Forge.
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          A QR can open a small page with your shop, contact, and socials, and Forge can see how many times it was scanned. Spark and Free can still stamp any other link. Forge is not for sale.
        </p>
        <p className="text-xs text-muted-foreground">Example: your-shop · @yourhandle · example.com</p>
      </section>
    )
  }

  const save = async () => {
    try {
      const saved = await saveTrackPage({ id, slug: tidySlug(slug), shopUrl, contact, socials })
      setId(saved.id)
      setSlug(saved.slug)
      setSchemaMissing(false)
      toast.success("Tracking page saved.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save that page."
      if (message.includes("has not been run")) setSchemaMissing(true)
      toast.error(message)
    }
  }

  return (
    <section data-panel="tracking" className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Photo tracking</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        The QR opens your page. Scans are counted at most once a minute for each visitor.
        {schemaMissing ? " The database update is included and has not been applied yet." : ""}
      </p>
      <Input value={slug} aria-label="Link name" onChange={(event) => setSlug(event.target.value)} />
      <Input value={shopUrl} aria-label="Shop link" onChange={(event) => setShopUrl(event.target.value)} />
      <Input value={contact} aria-label="Contact" onChange={(event) => setContact(event.target.value)} />
      {(["instagram", "tiktok", "website"] as const).map((key) => (
        <Input
          key={key}
          value={socials[key]}
          placeholder={key}
          aria-label={key}
          onChange={(event) => setSocials({ ...socials, [key]: event.target.value })}
        />
      ))}
      {scans != null && <p className="text-xs text-muted-foreground">{scans} scans</p>}
      <div className="flex gap-2">
        <Button type="button" className="min-h-10 flex-1" onClick={save}>Save page</Button>
        <Button type="button" variant="outline" className="min-h-10" onClick={() => onUseLink(trackingUrl(tidySlug(slug)))}>
          Use this QR
        </Button>
      </div>
    </section>
  )
}

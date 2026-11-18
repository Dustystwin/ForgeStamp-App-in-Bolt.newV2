import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FREE_FONTS, PRO_FONTS } from "@/lib/editor-types"
import { BUILDER_MODE, canUsePremiumFeatures } from "@/lib/builder-mode"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { useEffect, useMemo, useState } from "react"
import { favoriteFonts, recentFonts, rememberFont, toggleFavoriteFont } from "@/lib/font-prefs"
import { Input } from "@/components/ui/input"

interface FontControlProps {
  value: string
  onChange: (value: string) => void
}

const PRO_VALUES: ReadonlySet<string> = new Set(PRO_FONTS.map((f) => f.value))

export function FontControl({ value, onChange }: FontControlProps) {
  const { profile } = useAuth()
  const premiumUnlocked = canUsePremiumFeatures(profile?.tier, Boolean(profile?.is_admin))
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<"all" | "favorites" | "recent">("all")
  const [favorites, setFavorites] = useState<string[]>([])
  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => {
    setFavorites(favoriteFonts())
    setRecent(recentFonts())
  }, [])
  const pool = useMemo(() => {
    const all = [...FREE_FONTS, ...PRO_FONTS]
    const base = tab === "favorites"
      ? all.filter((font) => favorites.includes(font.value))
      : tab === "recent"
        ? recent.map((name) => all.find((font) => font.value === name)).filter((font): font is typeof all[number] => Boolean(font))
        : all
    const q = query.trim().toLowerCase()
    return q ? base.filter((font) => font.label.toLowerCase().includes(q)) : base
  }, [tab, favorites, recent, query])

  const handleValueChange = (val: string) => {
    if (PRO_VALUES.has(val) && !premiumUnlocked) {
      toast("Premium fonts are included with Spark and Forge. Those plans are not for sale.")
      return
    }
    onChange(val)
    setRecent(rememberFont(val))
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="font-family" className="text-xs font-medium">
        Font Family
      </Label>
      <div className="flex gap-1">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search fonts" className="h-8 text-xs" aria-label="Search fonts" />
        <button type="button" className="min-h-8 rounded-md border px-2 text-[10px]" onClick={() => setFavorites(toggleFavoriteFont(value))} aria-label="Favorite this font">
          {favorites.includes(value) ? "★" : "☆"}
        </button>
      </div>
      <div className="flex gap-1" role="tablist" aria-label="Font lists">
        {(["all", "favorites", "recent"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-8 flex-1 rounded-md border text-[10px] capitalize ${tab === item ? "border-primary text-primary" : "border-border/60 text-muted-foreground"}`}>
            {item}
          </button>
        ))}
      </div>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger id="font-family" className="h-9">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Free</SelectLabel>
            {pool.filter((font) => FREE_FONTS.some((item) => item.value === font.value)).map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-muted-foreground/60">Premium</span>
              {BUILDER_MODE && (
                <span className="rounded px-1 py-0.5 text-[7px] font-semibold bg-primary/10 text-primary leading-none">
                  UNLOCKED
                </span>
              )}
            </SelectLabel>
            {pool.filter((font) => PRO_FONTS.some((item) => item.value === font.value)).map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
                className={premiumUnlocked ? "" : "text-muted-foreground"}
              >
                {font.label}{!premiumUnlocked ? " (Spark)" : ""}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

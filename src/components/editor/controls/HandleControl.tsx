import { useState } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HANDLE_PLATFORMS, type HandlePlatform } from "@/lib/platform-glyphs"
import { cn } from "@/lib/utils"

export function HandleControl({
  text,
  platform,
  iconsUnlocked,
  onTextChange,
  onPlatformChange,
}: {
  text: string
  platform: HandlePlatform
  iconsUnlocked: boolean
  onTextChange: (value: string) => void
  onPlatformChange: (value: HandlePlatform) => void
}) {
  const [draft, setDraft] = useState(text.startsWith("@") ? text : "@yourhandle")
  return (
    <section data-panel="handle" className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Handle</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Stamps @yourhandle on its own or in a pattern. Platform icons are simple drawings, not official logos. Icons are on Spark and Forge.
      </p>
      <Input
        value={draft}
        maxLength={32}
        aria-label="Handle"
        onChange={(event) => setDraft(event.target.value)}
      />
      <Button
        type="button"
        size="sm"
        className="min-h-10 w-full"
        onClick={() => {
          const next = draft.trim().replace(/^@?/, "@")
          onTextChange(next || "@yourhandle")
        }}
      >
        Use this handle
      </Button>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Platform icon">
        {HANDLE_PLATFORMS.map((item) => {
          const locked = item.id !== "none" && !iconsUnlocked
          const on = platform === item.id
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              aria-pressed={on}
              onClick={() => onPlatformChange(item.id)}
              className={cn(
                "min-h-10 rounded-lg border px-2.5 text-xs font-medium",
                on ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-white",
                locked && "opacity-50",
              )}
            >
              {locked && <Lock className="mr-1 inline size-3" />}
              {item.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

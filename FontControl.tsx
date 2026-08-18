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
import { BUILDER_MODE } from "@/lib/builder-mode"
import { toast } from "sonner"

interface FontControlProps {
  value: string
  onChange: (value: string) => void
}

const PRO_VALUES: ReadonlySet<string> = new Set(PRO_FONTS.map((f) => f.value))

export function FontControl({ value, onChange }: FontControlProps) {
  const handleValueChange = (val: string) => {
    if (PRO_VALUES.has(val) && !BUILDER_MODE) {
      toast("Pro fonts will be available with paid plans.")
      return
    }
    onChange(val)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="font-family" className="text-xs font-medium">
        Font Family
      </Label>
      <Select value={value} onValueChange={handleValueChange}>
        <SelectTrigger id="font-family" className="h-9">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Free</SelectLabel>
            {FREE_FONTS.map((font) => (
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
              <span className="text-muted-foreground/60">Pro</span>
              {BUILDER_MODE && (
                <span className="rounded px-1 py-0.5 text-[7px] font-semibold bg-primary/10 text-primary leading-none">
                  UNLOCKED
                </span>
              )}
            </SelectLabel>
            {PRO_FONTS.map((font) => (
              <SelectItem
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
                className={BUILDER_MODE ? "" : "text-muted-foreground"}
              >
                {font.label}{!BUILDER_MODE ? " (Pro)" : ""}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

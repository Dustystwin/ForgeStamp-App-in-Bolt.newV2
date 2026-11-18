import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface TextControlProps {
  value: string
  onChange: (value: string) => void
}

export function TextControl({ value, onChange }: TextControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const insertCopyright = () => {
    const el = inputRef.current
    const mark = "©"
    if (!el) {
      onChange(value.includes("©") ? value : `© ${value}`.trim())
      return
    }
    const start = el.selectionStart ?? value.length
    const end = el.selectionEnd ?? start
    const next = `${value.slice(0, start)}${mark}${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const caret = start + mark.length
      el.setSelectionRange(caret, caret)
    })
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="watermark-text" className="text-xs font-medium">
        Watermark Text
      </Label>
      <div className="flex gap-1.5">
        <Input
          ref={inputRef}
          id="watermark-text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter watermark text"
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 px-2.5 text-sm"
          onClick={insertCopyright}
          aria-label="Insert copyright symbol"
          title="Insert ©"
        >
          ©
        </Button>
      </div>
    </div>
  )
}

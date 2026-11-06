import { useRef } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface LogoControlProps {
  previewUrl: string | null
  fileName: string | null
  onSelect: (file: File) => void
  onClear: () => void
}

export function LogoControl({ previewUrl, fileName, onSelect, onClear }: LogoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const openPicker = () => inputRef.current?.click()

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">Your logo</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="hidden"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          e.target.value = ""
        }}
      />

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2">
          <img
            src={previewUrl}
            alt="Uploaded logo preview"
            className="size-14 shrink-0 rounded-md border border-border/50 bg-[repeating-conic-gradient(oklch(0.93_0_0)_0%_25%,oklch(0.97_0_0)_0%_50%)] bg-[length:8px_8px] object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{fileName || "Logo"}</p>
            <div className="mt-1.5 flex gap-1.5">
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={openPicker}>
                Replace
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-[10px]" onClick={onClear}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-4 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Upload className="size-4 text-muted-foreground" />
          <span className="text-xs font-medium">Upload logo</span>
          <span className="text-[10px] text-muted-foreground">PNG, JPG, or WebP</span>
        </button>
      )}
    </div>
  )
}

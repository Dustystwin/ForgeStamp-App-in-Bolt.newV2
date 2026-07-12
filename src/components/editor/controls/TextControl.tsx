import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TextControlProps {
  value: string
  onChange: (value: string) => void
}

export function TextControl({ value, onChange }: TextControlProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="watermark-text" className="text-xs font-medium">
        Watermark Text
      </Label>
      <Input
        id="watermark-text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter watermark text"
        className="h-9"
      />
    </div>
  )
}

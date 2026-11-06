import { useRef } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACCEPTED_IMAGE_TYPES } from "@/lib/editor-types"
import { FREE_BATCH_LIMIT, PRO_BATCH_LIMIT } from "@/lib/builder-mode"
import type { EditorPhoto } from "@/hooks/use-editor-state"
import { cn } from "@/lib/utils"

interface BatchStripProps {
  photos: EditorPhoto[]
  activeId: string | null
  limit: number
  disabled?: boolean
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onAdd: (files: File[]) => void
}

export function BatchStrip({
  photos,
  activeId,
  limit,
  disabled = false,
  onSelect,
  onRemove,
  onAdd,
}: BatchStripProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const paid = limit > FREE_BATCH_LIMIT
  const full = photos.length >= limit

  return (
    <div className="mt-3 rounded-xl border border-border/50 bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium">
          {photos.length === 1 ? "1 photo" : `${photos.length} photos`}
          <span className="font-normal text-muted-foreground"> · up to {limit}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1 px-2 text-[11px]"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Plus className="size-3.5" />
          Add photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          tabIndex={-1}
          onChange={(e) => {
            const files = e.target.files ? Array.from(e.target.files) : []
            if (files.length > 0) onAdd(files)
            e.target.value = ""
          }}
        />
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {photos.map((photo, index) => {
          const selected = photo.id === activeId
          return (
            <div key={photo.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(photo.id)}
                aria-pressed={selected}
                aria-label={`${photo.file.name}${selected ? ", showing now" : ""}`}
                title={photo.file.name}
                className={cn(
                  "block h-14 w-14 overflow-hidden rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "border-primary ring-2 ring-primary/40" : "border-border/60"
                )}
              >
                <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
              </button>
              <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-background/85 px-1 text-[9px] font-medium">
                {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(photo.id)}
                disabled={disabled}
                aria-label={`Remove ${photo.file.name}`}
                className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-muted"
              >
                <X className="size-2.5" />
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
        {paid
          ? full
            ? `This batch is full at ${limit} photos. Unlimited batches are not available yet.`
            : "The same watermark is applied to every photo. More than one photo downloads as a ZIP."
          : full
            ? `This batch is full at ${limit} photos. A ${PRO_BATCH_LIMIT}-photo batch will be available with paid plans. Those plans are not for sale yet.`
            : `Up to ${limit} photos on Free. The same watermark goes on each one. More than one downloads as a ZIP.`}
      </p>
    </div>
  )
}

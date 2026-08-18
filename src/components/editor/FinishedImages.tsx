import { Download, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface FinishedImage {
  id: string
  dataUrl: string
  createdAt: Date
  filename: string
}

interface FinishedImagesProps {
  images: FinishedImage[]
  onRemove: (id: string) => void
  onClearAll: () => void
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function FinishedImages({ images, onRemove, onClearAll }: FinishedImagesProps) {
  if (images.length === 0) return null

  return (
    <section
      aria-label="Finished images"
      className="mx-auto w-full max-w-7xl px-4 pb-10 md:px-6"
    >
      <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Finished Images</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary tabular-nums">
              {images.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3" />
            Clear All
          </Button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((img) => (
              <div
                key={img.id}
                className={cn(
                  "flex flex-col rounded-lg border border-border/40 bg-background overflow-hidden shadow-sm transition-shadow hover:shadow-md"
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-[repeating-conic-gradient(oklch(0.93_0_0)_0%_25%,oklch(0.97_0_0)_0%_50%)] bg-[length:12px_12px] overflow-hidden">
                  <img
                    src={img.dataUrl}
                    alt={img.filename}
                    className="absolute inset-0 h-full w-full object-contain"
                    draggable={false}
                  />
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-2 px-3 py-2.5 bg-muted/20 border-t border-border/30">
                  <p
                    className="truncate text-[10px] text-muted-foreground leading-tight"
                    title={img.filename}
                  >
                    {img.filename}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1 h-8 gap-1.5 text-xs"
                      onClick={() => downloadDataUrl(img.dataUrl, img.filename)}
                      aria-label={`Download ${img.filename}`}
                    >
                      <Download className="size-3.5" />
                      Download Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
                      onClick={() => onRemove(img.id)}
                      aria-label={`Remove ${img.filename}`}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


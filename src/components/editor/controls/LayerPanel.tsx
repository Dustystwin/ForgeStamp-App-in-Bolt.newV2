import { Copy, Eye, EyeOff, Lock, LockOpen, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { toast } from "sonner"
import type { MarkLayer } from "@/lib/mark-layer"
import { cn } from "@/lib/utils"

interface LayerPanelProps {
  layers: MarkLayer[]
  activeId: string
  limit: number
  onSelect: (id: string) => void
  onAdd: (limit: number) => boolean
  onDuplicate: (limit: number) => boolean
  onDelete: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
  onHide: (id: string) => void
  onLock: (id: string) => void
}

export function LayerPanel({
  layers, activeId, limit, onSelect, onAdd, onDuplicate, onDelete, onMove, onHide, onLock,
}: LayerPanelProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium">Layers</p>
        <span className="text-[10px] text-muted-foreground">{layers.length} of {limit}</span>
      </div>
      <div className="space-y-1">
        {[...layers].reverse().map((layer) => {
          const selected = layer.id === activeId
          return (
            <div key={layer.id} className={cn("flex items-center gap-1 rounded-md border px-1 py-1", selected ? "border-primary bg-primary/10" : "border-border/50")}>
              <button type="button" className="min-h-8 flex-1 truncate px-1 text-left text-[11px] font-medium" onClick={() => onSelect(layer.id)}>
                {layer.name}
              </button>
              <button type="button" aria-label={layer.hidden ? "Show layer" : "Hide layer"} className="grid size-7 place-items-center" onClick={() => onHide(layer.id)}>
                {layer.hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              <button type="button" aria-label={layer.locked ? "Unlock layer" : "Lock layer"} className="grid size-7 place-items-center" onClick={() => onLock(layer.id)}>
                {layer.locked ? <Lock className="size-3.5" /> : <LockOpen className="size-3.5" />}
              </button>
              <button type="button" aria-label="Move up" className="grid size-7 place-items-center" onClick={() => onMove(layer.id, 1)}><ArrowUp className="size-3.5" /></button>
              <button type="button" aria-label="Move down" className="grid size-7 place-items-center" onClick={() => onMove(layer.id, -1)}><ArrowDown className="size-3.5" /></button>
              <button type="button" aria-label="Delete layer" className="grid size-7 place-items-center" onClick={() => onDelete(layer.id)}><Trash2 className="size-3.5" /></button>
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md border border-border/60 text-[11px] font-medium"
          onClick={() => {
            if (!onAdd(limit)) toast(`This plan can keep ${limit} layers on one photo.`)
          }}
        >
          <Plus className="size-3.5" /> Add
        </button>
        <button
          type="button"
          className="flex min-h-9 flex-1 items-center justify-center gap-1 rounded-md border border-border/60 text-[11px] font-medium"
          onClick={() => {
            if (!onDuplicate(limit)) toast(`This plan can keep ${limit} layers on one photo.`)
          }}
        >
          <Copy className="size-3.5" /> Duplicate
        </button>
      </div>
    </div>
  )
}

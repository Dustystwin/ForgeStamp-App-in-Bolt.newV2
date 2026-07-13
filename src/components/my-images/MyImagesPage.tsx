import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Download, Trash2, CreditCard as Edit2, Images, Loader as Loader2, TriangleAlert as AlertTriangle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase, type StoredImage } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { useNavigation } from "@/App"
import { cn } from "@/lib/utils"
import type { EditorInitialData } from "@/App"

function daysUntil(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ImageCardProps {
  image: StoredImage
  onDelete: (id: string) => void
  onEdit: (image: StoredImage) => void
  onDownload: (image: StoredImage) => void
  isDeleting: boolean
}

function ImageCard({ image, onDelete, onEdit, onDownload, isDeleting }: ImageCardProps) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null)
  const days = daysUntil(image.expires_at)
  const isExpiringSoon = days <= 5

  useEffect(() => {
    supabase.storage
      .from("watermark-images")
      .createSignedUrl(image.output_path, 3600)
      .then(({ data }) => {
        if (data?.signedUrl) setThumbUrl(data.signedUrl)
      })
  }, [image.output_path])

  return (
    <div className="flex flex-col rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-[repeating-conic-gradient(oklch(0.93_0_0)_0%_25%,oklch(0.97_0_0)_0%_50%)] bg-[length:12px_12px] overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={image.filename}
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {/* Expiry badge */}
        <div
          className={cn(
            "absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold shadow",
            isExpiringSoon
              ? "bg-destructive/90 text-white"
              : "bg-background/90 text-foreground"
          )}
        >
          <Clock className="size-3" />
          {days === 0 ? "Expires today" : `${days}d left`}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-3 py-2.5 bg-muted/20 border-t border-border/30">
        <div className="flex flex-col gap-0.5">
          <p className="truncate text-[11px] font-medium text-foreground" title={image.filename}>
            {image.filename}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {formatBytes(image.total_size)} &middot;{" "}
            {new Date(image.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button
            variant="default"
            size="sm"
            className="flex-1 h-8 gap-1.5 text-xs"
            onClick={() => onDownload(image)}
            aria-label={`Download ${image.filename}`}
          >
            <Download className="size-3.5" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            onClick={() => onEdit(image)}
            aria-label={`Edit ${image.filename}`}
          >
            <Edit2 className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 shrink-0 p-0 text-muted-foreground hover:text-destructive hover:border-destructive/40"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            aria-label={`Delete ${image.filename}`}
          >
            {isDeleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function MyImagesPage() {
  const { session, profile } = useAuth()
  const { navigateTo } = useNavigation()
  const [images, setImages] = useState<StoredImage[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!session) {
      navigateTo("landing")
      return
    }
    fetchImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const fetchImages = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load images.")
    } else {
      setImages((data as StoredImage[]) ?? [])
    }
    setLoading(false)
  }

  const handleDelete = useCallback(async (id: string) => {
    const img = images.find((i) => i.id === id)
    if (!img) return
    setDeletingId(id)
    try {
      // Delete storage files
      await supabase.storage
        .from("watermark-images")
        .remove([img.original_path, img.output_path])

      // Delete DB record
      const { error } = await supabase.from("images").delete().eq("id", id)
      if (error) throw new Error(error.message)

      setImages((prev) => prev.filter((i) => i.id !== id))
      toast.success("Image deleted.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete image.")
    } finally {
      setDeletingId(null)
    }
  }, [images])

  const handleDownload = useCallback(async (image: StoredImage) => {
    const { data, error } = await supabase.storage
      .from("watermark-images")
      .createSignedUrl(image.output_path, 60)

    if (error || !data?.signedUrl) {
      toast.error("Failed to generate download link.")
      return
    }

    const a = document.createElement("a")
    a.href = data.signedUrl
    a.download = image.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  const handleEdit = useCallback(async (image: StoredImage) => {
    toast.info("Loading original image...")
    try {
      const { data, error } = await supabase.storage
        .from("watermark-images")
        .createSignedUrl(image.original_path, 300)

      if (error || !data?.signedUrl) throw new Error("Could not get original image URL")

      const response = await fetch(data.signedUrl)
      if (!response.ok) throw new Error("Failed to fetch original image")

      const blob = await response.blob()
      const mimeType = blob.type || "image/png"
      const ext = mimeType.split("/")[1] ?? "png"
      const file = new File([blob], `original.${ext}`, { type: mimeType })

      const settings = image.settings as EditorInitialData["settings"]

      const initialData: EditorInitialData = {
        image: file,
        settings: settings ?? {},
        sourceImageId: image.id,
      }

      navigateTo("editor", { editorInitialData: initialData })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load image for editing.")
    }
  }, [navigateTo])

  if (!session) return null

  return (
    <div className="min-h-svh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo("landing")}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to Home
          </Button>
          <span className="text-sm font-black tracking-tight">ForgeStamp</span>
          <Button
            size="sm"
            onClick={() => navigateTo("editor")}
            className="gap-1.5"
          >
            New Image
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Images className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">My Images</h1>
            <p className="text-sm text-muted-foreground">
              {profile?.tier === "pro" ? "Pro" : "Free"} &middot; Stored 30 days
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <Images className="mb-3 size-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No images yet</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              Export a watermarked image to save it here.
            </p>
            <Button
              className="mt-5"
              onClick={() => navigateTo("editor")}
            >
              Open Editor
            </Button>
          </div>
        ) : (
          <>
            {images.some((img) => daysUntil(img.expires_at) <= 5) && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.04] px-4 py-2.5 text-sm text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                Some images expire soon. Download or re-export them to keep them.
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {images.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onDownload={handleDownload}
                  isDeleting={deletingId === img.id}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

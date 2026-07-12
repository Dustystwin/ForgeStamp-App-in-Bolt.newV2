import { useCallback, useRef, useState } from "react"
import { Upload, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ACCEPTED_IMAGE_TYPES } from "@/lib/editor-types"

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
  hasImage: boolean
}

export function ImageUploader({ onImageSelect, hasImage }: ImageUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (files && files.length > 0) {
        onImageSelect(files[0])
      }
    },
    [onImageSelect]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounter.current = 0
      setIsDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    },
    [handleFiles]
  )

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  if (hasImage) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={openFilePicker}
        className="gap-1.5"
      >
        <ImageIcon className="size-3.5" />
        Replace Image
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Replace image"
        />
      </Button>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload an image. Drag and drop or click to browse."
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={openFilePicker}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          openFilePicker()
        }
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 md:p-12 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isDragOver
          ? "border-primary bg-primary/[0.04]"
          : "border-border/60 hover:border-primary/40 hover:bg-muted/30"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.08]">
        <Upload className="size-5 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragOver ? "Drop your image here" : "Drag & drop your image here"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          or click to browse. PNG, JPG, WebP up to 15MB.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleInputChange}
        className="hidden"
        aria-label="Choose image file"
      />
    </div>
  )
}

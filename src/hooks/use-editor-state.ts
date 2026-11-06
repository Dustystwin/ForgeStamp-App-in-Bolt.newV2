import { useState, useCallback, useEffect, useRef } from "react"
import {
  type EditorState,
  type Placement,
  type TextDirection,
  type CoverageMode,
  type CurveOrientation,
  type Pattern,
  type WatermarkMode,
  DEFAULT_EDITOR_STATE,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  LOGO_MAX_EDGE_PX,
  LOGO_MAX_FILE_SIZE_BYTES,
  LOGO_MAX_FILE_SIZE_MB,
  STAMP_SIZE_MAX,
  STAMP_SIZE_MIN,
  isWatermarkMode,
} from "@/lib/editor-types"
import type { EditorInitialData } from "@/App"

export interface EditorPhoto {
  id: string
  file: File
  previewUrl: string
}

export interface AddPhotosResult {
  added: number
  skippedType: number
  skippedSize: number
  leftOut: number
}

interface PhotoBatch {
  photos: EditorPhoto[]
  activeId: string | null
}

function photoId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function isPhotoFile(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)
}

const EMPTY_BATCH: PhotoBatch = { photos: [], activeId: null }

export function useEditorState(initialData?: EditorInitialData) {
  const init = initialData?.settings ?? {}

  const [batch, setBatch] = useState<PhotoBatch>(EMPTY_BATCH)
  const batchRef = useRef(batch)
  batchRef.current = batch
  const [watermarkMode, setWatermarkMode] = useState<WatermarkMode>(
    isWatermarkMode(init.watermarkMode) ? init.watermarkMode : DEFAULT_EDITOR_STATE.watermarkMode
  )
  const [watermarkText, setWatermarkText] = useState(init.watermarkText ?? DEFAULT_EDITOR_STATE.watermarkText)
  const [fontFamily, setFontFamily] = useState(init.fontFamily ?? DEFAULT_EDITOR_STATE.fontFamily)
  const [fontSize, setFontSize] = useState(init.fontSize ?? DEFAULT_EDITOR_STATE.fontSize)
  const [color, setColor] = useState(init.color ?? DEFAULT_EDITOR_STATE.color)
  const [opacity, setOpacity] = useState(init.opacity ?? DEFAULT_EDITOR_STATE.opacity)
  const [rotation, setRotation] = useState(init.rotation ?? DEFAULT_EDITOR_STATE.rotation)
  const [placement, setPlacement] = useState<Placement>(init.placement ?? DEFAULT_EDITOR_STATE.placement)
  const [textDirection, setTextDirection] = useState<TextDirection>(init.textDirection ?? DEFAULT_EDITOR_STATE.textDirection)
  const [coverageMode, setCoverageMode] = useState<CoverageMode>(init.coverageMode ?? DEFAULT_EDITOR_STATE.coverageMode)
  const [pattern, setPattern] = useState<Pattern>(init.pattern ?? DEFAULT_EDITOR_STATE.pattern)
  const [density, setDensity] = useState(init.density ?? DEFAULT_EDITOR_STATE.density)
  const [curveOrientation, setCurveOrientation] = useState<CurveOrientation>(init.curveOrientation ?? DEFAULT_EDITOR_STATE.curveOrientation)
  const [stampSize, setStampSize] = useState(() => {
    const n = init.stampSize
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.stampSize
    return Math.min(STAMP_SIZE_MAX, Math.max(STAMP_SIZE_MIN, Math.round(n)))
  })
  const [qrUrl, setQrUrl] = useState(typeof init.qrUrl === "string" ? init.qrUrl : DEFAULT_EDITOR_STATE.qrUrl)
  const [qrColor, setQrColor] = useState(
    typeof init.qrColor === "string" ? init.qrColor : DEFAULT_EDITOR_STATE.qrColor
  )
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoName, setLogoName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const logoUrlRef = useRef<string | null>(null)
  const logoLoadId = useRef(0)

  const commitBatch = useCallback((next: PhotoBatch) => {
    batchRef.current = next
    setBatch(next)
  }, [])

  useEffect(() => {
    const image = initialData?.image
    if (!image) return
    const url = URL.createObjectURL(image)
    const photo: EditorPhoto = { id: photoId(), file: image, previewUrl: url }
    commitBatch({ photos: [photo], activeId: photo.id })
    return () => {
      URL.revokeObjectURL(url)
    }
    // Only the photo handed in at open. Later adds are tracked separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      for (const photo of batchRef.current.photos) URL.revokeObjectURL(photo.previewUrl)
      if (logoUrlRef.current) {
        URL.revokeObjectURL(logoUrlRef.current)
        logoUrlRef.current = null
      }
    }
  }, [])

  const releaseLogo = useCallback(() => {
    logoLoadId.current += 1
    if (logoUrlRef.current) {
      URL.revokeObjectURL(logoUrlRef.current)
      logoUrlRef.current = null
    }
    setLogoPreviewUrl(null)
    setLogoName(null)
  }, [])

  const setLogo = useCallback((file: File) => {
    const typeOk = ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name)
    if (!typeOk) {
      setError("Logo must be a PNG, JPG, or WebP image.")
      return
    }
    if (file.size > LOGO_MAX_FILE_SIZE_BYTES) {
      setError(`Logo is too large. Maximum file size is ${LOGO_MAX_FILE_SIZE_MB}MB.`)
      return
    }

    const url = URL.createObjectURL(file)
    const loadId = ++logoLoadId.current
    const img = new Image()
    img.onload = () => {
      if (loadId !== logoLoadId.current) {
        URL.revokeObjectURL(url)
        return
      }
      if (img.naturalWidth < 1 || img.naturalHeight < 1) {
        URL.revokeObjectURL(url)
        setError("That logo could not be read. Try a different PNG, JPG, or WebP.")
        return
      }
      if (img.naturalWidth > LOGO_MAX_EDGE_PX || img.naturalHeight > LOGO_MAX_EDGE_PX) {
        URL.revokeObjectURL(url)
        setError(`That logo is too large. Use an image under ${LOGO_MAX_EDGE_PX} pixels on a side.`)
        return
      }
      if (logoUrlRef.current) URL.revokeObjectURL(logoUrlRef.current)
      logoUrlRef.current = url
      setLogoPreviewUrl(url)
      setLogoName(file.name)
      setError(null)
    }
    img.onerror = () => {
      if (loadId !== logoLoadId.current) {
        URL.revokeObjectURL(url)
        return
      }
      URL.revokeObjectURL(url)
      setError("That logo could not be read. Try a different PNG, JPG, or WebP.")
    }
    img.src = url
  }, [])

  const noteFileProblems = useCallback((skippedType: number, skippedSize: number, added: number) => {
    if (skippedType && skippedSize) {
      setError(`Some files were skipped. Use PNG, JPG, or WebP under ${MAX_FILE_SIZE_MB}MB.`)
    } else if (skippedType) {
      setError("Unsupported file type. Please upload a PNG, JPG, or WebP image.")
    } else if (skippedSize) {
      setError(`Image is too large. Maximum file size is ${MAX_FILE_SIZE_MB}MB.`)
    } else if (added > 0) {
      setError(null)
    }
  }, [])

  const addPhotos = useCallback((files: File[], limit: number): AddPhotosResult => {
    let skippedType = 0
    let skippedSize = 0
    const accepted: File[] = []
    for (const file of files) {
      if (!isPhotoFile(file)) {
        skippedType += 1
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        skippedSize += 1
        continue
      }
      accepted.push(file)
    }

    const prev = batchRef.current
    const room = Math.max(0, limit - prev.photos.length)
    const take = accepted.slice(0, room)
    const leftOut = accepted.length - take.length
    if (take.length > 0) {
      const created = take.map((file) => ({
        id: photoId(),
        file,
        previewUrl: URL.createObjectURL(file),
      }))
      commitBatch({
        photos: [...prev.photos, ...created],
        activeId: prev.activeId ?? created[0].id,
      })
    }
    noteFileProblems(skippedType, skippedSize, take.length)
    return { added: take.length, skippedType, skippedSize, leftOut }
  }, [commitBatch, noteFileProblems])

  const setImage = useCallback((file: File) => {
    if (!isPhotoFile(file)) {
      setError("Unsupported file type. Please upload a PNG, JPG, or WebP image.")
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Image is too large. Maximum file size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    const prev = batchRef.current
    const url = URL.createObjectURL(file)
    if (!prev.activeId || prev.photos.length === 0) {
      const photo: EditorPhoto = { id: photoId(), file, previewUrl: url }
      commitBatch({ photos: [photo], activeId: photo.id })
      setError(null)
      return
    }

    const current = prev.photos.find((photo) => photo.id === prev.activeId)
    if (current) URL.revokeObjectURL(current.previewUrl)
    commitBatch({
      photos: prev.photos.map((photo) =>
        photo.id === prev.activeId ? { ...photo, file, previewUrl: url } : photo
      ),
      activeId: prev.activeId,
    })
    setError(null)
  }, [commitBatch])

  const selectPhoto = useCallback((id: string) => {
    const prev = batchRef.current
    if (!prev.photos.some((photo) => photo.id === id) || prev.activeId === id) return
    commitBatch({ ...prev, activeId: id })
  }, [commitBatch])

  const removePhoto = useCallback((id: string) => {
    const prev = batchRef.current
    const target = prev.photos.find((photo) => photo.id === id)
    if (!target) return
    URL.revokeObjectURL(target.previewUrl)
    const photos = prev.photos.filter((photo) => photo.id !== id)
    let activeId = prev.activeId
    if (activeId === id) {
      const index = prev.photos.findIndex((photo) => photo.id === id)
      activeId = photos[Math.min(index, photos.length - 1)]?.id ?? null
    }
    commitBatch({ photos, activeId })
  }, [commitBatch])

  const reset = useCallback(() => {
    for (const photo of batchRef.current.photos) URL.revokeObjectURL(photo.previewUrl)
    commitBatch(EMPTY_BATCH)
    setWatermarkText(DEFAULT_EDITOR_STATE.watermarkText)
    setFontFamily(DEFAULT_EDITOR_STATE.fontFamily)
    setFontSize(DEFAULT_EDITOR_STATE.fontSize)
    setColor(DEFAULT_EDITOR_STATE.color)
    setOpacity(DEFAULT_EDITOR_STATE.opacity)
    setRotation(DEFAULT_EDITOR_STATE.rotation)
    setPlacement(DEFAULT_EDITOR_STATE.placement)
    setTextDirection(DEFAULT_EDITOR_STATE.textDirection)
    setCoverageMode(DEFAULT_EDITOR_STATE.coverageMode)
    setPattern(DEFAULT_EDITOR_STATE.pattern)
    setDensity(DEFAULT_EDITOR_STATE.density)
    setCurveOrientation(DEFAULT_EDITOR_STATE.curveOrientation)
    setWatermarkMode(DEFAULT_EDITOR_STATE.watermarkMode)
    setStampSize(DEFAULT_EDITOR_STATE.stampSize)
    setQrUrl(DEFAULT_EDITOR_STATE.qrUrl)
    setQrColor(DEFAULT_EDITOR_STATE.qrColor)
    releaseLogo()
    setError(null)
  }, [commitBatch, releaseLogo])

  const clearError = useCallback(() => setError(null), [])

  const activePhoto = batch.photos.find((photo) => photo.id === batch.activeId) ?? null

  const state: EditorState = {
    image: activePhoto?.file ?? null,
    imagePreviewUrl: activePhoto?.previewUrl ?? null,
    watermarkMode,
    watermarkText,
    fontFamily,
    fontSize,
    color,
    opacity,
    rotation,
    placement,
    textDirection,
    coverageMode,
    pattern,
    density,
    curveOrientation,
    stampSize,
    qrUrl,
    qrColor,
    logoPreviewUrl,
    logoName,
    error,
  }

  return {
    state,
    photos: batch.photos,
    activePhotoId: batch.activeId,
    addPhotos,
    selectPhoto,
    removePhoto,
    setImage,
    setWatermarkMode,
    setWatermarkText,
    setFontFamily,
    setFontSize,
    setColor,
    setOpacity,
    setRotation,
    setPlacement,
    setTextDirection,
    setCoverageMode,
    setPattern,
    setDensity,
    setCurveOrientation,
    setStampSize,
    setQrUrl,
    setQrColor,
    setLogo,
    clearLogo: releaseLogo,
    reset,
    clearError,
  }
}

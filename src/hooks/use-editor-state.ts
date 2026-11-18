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
  type ExportFormat,
  type DateStampFormat,
  type CropAspect,
  OUTLINE_WIDTH_MIN,
  OUTLINE_WIDTH_MAX,
  SHADOW_BLUR_MIN,
  SHADOW_BLUR_MAX,
  SHADOW_OFFSET_MIN,
  SHADOW_OFFSET_MAX,
  EXPORT_QUALITY_MIN,
  EXPORT_QUALITY_MAX,
  isDateStampFormat,
  isCropAspect,
} from "@/lib/editor-types"
import { isExportFormat, type PresetSettings } from "@/lib/preset-settings"
import { scheduleThumb, thumbnailBlob } from "@/lib/image-resources"
import type { EditorInitialData } from "@/App"

export interface EditorPhoto {
  id: string
  file: File
  previewUrl: string
  thumbUrl: string | null
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

function releasePhotoUrls(photo: EditorPhoto) {
  URL.revokeObjectURL(photo.previewUrl)
  if (photo.thumbUrl && photo.thumbUrl !== photo.previewUrl) URL.revokeObjectURL(photo.thumbUrl)
}

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
  const [exportFormat, setExportFormat] = useState<ExportFormat>(
    isExportFormat(init.exportFormat) ? init.exportFormat : DEFAULT_EDITOR_STATE.exportFormat
  )
  const [exportLongEdge, setExportLongEdge] = useState(() => {
    const n = init.exportLongEdge
    return n === 1080 || n === 1600 || n === 2048 ? n : 0
  })
  const [exportQuality, setExportQuality] = useState(() => {
    const n = init.exportQuality
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.exportQuality
    return Math.min(EXPORT_QUALITY_MAX, Math.max(EXPORT_QUALITY_MIN, Math.round(n)))
  })
  const [outlineWidth, setOutlineWidth] = useState(() => {
    const n = init.outlineWidth
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.outlineWidth
    return Math.min(OUTLINE_WIDTH_MAX, Math.max(OUTLINE_WIDTH_MIN, Math.round(n)))
  })
  const [outlineColor, setOutlineColor] = useState(
    typeof init.outlineColor === "string" ? init.outlineColor : DEFAULT_EDITOR_STATE.outlineColor
  )
  const [shadowEnabled, setShadowEnabled] = useState(init.shadowEnabled === true)
  const [shadowColor, setShadowColor] = useState(
    typeof init.shadowColor === "string" ? init.shadowColor : DEFAULT_EDITOR_STATE.shadowColor
  )
  const [shadowBlur, setShadowBlur] = useState(() => {
    const n = init.shadowBlur
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.shadowBlur
    return Math.min(SHADOW_BLUR_MAX, Math.max(SHADOW_BLUR_MIN, Math.round(n)))
  })
  const [shadowOffsetX, setShadowOffsetX] = useState(() => {
    const n = init.shadowOffsetX
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.shadowOffsetX
    return Math.min(SHADOW_OFFSET_MAX, Math.max(SHADOW_OFFSET_MIN, Math.round(n)))
  })
  const [shadowOffsetY, setShadowOffsetY] = useState(() => {
    const n = init.shadowOffsetY
    if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT_EDITOR_STATE.shadowOffsetY
    return Math.min(SHADOW_OFFSET_MAX, Math.max(SHADOW_OFFSET_MIN, Math.round(n)))
  })
  const [dateStamp, setDateStamp] = useState<DateStampFormat>(
    isDateStampFormat(init.dateStamp) ? init.dateStamp : "off"
  )
  const [cropAspect, setCropAspect] = useState<CropAspect>(
    isCropAspect(init.cropAspect) ? init.cropAspect : "original"
  )
  const [quarterTurns, setQuarterTurns] = useState(() => {
    const n = init.quarterTurns
    if (typeof n !== "number" || !Number.isFinite(n)) return 0
    return ((Math.round(n) % 4) + 4) % 4
  })
  const [signaturePreviewUrl, setSignaturePreviewUrl] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const [logoName, setLogoName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const logoUrlRef = useRef<string | null>(null)
  const logoLoadId = useRef(0)
  const signatureUrlRef = useRef<string | null>(null)
  const alive = useRef(true)
  const thumbGen = useRef(new Map<string, number>())

  const commitBatch = useCallback((next: PhotoBatch) => {
    batchRef.current = next
    setBatch(next)
  }, [])

  const startThumb = useCallback((id: string, file: File) => {
    const gen = (thumbGen.current.get(id) ?? 0) + 1
    thumbGen.current.set(id, gen)
    scheduleThumb(() => thumbnailBlob(file, 160))
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        if (!alive.current || thumbGen.current.get(id) !== gen) {
          URL.revokeObjectURL(url)
          return
        }
        const prev = batchRef.current
        const photo = prev.photos.find((item) => item.id === id)
        if (!photo) {
          URL.revokeObjectURL(url)
          return
        }
        if (photo.thumbUrl && photo.thumbUrl !== photo.previewUrl) URL.revokeObjectURL(photo.thumbUrl)
        commitBatch({
          ...prev,
          photos: prev.photos.map((item) => (item.id === id ? { ...item, thumbUrl: url } : item)),
        })
      })
      .catch(() => {
        // The strip falls back to the full preview if a small one cannot be made.
      })
  }, [commitBatch])

  useEffect(() => {
    const image = initialData?.image
    if (!image) return
    const url = URL.createObjectURL(image)
    const id = photoId()
    const photo: EditorPhoto = { id, file: image, previewUrl: url, thumbUrl: null }
    commitBatch({ photos: [photo], activeId: photo.id })
    startThumb(id, image)
    return () => {
      URL.revokeObjectURL(url)
    }
    // Only the photo handed in at open. Later adds are tracked separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      alive.current = false
      for (const photo of batchRef.current.photos) {
        URL.revokeObjectURL(photo.previewUrl)
        if (photo.thumbUrl && photo.thumbUrl !== photo.previewUrl) URL.revokeObjectURL(photo.thumbUrl)
      }
      if (logoUrlRef.current) {
        URL.revokeObjectURL(logoUrlRef.current)
        logoUrlRef.current = null
      }
      if (signatureUrlRef.current) {
        URL.revokeObjectURL(signatureUrlRef.current)
        signatureUrlRef.current = null
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

  const setSignature = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob)
    if (signatureUrlRef.current) URL.revokeObjectURL(signatureUrlRef.current)
    signatureUrlRef.current = url
    setSignaturePreviewUrl(url)
    setError(null)
  }, [])

  const clearSignature = useCallback(() => {
    if (signatureUrlRef.current) {
      URL.revokeObjectURL(signatureUrlRef.current)
      signatureUrlRef.current = null
    }
    setSignaturePreviewUrl(null)
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
        thumbUrl: null,
      }))
      commitBatch({
        photos: [...prev.photos, ...created],
        activeId: prev.activeId ?? created[0].id,
      })
      for (const photo of created) startThumb(photo.id, photo.file)
    }
    noteFileProblems(skippedType, skippedSize, take.length)
    return { added: take.length, skippedType, skippedSize, leftOut }
  }, [commitBatch, noteFileProblems, startThumb])

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
      const id = photoId()
      const photo: EditorPhoto = { id, file, previewUrl: url, thumbUrl: null }
      commitBatch({ photos: [photo], activeId: photo.id })
      startThumb(id, file)
      setError(null)
      return
    }

    const current = prev.photos.find((photo) => photo.id === prev.activeId)
    if (current) releasePhotoUrls(current)
    commitBatch({
      photos: prev.photos.map((photo) =>
        photo.id === prev.activeId ? { ...photo, file, previewUrl: url, thumbUrl: null } : photo
      ),
      activeId: prev.activeId,
    })
    startThumb(prev.activeId, file)
    setError(null)
  }, [commitBatch, startThumb])

  const selectPhoto = useCallback((id: string) => {
    const prev = batchRef.current
    if (!prev.photos.some((photo) => photo.id === id) || prev.activeId === id) return
    commitBatch({ ...prev, activeId: id })
  }, [commitBatch])

  const removePhoto = useCallback((id: string) => {
    const prev = batchRef.current
    const target = prev.photos.find((photo) => photo.id === id)
    if (!target) return
    releasePhotoUrls(target)
    const photos = prev.photos.filter((photo) => photo.id !== id)
    let activeId = prev.activeId
    if (activeId === id) {
      const index = prev.photos.findIndex((photo) => photo.id === id)
      activeId = photos[Math.min(index, photos.length - 1)]?.id ?? null
    }
    commitBatch({ photos, activeId })
  }, [commitBatch])

  const reset = useCallback(() => {
    for (const photo of batchRef.current.photos) releasePhotoUrls(photo)
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
    setExportFormat(DEFAULT_EDITOR_STATE.exportFormat)
    setExportLongEdge(DEFAULT_EDITOR_STATE.exportLongEdge)
    setExportQuality(DEFAULT_EDITOR_STATE.exportQuality)
    setOutlineWidth(DEFAULT_EDITOR_STATE.outlineWidth)
    setOutlineColor(DEFAULT_EDITOR_STATE.outlineColor)
    setShadowEnabled(DEFAULT_EDITOR_STATE.shadowEnabled)
    setShadowColor(DEFAULT_EDITOR_STATE.shadowColor)
    setShadowBlur(DEFAULT_EDITOR_STATE.shadowBlur)
    setShadowOffsetX(DEFAULT_EDITOR_STATE.shadowOffsetX)
    setShadowOffsetY(DEFAULT_EDITOR_STATE.shadowOffsetY)
    setDateStamp(DEFAULT_EDITOR_STATE.dateStamp)
    setCropAspect(DEFAULT_EDITOR_STATE.cropAspect)
    setQuarterTurns(DEFAULT_EDITOR_STATE.quarterTurns)
    releaseLogo()
    clearSignature()
    setError(null)
  }, [commitBatch, releaseLogo, clearSignature])

  const clearError = useCallback(() => setError(null), [])

  const applySettings = useCallback((settings: PresetSettings) => {
    setWatermarkMode(settings.watermarkMode)
    setWatermarkText(settings.watermarkText)
    setFontFamily(settings.fontFamily)
    setFontSize(settings.fontSize)
    setColor(settings.color)
    setOpacity(settings.opacity)
    setRotation(settings.rotation)
    setPlacement(settings.placement)
    setTextDirection(settings.textDirection)
    setCoverageMode(settings.coverageMode)
    setPattern(settings.pattern)
    setDensity(settings.density)
    setCurveOrientation(settings.curveOrientation)
    setStampSize(settings.stampSize)
    setQrUrl(settings.qrUrl)
    setQrColor(settings.qrColor)
    setExportFormat(settings.exportFormat)
    setExportLongEdge(settings.exportLongEdge)
    setExportQuality(settings.exportQuality)
    setOutlineWidth(settings.outlineWidth)
    setOutlineColor(settings.outlineColor)
    setShadowEnabled(settings.shadowEnabled)
    setShadowColor(settings.shadowColor)
    setShadowBlur(settings.shadowBlur)
    setShadowOffsetX(settings.shadowOffsetX)
    setShadowOffsetY(settings.shadowOffsetY)
    setDateStamp(settings.dateStamp)
    setCropAspect(settings.cropAspect)
    setQuarterTurns(settings.quarterTurns)
    setError(null)
  }, [])

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
    exportFormat,
    exportLongEdge,
    exportQuality,
    outlineWidth,
    outlineColor,
    shadowEnabled,
    shadowColor,
    shadowBlur,
    shadowOffsetX,
    shadowOffsetY,
    dateStamp,
    cropAspect,
    quarterTurns,
    logoPreviewUrl,
    logoName,
    signaturePreviewUrl,
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
    setExportFormat,
    setExportLongEdge,
    setExportQuality,
    setOutlineWidth,
    setOutlineColor,
    setShadowEnabled,
    setShadowColor,
    setShadowBlur,
    setShadowOffsetX,
    setShadowOffsetY,
    setDateStamp,
    setCropAspect,
    setQuarterTurns,
    applySettings,
    setLogo,
    clearLogo: releaseLogo,
    setSignature,
    clearSignature,
    reset,
    clearError,
  }
}

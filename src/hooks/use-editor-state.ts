import { useState, useCallback, useEffect, useRef } from "react"
import {
  type EditorState,
  type Placement,
  type TextDirection,
  type CoverageMode,
  type CurveOrientation,
  type Pattern,
  DEFAULT_EDITOR_STATE,
  ACCEPTED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
} from "@/lib/editor-types"
import type { EditorInitialData } from "@/App"

export function useEditorState(initialData?: EditorInitialData) {
  const init = initialData?.settings ?? {}

  const [image, setImageFile] = useState<File | null>(initialData?.image ?? null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
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
  const [error, setError] = useState<string | null>(null)

  const urlRef = useRef<string | null>(null)

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  // If an initial image was provided, create a preview URL for it
  useEffect(() => {
    if (initialData?.image) {
      const url = URL.createObjectURL(initialData.image)
      urlRef.current = url
      setImagePreviewUrl(url)
    }
    return () => {
      revokeUrl()
    }
    // Only runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setImage = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a PNG, JPG, or WebP image.")
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Image is too large. Maximum file size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    revokeUrl()
    setError(null)

    const url = URL.createObjectURL(file)
    urlRef.current = url
    setImageFile(file)
    setImagePreviewUrl(url)
  }, [revokeUrl])

  const reset = useCallback(() => {
    revokeUrl()
    setImageFile(null)
    setImagePreviewUrl(null)
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
    setError(null)
  }, [revokeUrl])

  const clearError = useCallback(() => setError(null), [])

  const state: EditorState = {
    image,
    imagePreviewUrl,
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
    error,
  }

  return {
    state,
    setImage,
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
    reset,
    clearError,
  }
}

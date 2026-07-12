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

export function useEditorState() {
  const [image, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [watermarkText, setWatermarkText] = useState(DEFAULT_EDITOR_STATE.watermarkText)
  const [fontFamily, setFontFamily] = useState(DEFAULT_EDITOR_STATE.fontFamily)
  const [fontSize, setFontSize] = useState(DEFAULT_EDITOR_STATE.fontSize)
  const [color, setColor] = useState(DEFAULT_EDITOR_STATE.color)
  const [opacity, setOpacity] = useState(DEFAULT_EDITOR_STATE.opacity)
  const [rotation, setRotation] = useState(DEFAULT_EDITOR_STATE.rotation)
  const [placement, setPlacement] = useState<Placement>(DEFAULT_EDITOR_STATE.placement)
  const [textDirection, setTextDirection] = useState<TextDirection>(DEFAULT_EDITOR_STATE.textDirection)
  const [coverageMode, setCoverageMode] = useState<CoverageMode>(DEFAULT_EDITOR_STATE.coverageMode)
  const [pattern, setPattern] = useState<Pattern>(DEFAULT_EDITOR_STATE.pattern)
  const [density, setDensity] = useState(DEFAULT_EDITOR_STATE.density)
  const [curveOrientation, setCurveOrientation] = useState<CurveOrientation>(DEFAULT_EDITOR_STATE.curveOrientation)
  const [error, setError] = useState<string | null>(null)

  const urlRef = useRef<string | null>(null)

  const revokeUrl = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current)
      urlRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      revokeUrl()
    }
  }, [revokeUrl])

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

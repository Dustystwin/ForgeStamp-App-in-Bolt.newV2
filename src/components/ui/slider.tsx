import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  onValueChange,
  onPointerDownCapture,
  onPointerUpCapture,
  onPointerCancelCapture,
  onLostPointerCapture,
  onKeyDownCapture,
  onKeyUpCapture,
  onBlurCapture,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  // A single thumb unless the caller passes a range. The old fallback of
  // [min, max] drew two thumbs for one value and could commit a jump.
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min],
    [value, defaultValue, min]
  )
  // Ignore value changes that are not from a pointer or key on this slider.
  // Switching Full Coverage mounts another slider and reflows the panel; that
  // must not move the font size on its own.
  const interacting = React.useRef(false)

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      onValueChange={(next) => {
        if (!interacting.current) return
        onValueChange?.(next)
      }}
      onPointerDownCapture={(event) => {
        interacting.current = true
        onPointerDownCapture?.(event)
      }}
      onPointerUpCapture={(event) => {
        onPointerUpCapture?.(event)
        interacting.current = false
      }}
      onPointerCancelCapture={(event) => {
        onPointerCancelCapture?.(event)
        interacting.current = false
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event)
        interacting.current = false
      }}
      onKeyDownCapture={(event) => {
        interacting.current = true
        onKeyDownCapture?.(event)
      }}
      onKeyUpCapture={(event) => {
        onKeyUpCapture?.(event)
        interacting.current = false
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event)
        interacting.current = false
      }}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

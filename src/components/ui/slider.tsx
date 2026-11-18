import * as React from "react"
import { Slider as SliderPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function formatThumb(value: number, suffix?: string) {
  const shown = Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
  return suffix ? `${shown}${suffix}` : shown
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  suffix,
  onValueChange,
  onPointerDownCapture,
  onPointerUpCapture,
  onPointerCancelCapture,
  onLostPointerCapture,
  onKeyDownCapture,
  onKeyUpCapture,
  onBlurCapture,
  onPointerEnter,
  onPointerLeave,
  onFocusCapture,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root> & {
  /** Shown after the number in the bubble, such as "%" or "°". */
  suffix?: string
}) {
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
  const [hovering, setHovering] = React.useState(false)
  const [dragging, setDragging] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const showValue = hovering || dragging || focused

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
      onPointerEnter={(event) => {
        setHovering(true)
        onPointerEnter?.(event)
      }}
      onPointerLeave={(event) => {
        setHovering(false)
        onPointerLeave?.(event)
      }}
      onPointerDownCapture={(event) => {
        interacting.current = true
        setDragging(true)
        onPointerDownCapture?.(event)
      }}
      onPointerUpCapture={(event) => {
        onPointerUpCapture?.(event)
        interacting.current = false
        setDragging(false)
      }}
      onPointerCancelCapture={(event) => {
        onPointerCancelCapture?.(event)
        interacting.current = false
        setDragging(false)
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event)
        interacting.current = false
        setDragging(false)
      }}
      onFocusCapture={(event) => {
        setFocused(true)
        onFocusCapture?.(event)
      }}
      onKeyDownCapture={(event) => {
        interacting.current = true
        setDragging(true)
        onKeyDownCapture?.(event)
      }}
      onKeyUpCapture={(event) => {
        onKeyUpCapture?.(event)
        interacting.current = false
        setDragging(false)
      }}
      onBlurCapture={(event) => {
        onBlurCapture?.(event)
        interacting.current = false
        setDragging(false)
        setFocused(false)
      }}
      className={cn(
        "relative flex w-full touch-none items-center py-3 select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-black/10 data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5"
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
          className={cn(
            "relative block size-6 shrink-0 rounded-full border-2 border-primary bg-white shadow-[0_2px_6px_rgba(90,40,10,0.28)]",
            "ring-primary/40 transition-[box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden",
            "before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
            "md:before:size-8",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {showValue && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 rounded-md bg-foreground px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-background shadow-sm"
            >
              {formatThumb(_values[index] ?? min, suffix)}
              <span className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-t-[5px] border-x-transparent border-t-foreground" />
            </span>
          )}
        </SliderPrimitive.Thumb>
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

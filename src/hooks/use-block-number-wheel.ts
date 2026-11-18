import { useEffect, useRef } from "react"

function wheelPixels(event: WheelEvent): number {
  if (event.deltaMode === 1) return event.deltaY * 16
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight
  return event.deltaY
}

function scrollParent(element: HTMLElement): HTMLElement | null {
  let parent = element.parentElement
  while (parent) {
    const overflow = getComputedStyle(parent).overflowY
    if (overflow === "auto" || overflow === "scroll") return parent
    parent = parent.parentElement
  }
  return null
}

/**
 * Number inputs change their value when the pointer wheel is over them.
 * The editor sidebar scrolls, so a flick of the trackpad could jump a size
 * from 60 to 120 while the person was only moving the panel.
 */
export function useBlockNumberWheel() {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = ref.current
    if (!input) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const scroller = scrollParent(input)
      if (scroller) scroller.scrollTop += wheelPixels(event)
    }
    input.addEventListener("wheel", onWheel, { passive: false })
    return () => input.removeEventListener("wheel", onWheel)
  }, [])

  return ref
}

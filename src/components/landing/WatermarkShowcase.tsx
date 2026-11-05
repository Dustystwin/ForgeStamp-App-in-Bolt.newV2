import { useCallback, useEffect, useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ShieldCheck } from "lucide-react"

import photoDiagonal from "@/assets/landing/showcase/photo-diagonal.png"
import productSingle from "@/assets/landing/showcase/product-single.png"
import artworkHoneycomb from "@/assets/landing/showcase/artwork-honeycomb.png"
import photoBase from "@/assets/landing/demo/photo-base.png"
import productBase from "@/assets/landing/demo/product-base.png"
import artworkBase from "@/assets/landing/demo/artwork-base.png"

// Landing-only demonstration data. Deliberately NOT wired to the real
// watermark-rendering engine (see src/lib/watermark-utils.ts) — these are
// pre-rendered illustrations of real, currently-supported patterns, kept
// isolated so nothing here can ever affect editor behavior.
//
// REPLACE LATER: each `after` image is a placeholder illustration. Swap the
// import for a final photographed/exported example, or drop in an 8–15s
// product video and remove the carousel below, once available.
const SLIDES = [
  {
    before: photoBase,
    after: photoDiagonal,
    label: "Diagonal",
    caption: "Full Coverage \u2014 Diagonal",
  },
  {
    before: productBase,
    after: productSingle,
    label: "Single Placement",
    caption: "Single watermark, bottom-right",
  },
  {
    before: artworkBase,
    after: artworkHoneycomb,
    label: "Honeycomb",
    caption: "Full Coverage \u2014 Honeycomb",
  },
] as const

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const handler = () => setReduced(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return reduced
}

export function WatermarkShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selected, setSelected] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const reducedMotion = useReducedMotion()

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
    setRevealed(false)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on("select", onSelect)
    onSelect()
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  // Autoplay: advance every 3.4s, reveal the watermark partway through each
  // slide so the transformation (blank -> protected) is visible, not just a
  // static image swap. Fully disabled under prefers-reduced-motion.
  useEffect(() => {
    if (!emblaApi || reducedMotion) return
    const revealTimer = setTimeout(() => setRevealed(true), 900)
    const advanceTimer = setInterval(() => emblaApi.scrollNext(), 3400)
    return () => {
      clearTimeout(revealTimer)
      clearInterval(advanceTimer)
    }
  }, [emblaApi, selected, reducedMotion])

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-2xl border border-black/5 shadow-[0_30px_60px_-30px_rgba(43,48,58,0.35)]"
        ref={emblaRef}
      >
        <div className="flex">
          {SLIDES.map((slide, i) => (
            <div key={slide.label} className="relative min-w-0 flex-[0_0_100%]">
              {/* Reserve a fixed aspect ratio so nothing shifts while loading */}
              <div className="relative aspect-square w-full bg-[var(--fs-cream-deep)]">
                <img
                  src={slide.before}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <img
                  src={slide.after}
                  alt={`Example image with a ForgeStamp ${slide.label} watermark applied`}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
                  style={{ opacity: reducedMotion || (i === selected && revealed) ? 1 : i === selected ? 0 : 1 }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 bg-white/95 px-4 py-3 backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-xs font-semibold fs-text-emerald">
                  <ShieldCheck className="size-3.5" />
                  {slide.caption}
                </span>
                <span className="rounded-full bg-[var(--fs-cream-deep)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--fs-ink)]/70">
                  {i + 1} / {SLIDES.length}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Showcase slides">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.label}
            type="button"
            role="tab"
            aria-selected={i === selected}
            aria-label={`Show ${slide.label} example`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === selected ? "w-6 bg-[var(--fs-orange)]" : "w-1.5 bg-[var(--fs-ink)]/15"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

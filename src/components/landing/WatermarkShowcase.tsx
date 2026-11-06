import { useState } from "react"

import photoDiagonal from "@/assets/landing/showcase/photo-diagonal.png"
import productSingle from "@/assets/landing/showcase/product-single.png"
import artworkHoneycomb from "@/assets/landing/showcase/artwork-honeycomb.png"
import photoBase from "@/assets/landing/demo/photo-base.png"
import productBase from "@/assets/landing/demo/product-base.png"
import artworkBase from "@/assets/landing/demo/artwork-base.png"
import { cn } from "@/lib/utils"

// Landing-only demonstration data. Deliberately NOT wired to the real
// watermark-rendering engine (see src/lib/watermark-utils.ts). These are
// pre-rendered illustrations of patterns the editor already supports.
const SLIDES = [
  {
    before: photoBase,
    after: photoDiagonal,
    label: "Diagonal",
    beforeAlt: "Sample illustration of hills and a sun, without a watermark.",
    afterAlt: "The same hills illustration with a repeating SAMPLE TEXT watermark on a diagonal.",
    caption: "Repeated across the picture",
  },
  {
    before: productBase,
    after: productSingle,
    label: "Single mark",
    beforeAlt: "Sample illustration of a mug, without a watermark.",
    afterAlt: "The same mug illustration with one watermark in the bottom right.",
    caption: "One mark, bottom right",
  },
  {
    before: artworkBase,
    after: artworkHoneycomb,
    label: "Honeycomb",
    beforeAlt: "Sample illustration of overlapping circles, without a watermark.",
    afterAlt: "The same circle illustration with a honeycomb SAMPLE TEXT watermark.",
    caption: "Repeated in a honeycomb",
  },
] as const

function Frame({
  src,
  alt,
  label,
  detail,
}: {
  src: string
  alt: string
  label: string
  detail?: string
}) {
  return (
    <figure className="min-w-0">
      <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-[var(--fs-cream-deep)] shadow-[0_18px_36px_-26px_rgba(60,40,20,0.55)]">
        <img src={src} alt={alt} className="aspect-square w-full object-cover" />
        <figcaption className="absolute top-3 left-3 rounded-full border border-black/10 bg-white px-3 py-1.5 text-sm shadow-[0_8px_16px_-12px_rgba(40,30,20,0.7)]">
          <span className="font-medium text-[var(--fs-ink)]">{label}</span>
          {detail ? <span className="fs-text-soft"> · {detail}</span> : null}
        </figcaption>
      </div>
    </figure>
  )
}

export function WatermarkShowcase() {
  const [index, setIndex] = useState(0)
  const [showAfter, setShowAfter] = useState(true)
  const slide = SLIDES[index]

  return (
    <div>
      <div className="md:hidden">
        <Frame
          src={showAfter ? slide.after : slide.before}
          alt={showAfter ? slide.afterAlt : slide.beforeAlt}
          label={showAfter ? "After" : "Before"}
          detail={showAfter ? slide.caption : "No watermark"}
        />
        <div
          role="group"
          aria-label="Show the image with or without a watermark"
          className="mt-3 grid grid-cols-2 gap-2"
        >
          <button
            type="button"
            aria-pressed={!showAfter}
            onClick={() => setShowAfter(false)}
            className={cn(
              "min-h-11 rounded-lg border text-sm font-medium",
              !showAfter
                ? "border-[var(--fs-orange)] bg-[var(--fs-orange)] text-[var(--fs-ink)]"
                : "border-black/10 bg-white/70 fs-text-soft"
            )}
          >
            Before
          </button>
          <button
            type="button"
            aria-pressed={showAfter}
            onClick={() => setShowAfter(true)}
            className={cn(
              "min-h-11 rounded-lg border text-sm font-medium",
              showAfter
                ? "border-[var(--fs-orange)] bg-[var(--fs-orange)] text-[var(--fs-ink)]"
                : "border-black/10 bg-white/70 fs-text-soft"
            )}
          >
            After
          </button>
        </div>
      </div>

      <div className="hidden gap-5 md:grid md:grid-cols-2">
        <Frame src={slide.before} alt={slide.beforeAlt} label="Before" detail="No watermark" />
        <Frame src={slide.after} alt={slide.afterAlt} label="After" detail={slide.caption} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Choose an example">
        {SLIDES.map((item, i) => (
          <button
            key={item.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className={cn(
              "min-h-11 rounded-full border px-4 text-sm font-medium",
              i === index
                ? "border-[var(--fs-orange)] bg-[var(--fs-orange)] text-[var(--fs-ink)]"
                : "border-[color-mix(in_oklch,var(--fs-orange)_25%,white)] bg-white/80 fs-text-soft hover:bg-white"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

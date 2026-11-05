import patternDiagonal from "@/assets/landing/patterns/pattern-diagonal.png"
import patternHoneycomb from "@/assets/landing/patterns/pattern-honeycomb.png"
import patternSingle from "@/assets/landing/patterns/pattern-single.png"

const EXAMPLES = [
  { src: patternSingle, label: "Single Placement" },
  { src: patternDiagonal, label: "Full Coverage \u2014 Diagonal" },
  { src: patternHoneycomb, label: "Full Coverage \u2014 Honeycomb" },
] as const

export function PatternShowcase() {
  return (
    <section className="fs-surface-slate px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          One image. Plenty of ways to make your mark.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed fs-text-muted-onslate md:text-lg">
          Place a single mark exactly where you want it, or repeat it across
          the whole frame with one of ForgeStamp&rsquo;s 16 Full Coverage
          patterns.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
        {EXAMPLES.map((ex, i) => (
          <figure
            key={ex.label}
            className={`overflow-hidden rounded-xl border border-white/10 ${i === 1 ? "md:-translate-y-4" : ""}`}
          >
            <img src={ex.src} alt={`Example image using ForgeStamp's ${ex.label} watermark`} className="block w-full" />
            <figcaption className="bg-black/30 px-4 py-3 text-sm font-medium text-white/85">
              {ex.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

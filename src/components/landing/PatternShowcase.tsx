import patternDiagonal from "@/assets/landing/patterns/pattern-diagonal.png"
import patternHoneycomb from "@/assets/landing/patterns/pattern-honeycomb.png"
import patternSingle from "@/assets/landing/patterns/pattern-single.png"

const EXAMPLES = [
  { src: patternSingle, label: "Single placement", alt: "Sample image with one watermark placed on it." },
  { src: patternDiagonal, label: "Diagonal coverage", alt: "Sample image with a diagonal watermark pattern across it." },
  { src: patternHoneycomb, label: "Honeycomb coverage", alt: "Sample image with a honeycomb watermark pattern across it." },
] as const

export function PatternShowcase() {
  return (
    <section id="features" className="scroll-mt-20 px-4 pt-10 pb-16 md:px-6 md:pt-14 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display max-w-xl text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          A single mark, or a pattern across the picture.
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed fs-text-soft">
          Place the watermark once, or repeat it. ForgeStamp includes 16 full-coverage patterns. Three of them are below.
        </p>

        <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {EXAMPLES.map((example) => (
            <figure key={example.label} className="min-w-0">
              <div className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                <img src={example.src} alt={example.alt} className="aspect-square w-full object-cover" />
              </div>
              <figcaption className="mt-3 text-sm font-medium text-[var(--fs-ink)]">{example.label}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

import coffeeMarked from "@/assets/demos/coffee-marked.jpg"
import portraitMarked from "@/assets/demos/portrait-marked.jpg"
import bowlMarked from "@/assets/demos/bowl-marked.jpg"
import ridge from "@/assets/demos/ridge.jpg"
import ridgeMarked from "@/assets/demos/ridge-marked.jpg"
import { cn } from "@/lib/utils"

// Demo photographs are Unsplash stock (Unsplash License), composited here.
// Sample words are only "Your Text" and "Sample Test". The QR encodes
// https://example.com. Sources:
// portrait  images.unsplash.com/photo-1544005313-94ddf0286df2
// coffee    images.unsplash.com/photo-1495474472287-4d71bcdd2085
// bowl      images.unsplash.com/photo-1546069901-ba9599a7e63c
// ridge     images.unsplash.com/photo-1469474968028-56623f02e42e

const PRINTS = [
  {
    src: coffeeMarked,
    alt: "Overhead photograph of three coffee drinks with a Sample Test watermark along the bottom.",
    className: "left-0 top-6 w-[52%] -rotate-6 md:top-10 md:w-[50%]",
  },
  {
    src: bowlMarked,
    alt: "Overhead photograph of a grain bowl with a QR code watermark in the lower right.",
    className: "right-0 top-4 w-[52%] rotate-[5deg] md:top-8 md:w-[50%]",
  },
  {
    src: portraitMarked,
    alt: "Warm portrait photograph with a Your Text watermark across the lower part of the frame.",
    className: "left-1/2 top-0 z-10 w-[46%] -translate-x-1/2 rotate-1 md:w-[44%]",
  },
] as const

export function PhotoPrints() {
  return (
    <div className="min-w-0">
      <div className="fs-prints relative mx-auto h-[300px] w-full max-w-lg sm:h-[360px] md:h-[460px] md:max-w-none">
        {PRINTS.map((print) => (
          <figure
            key={print.alt}
            className={cn(
              "absolute overflow-hidden rounded-[2px] bg-white p-1.5 shadow-[0_22px_36px_-18px_rgba(48,32,16,0.55)] md:p-2",
              print.className
            )}
          >
            <img
              src={print.src}
              alt={print.alt}
              width={1000}
              height={1250}
              className="aspect-[4/5] w-full object-cover"
            />
          </figure>
        ))}
      </div>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed fs-text-soft md:mx-0">
        Your Text on the portrait. Sample Test on the coffee.{" "}
        <span className="text-[var(--fs-ink)]">
          A QR watermark, like the one on the bowl, can open a portfolio, shop, or website when someone scans it.
        </span>
      </p>
    </div>
  )
}

export function PhotoCompare() {
  return (
    <section id="features" className="scroll-mt-20 px-4 pt-10 pb-14 md:px-6 md:pt-14 md:pb-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display max-w-xl text-[1.75rem] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Before and after.
        </h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed fs-text-soft">
          The same photograph. Your Text is repeated on a diagonal, one of 16 full-coverage patterns.
        </p>

        <div className="mt-8 grid gap-6 md:mt-10 md:grid-cols-2 md:gap-5">
          <figure className="min-w-0">
            <div className="bg-white p-1.5 shadow-[0_18px_34px_-20px_rgba(48,32,16,0.5)] md:p-2">
              <img
                src={ridge}
                alt="Sunlit green mountain ridge with no watermark."
                width={1600}
                height={1066}
                loading="lazy"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-[var(--fs-ink)]">
              <span className="font-semibold">Before</span>
              <span className="fs-text-soft"> · No watermark</span>
            </figcaption>
          </figure>
          <figure className="min-w-0">
            <div className="bg-white p-1.5 shadow-[0_18px_34px_-20px_rgba(48,32,16,0.5)] md:p-2">
              <img
                src={ridgeMarked}
                alt="The same mountain ridge with Your Text repeated on a diagonal."
                width={1600}
                height={1066}
                loading="lazy"
                className="aspect-[3/2] w-full object-cover"
              />
            </div>
            <figcaption className="mt-3 text-sm text-[var(--fs-ink)]">
              <span className="font-semibold text-[var(--fs-emerald-deep)]">After</span>
              <span className="fs-text-soft"> · Your Text, repeated</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}

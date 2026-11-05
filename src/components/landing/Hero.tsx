import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"
import { WatermarkShowcase } from "./WatermarkShowcase"

export function Hero() {
  const { navigateTo } = useNavigation()

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-14 md:px-6 md:pb-20 md:pt-16">
      {/* Subtle sunrise wash, not a generic blurred-orb backdrop */}
      <div className="pointer-events-none absolute inset-0 fs-gradient-sunrise opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 fs-gradient-sunrise" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-14">
        {/* Messaging — left, editorial, left-aligned (not centered) */}
        <div className="text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--fs-orange)]/25 bg-white px-3 py-1 text-xs font-semibold fs-text-orange">
            <Sparkles className="size-3.5" />
            Every mark starts with a spark
          </span>

          <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--fs-ink)] md:text-5xl">
            Protect what you create.
            <br />
            <span className="fs-gradient-sunrise-text">Make it unmistakably yours.</span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--fs-ink)]/70 md:text-lg">
            ForgeStamp turns any image into a protected one in seconds &mdash;
            custom text, fonts, colors, and patterns that repeat across the
            whole frame if you want them to.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="fs-btn-primary shadow-md shadow-[var(--fs-orange)]/25"
              onClick={() => navigateTo("editor")}
            >
              Start Watermarking
              <ArrowRight className="ml-1 size-4" />
            </Button>
            <Button asChild variant="outline" size="lg" className="border-[var(--fs-ink)]/15">
              <a href="#showcase">See It In Action</a>
            </Button>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--fs-ink)]/55">
            <span>No account needed to try</span>
            <span className="h-1 w-1 rounded-full bg-current" />
            <span>Live preview as you go</span>
            <span className="h-1 w-1 rounded-full bg-current" />
            <span>Export in one click</span>
          </div>
        </div>

        {/* Product showcase — right, asymmetric weight */}
        <div id="showcase">
          <WatermarkShowcase />
        </div>
      </div>
    </section>
  )
}

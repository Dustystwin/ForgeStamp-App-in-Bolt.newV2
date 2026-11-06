import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"
import { WatermarkShowcase } from "./WatermarkShowcase"

export function Hero() {
  const { navigateTo } = useNavigation()

  return (
    <section className="fs-hero-wash px-4 pb-8 pt-10 md:px-6 md:pb-12 md:pt-16">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-xl">
          <h1 className="fs-display text-[1.75rem] font-medium leading-[1.2] tracking-[-0.02em] text-[var(--fs-ink)] md:text-[3.25rem] md:leading-[1.12]">
            Watermark your images before you share them.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed fs-text-soft md:text-lg">
            Add your own words, see the result immediately, and download a PNG.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              className="fs-btn-primary h-11 min-h-11 w-full px-5 text-base shadow-none sm:w-auto"
              onClick={() => navigateTo("editor")}
            >
              Try a watermark
            </Button>
            <a
              href="#pricing"
              className="inline-flex h-11 min-h-11 items-center justify-center rounded-md px-4 text-base font-semibold text-[var(--fs-orange-deep)] underline-offset-4 hover:underline sm:justify-start"
            >
              See plans
            </a>
          </div>
          <p className="mt-3 text-sm fs-text-soft">No account needed to try.</p>
        </div>

        <div className="mt-8 md:mt-12">
          <WatermarkShowcase />
        </div>
      </div>
    </section>
  )
}

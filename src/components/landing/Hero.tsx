import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"
import { PhotoCompare, PhotoPrints } from "./PhotoProof"

export function Hero() {
  const { navigateTo } = useNavigation()

  return (
    <div className="fs-hero-wash">
      <section className="px-4 pt-8 pb-2 md:px-6 md:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] md:gap-8 lg:gap-12">
          <div className="max-w-xl">
            <h1 className="fs-display text-[2.25rem] font-medium leading-[1.08] tracking-[-0.03em] text-[var(--fs-ink)] sm:text-[2.6rem] md:text-[3.15rem] lg:text-[3.55rem]">
              Watermark your images before you share them.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed fs-text-soft md:mt-5 md:text-lg">
              Add words, a logo, or a QR code. See the result immediately, and download a PNG.
            </p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                className="fs-btn-primary h-11 min-h-11 w-full px-5 text-base shadow-none sm:w-auto"
                onClick={() => navigateTo("editor")}
              >
                Try a watermark
              </Button>
              <a
                href="#pricing"
                className="inline-flex h-11 min-h-11 items-center justify-center rounded-md px-4 text-base font-semibold text-[var(--fs-emerald-deep)] underline-offset-4 hover:underline sm:justify-start"
              >
                See plans
              </a>
            </div>
            <p className="mt-3 text-sm fs-text-soft">No account needed to try.</p>
          </div>

          <PhotoPrints />
        </div>
      </section>
      <PhotoCompare />
    </div>
  )
}

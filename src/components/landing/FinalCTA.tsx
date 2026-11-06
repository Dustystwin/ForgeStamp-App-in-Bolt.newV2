import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"

export function FinalCTA() {
  const { navigateTo } = useNavigation()

  return (
    <section className="fs-hero-wash px-4 pb-24 pt-0 md:px-6 md:pb-32">
      <div className="fs-mark-divider" aria-hidden="true" />
      <div className="mx-auto max-w-6xl pt-16 md:pt-20">
        <h2 className="fs-display max-w-md text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Try it on your own image.
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed fs-text-soft">
          Open the editor, add a watermark, and download a PNG.
        </p>
        <Button
          className="fs-btn-primary mt-8 h-11 min-h-11 px-5 text-base shadow-none"
          onClick={() => navigateTo("editor")}
        >
          Try a watermark
        </Button>
      </div>
    </section>
  )
}

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"

export function FinalCTA() {
  const { navigateTo } = useNavigation()

  return (
    <section className="fs-surface-slate-deep relative overflow-hidden px-4 py-16 text-center md:px-6 md:py-24">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 fs-mark-divider" />
      <div className="relative mx-auto max-w-xl">
        <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          Your work deserves your mark.
        </h2>
        <p className="mt-3 text-base fs-text-muted-onslate md:text-lg">
          Protect what you create in less time than it takes to write a caption.
        </p>
        <Button
          size="lg"
          className="fs-btn-primary mt-8 shadow-lg shadow-black/20"
          onClick={() => navigateTo("editor")}
        >
          Start Watermarking
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </section>
  )
}

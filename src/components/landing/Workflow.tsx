import { Upload, Paintbrush, Download, ArrowRight } from "lucide-react"

const STEPS = [
  { title: "Upload", description: "Bring in the image you want to protect.", icon: Upload, tint: "var(--fs-orange)" },
  { title: "Customize", description: "Shape the text, style, and pattern until it's right.", icon: Paintbrush, tint: "var(--fs-aqua)" },
  { title: "Export", description: "Download a clean, protected copy in seconds.", icon: Download, tint: "var(--fs-emerald)" },
] as const

export function Workflow() {
  return (
    <section id="how-it-works" className="fs-surface-cream px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
          From upload to protected.
        </h2>

        <div className="mt-14 flex flex-col items-stretch gap-0 md:flex-row md:items-center">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="flex flex-1 flex-col items-center text-center md:flex-row md:text-left">
                <div className="flex flex-col items-center md:items-start">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md"
                    style={{ background: step.tint }}
                  >
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--fs-ink)] md:mt-4">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-[190px] text-sm leading-relaxed text-[var(--fs-ink)]/65">
                    {step.description}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="my-4 flex items-center justify-center md:mx-4 md:my-0 md:flex-1">
                    <ArrowRight className="size-5 rotate-90 text-[var(--fs-ink)]/20 md:rotate-0" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

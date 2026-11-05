import { Zap, Eye, SlidersHorizontal, Layers } from "lucide-react"

const VALUES = [
  { title: "Fast by default", description: "Go from upload to exported image in under a minute.", icon: Zap },
  { title: "See it before you export", description: "Every adjustment updates the preview immediately.", icon: Eye },
  { title: "As simple or detailed as you need", description: "Quick single placement, or fine-tune every setting.", icon: SlidersHorizontal },
  { title: "Room to grow", description: "Start free, and move up when your needs do.", icon: Layers },
] as const

export function CreatorValue() {
  return (
    <section className="fs-surface-cream-deep px-4 py-16 md:px-6 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="max-w-lg">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
            Built for the way creators work.
          </h2>
        </div>

        <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {VALUES.map((value) => {
            const Icon = value.icon
            return (
              <div key={value.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon className="size-4.5 fs-text-emerald" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--fs-ink)]">{value.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--fs-ink)]/65">
                    {value.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

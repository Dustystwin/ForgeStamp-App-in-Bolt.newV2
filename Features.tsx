import { Section } from "@/components/layout/Section"
import { FEATURES } from "@/lib/constants"

export function Features() {
  return (
    <Section id="features" className="py-12 md:py-16">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Focused Tools for Professional Image Watermarks
        </h2>
        <p className="mt-3 max-w-2xl mx-auto text-muted-foreground md:text-lg">
          Simple controls for creating clean, polished watermarks without complicated design software.
        </p>
      </div>

      <div className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="group rounded-lg border border-border/30 bg-card/80 p-3.5 transition-all hover:border-border/60 hover:bg-card hover:shadow-sm"
            >
              <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-primary/[0.07]">
                <Icon className="size-3.5 text-primary" />
              </div>
              <h3 className="text-[13px] font-semibold tracking-tight">{feature.title}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

import { Section } from "@/components/layout/Section"
import { WHY_REASONS } from "@/lib/constants"

export function WhySection() {
  return (
    <Section className="relative overflow-hidden bg-surface py-12 md:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 right-0 h-[260px] w-[260px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-20 left-0 h-[220px] w-[220px] rounded-full bg-emerald/[0.04] blur-3xl" />
      </div>

      <div className="relative text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Why Creators Choose ForgeStamp
        </h2>
        <p className="mt-3 text-muted-foreground md:text-lg">
          Built with intention, designed for people who take their creative work
          seriously.
        </p>
      </div>

      <div className="relative mt-8 grid gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_REASONS.map((reason) => {
          const Icon = reason.icon
          return (
            <div key={reason.title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-emerald/15 to-emerald/5 ring-1 ring-emerald/15">
                <Icon className="size-3.5 text-emerald" />
              </div>
              <div className="pt-0.5">
                <h3 className="text-sm font-semibold tracking-tight leading-tight">{reason.title}</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground leading-relaxed">
                  {reason.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

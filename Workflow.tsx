import { Section } from "@/components/layout/Section"
import { WORKFLOW_STEPS } from "@/lib/constants"

export function Workflow() {
  return (
    <Section id="how-it-works" className="bg-surface py-12 md:py-16">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          From Upload to Protected in Minutes
        </h2>
      </div>

      <div className="relative mt-8 grid gap-6 md:mt-10 md:grid-cols-3 md:gap-10">
        {WORKFLOW_STEPS.map((step) => {
          const Icon = step.icon
          return (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                <Icon className="size-4.5 text-primary" />
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                Step {step.number}
              </span>
              <h3 className="mt-1.5 text-sm font-semibold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-[230px]">
                {step.description}
              </p>
            </div>
          )
        })}

        <div className="pointer-events-none absolute top-5 left-[22%] right-[22%] hidden h-px border-t border-dashed border-primary/20 md:block" />
      </div>
    </Section>
  )
}

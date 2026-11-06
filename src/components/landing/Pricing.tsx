import { useState } from "react"
import { Check, Layers, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PRICING_PLANS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useNavigation } from "@/App"

type Billing = "monthly" | "annual"

export function Pricing() {
  const { navigateTo } = useNavigation()
  const [billing, setBilling] = useState<Billing>("monthly")

  return (
    <section id="pricing" className="scroll-mt-20 bg-[var(--fs-cream-deep)] px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Plans
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed fs-text-soft">
          Free is ready to use. Spark and Forge are not for sale yet. Those prices are a preview, and this page does not take payment.
        </p>

        <div className="mt-8">
          <div
            role="group"
            aria-label="Preview planned prices"
            className="inline-flex rounded-lg border border-black/10 bg-white/70 p-1"
          >
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                aria-pressed={billing === option}
                className={cn(
                  "min-h-11 rounded-md px-4 text-sm font-medium capitalize",
                  billing === option
                    ? "bg-[var(--fs-orange)] text-[var(--fs-ink)]"
                    : "fs-text-soft hover:text-[var(--fs-ink)]"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm fs-text-soft">Choosing monthly or annual does not start a subscription.</p>
        </div>

        <div className="mt-10 grid items-stretch gap-8 md:grid-cols-3 md:gap-5 md:pt-3">
          {PRICING_PLANS.map((plan) => {
            const isFree = plan.name === "Free"
            const isSpark = plan.highlighted
            const displayPrice = isFree ? plan.monthlyPrice : billing === "monthly" ? plan.monthlyPrice : plan.annualPrice
            const displayPeriod = isFree ? "forever" : billing === "monthly" ? "/month" : "/year"
            const showSavings = !isFree && billing === "annual" && plan.annualSavings

            return (
              <div
                key={plan.name}
                className={cn(
                  "relative flex h-full flex-col rounded-2xl p-6",
                  isSpark ? "fs-spark-card z-10 md:-translate-y-3" : "border border-black/10 bg-white"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-6 rounded-full bg-[var(--fs-orange-deep)] px-3 py-1 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}

                <h3 className="text-xl font-semibold text-[var(--fs-ink)]">{plan.name}</h3>
                <p className={cn("mt-1 text-sm", isSpark ? "font-medium text-[var(--fs-orange-deep)]" : "fs-text-soft")}>{plan.tagline}</p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="fs-price text-4xl font-semibold tracking-tight text-[var(--fs-ink)]">{displayPrice}</span>
                  <span className="text-sm fs-text-soft">{displayPeriod}</span>
                </div>
                {showSavings && <p className="mt-2 text-sm font-medium text-[var(--fs-ink)]">{plan.annualSavings} on the yearly preview</p>}
                {!plan.available && (
                  <p className="mt-2 text-sm font-medium text-[var(--fs-ink)]">Planned price. Not for sale.</p>
                )}

                <p className="mt-4 text-sm leading-relaxed fs-text-soft">{plan.description}</p>

                <div className="mt-6 flex-1 space-y-5">
                  <div>
                    {plan.featuresIntro && <p className="mb-3 text-sm font-medium text-[var(--fs-ink)]">{plan.featuresIntro}</p>}
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-[var(--fs-emerald-deep)]" aria-hidden="true" />
                          <span className="text-sm leading-snug text-[var(--fs-ink)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.batch && (
                    <div className={cn("rounded-xl p-3", isSpark ? "bg-white/75" : "bg-[var(--fs-cream-deep)]")}>
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-[var(--fs-ink)]">
                        <Layers className="size-4 fs-text-soft" aria-hidden="true" />
                        {plan.batch.title}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {plan.batch.items.map((item) => (
                          <li key={item} className="text-sm leading-relaxed fs-text-soft">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-start gap-2 border-t border-black/10 pt-4">
                    <Mail className="mt-0.5 size-4 shrink-0 fs-text-soft" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-[var(--fs-ink)]">{plan.support.title}</p>
                      <p className="text-sm fs-text-soft">{plan.support.detail}</p>
                    </div>
                  </div>
                </div>

                {plan.available ? (
                  <Button
                    className="fs-btn-primary mt-6 h-11 min-h-11 w-full shadow-none"
                    onClick={() => navigateTo("editor")}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <p
                    className={cn(
                      "mt-6 flex min-h-11 items-center justify-center rounded-md px-3 text-center text-sm font-semibold text-[var(--fs-ink)]",
                      isSpark ? "bg-[var(--fs-orange)]" : "border border-black/10 bg-white font-medium"
                    )}
                    role="status"
                  >
                    Coming soon. Not for sale.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

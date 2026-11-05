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
    <section id="pricing" className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24 fs-gradient-sunrise">
      {/* Warm sunrise environment, at low opacity so text stays readable —
          this is the one section pricing gets its own branded weather. */}
      <div className="pointer-events-none absolute inset-0 bg-white/[0.86]" />

      <div className="relative mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
            Built for every stage of your creative journey.
          </h2>
          <p className="mt-3 text-[var(--fs-ink)]/70 md:text-lg">
            The Free plan is ready to use. Spark and Forge are not for sale yet.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--fs-ink)]/55">
            Prices on Spark and Forge are a preview of planned pricing. This page does not take payment.
          </p>
        </div>

        <div className="mt-7 flex flex-col items-center">
          <div
            role="group"
            aria-label="Preview planned prices"
            className="inline-flex rounded-lg border border-black/10 bg-white p-1"
          >
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                aria-pressed={billing === option}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fs-orange)]",
                  billing === option
                    ? "bg-[var(--fs-ink)] text-white shadow-sm"
                    : "text-[var(--fs-ink)]/60 hover:text-[var(--fs-ink)]"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-[var(--fs-ink)]/50">
            Preview only. Choosing monthly or annual does not start a subscription.
          </p>
        </div>

        <div className="mx-auto mt-10 grid items-start gap-6 md:grid-cols-3">
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
                  isSpark
                    ? "fs-ring-spark border-2 bg-white md:-translate-y-3"
                    : plan.name === "Forge"
                      ? "border border-[var(--fs-ink)]/12 bg-[var(--fs-slate)] text-white"
                      : "border border-black/10 bg-white/95"
                )}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full fs-gradient-sunrise px-3 py-1 text-[11px] font-semibold text-white shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <h3 className={cn("text-xl font-bold", plan.name === "Forge" ? "text-white" : "text-[var(--fs-ink)]")}>
                  {plan.name}
                </h3>
                <p className={cn("text-sm font-medium", isSpark ? "fs-text-orange" : plan.name === "Forge" ? "text-[var(--fs-amber)]" : "fs-text-emerald")}>
                  {plan.tagline}
                </p>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className={cn("text-3xl font-bold tracking-tight", plan.name === "Forge" ? "text-white" : "text-[var(--fs-ink)]")}>
                    {displayPrice}
                  </span>
                  <span className={cn("text-xs", plan.name === "Forge" ? "text-white/60" : "text-[var(--fs-ink)]/55")}>
                    {displayPeriod}
                  </span>
                </div>
                {showSavings && (
                  <span className="mt-1.5 w-fit rounded-full bg-[var(--fs-emerald)]/15 px-2 py-0.5 text-[11px] font-medium fs-text-emerald">
                    {plan.annualSavings}
                  </span>
                )}
                {!plan.available && (
                  <p className={cn("mt-1.5 text-xs font-medium", plan.name === "Forge" ? "text-[var(--fs-amber)]" : "fs-text-orange")}>
                    Planned price. Not for sale. No payment is collected.
                  </p>
                )}

                <p className={cn("mt-3 text-sm leading-relaxed", plan.name === "Forge" ? "text-white/70" : "text-[var(--fs-ink)]/65")}>
                  {plan.description}
                </p>

                <div className="mt-5 flex-1 space-y-4">
                  <div>
                    {plan.featuresIntro && (
                      <p className={cn("mb-2 text-xs font-medium", plan.name === "Forge" ? "text-white/50" : "text-[var(--fs-ink)]/50")}>
                        {plan.featuresIntro}
                      </p>
                    )}
                    <ul className="space-y-2.5">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className={cn("mt-0.5 size-3.5 shrink-0", plan.name === "Forge" ? "text-[var(--fs-amber)]" : "fs-text-emerald")} />
                          <span className={cn("text-sm", plan.name === "Forge" ? "text-white/85" : "text-[var(--fs-ink)]")}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.batch && (
                    <div
                      className={cn(
                        "rounded-lg border p-3",
                        plan.name === "Forge" ? "border-white/10 bg-white/5" : "border-black/10 bg-[var(--fs-cream-deep)]"
                      )}
                    >
                      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", plan.name === "Forge" ? "text-white" : "text-[var(--fs-ink)]")}>
                        <Layers className="size-3.5 fs-text-orange" />
                        {plan.batch.title}
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {plan.batch.items.map((item) => (
                          <li key={item} className={cn("text-xs leading-relaxed", plan.name === "Forge" ? "text-white/60" : "text-[var(--fs-ink)]/60")}>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className={cn("flex items-start gap-1.5 border-t pt-3", plan.name === "Forge" ? "border-white/10" : "border-black/10")}>
                    <Mail className={cn("mt-0.5 size-3.5 shrink-0", plan.name === "Forge" ? "text-white/50" : "text-[var(--fs-ink)]/45")} />
                    <div>
                      <p className={cn("text-xs font-semibold", plan.name === "Forge" ? "text-white" : "text-[var(--fs-ink)]")}>
                        {plan.support.title}
                      </p>
                      <p className={cn("text-xs", plan.name === "Forge" ? "text-white/55" : "text-[var(--fs-ink)]/55")}>
                        {plan.support.detail}
                      </p>
                    </div>
                  </div>
                </div>

                {plan.available ? (
                  <Button
                    className="mt-6 w-full bg-[var(--fs-ink)] text-white hover:bg-[var(--fs-ink)]/90"
                    onClick={() => navigateTo("editor")}
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <p
                    className={cn(
                      "mt-6 rounded-md border px-3 py-2.5 text-center text-sm font-semibold",
                      plan.name === "Forge"
                        ? "border-white/20 text-white/80"
                        : "border-black/10 text-[var(--fs-ink)]/70"
                    )}
                    role="status"
                  >
                    Coming soon — not for sale
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

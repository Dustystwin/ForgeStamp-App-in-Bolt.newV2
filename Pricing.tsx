import { useState } from "react"
import { Check, Layers, Mail } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Section } from "@/components/layout/Section"
import { PRICING_PLANS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useNavigation } from "@/App"
import { toast } from "sonner"

type Billing = "monthly" | "annual"

export function Pricing() {
  const { navigateTo } = useNavigation()
  const [billing, setBilling] = useState<Billing>("monthly")

  return (
    <Section id="pricing" className="py-12 md:py-16">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Built for Every Stage of Your Creative Journey
        </h2>
        <p className="mt-3 text-muted-foreground md:text-lg">
          Start free, create with confidence, and upgrade only when you're ready.
        </p>
      </div>

      {/* Monthly / Annual billing toggle */}
      <div className="mt-7 flex justify-center">
        <div
          role="group"
          aria-label="Billing period"
          className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-1"
        >
          {(["monthly", "annual"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setBilling(option)}
              aria-pressed={billing === option}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                billing === option
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl items-start gap-6 md:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const isFree = plan.name === "Free"
          const displayPrice = isFree
            ? plan.monthlyPrice
            : billing === "monthly"
              ? plan.monthlyPrice
              : plan.annualPrice
          const displayPeriod = isFree ? "forever" : billing === "monthly" ? "/month" : "/year"
          const showSavings = !isFree && billing === "annual" && plan.annualSavings

          return (
            <Card
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col",
                plan.highlighted
                  ? "border-primary/60 shadow-lg shadow-primary/[0.08] md:scale-[1.03]"
                  : "border-border/50"
              )}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] px-3 py-1 font-semibold shadow-sm">
                  {plan.badge}
                </Badge>
              )}

              <CardHeader className="pb-3">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm font-medium text-primary">{plan.tagline}</p>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-semibold tracking-tight">{displayPrice}</span>
                  <span className="text-xs text-muted-foreground">{displayPeriod}</span>
                </div>
                {showSavings && (
                  <span className="w-fit rounded-full bg-emerald/10 px-2 py-0.5 text-[11px] font-medium text-emerald">
                    {plan.annualSavings}
                  </span>
                )}

                <CardDescription className="pt-1.5 text-sm leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 pb-4">
                <div>
                  {plan.featuresIntro && (
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      {plan.featuresIntro}
                    </p>
                  )}
                  <ul className="space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.batch && (
                  <div className="rounded-lg border border-border/50 bg-muted/25 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                      <Layers className="size-3.5 text-primary" />
                      {plan.batch.title}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {plan.batch.items.map((item) => (
                        <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-start gap-1.5 border-t border-border/40 pt-3">
                  <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{plan.support.title}</p>
                    <p className="text-xs text-muted-foreground">{plan.support.detail}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button
                  className={cn(
                    "w-full",
                    plan.highlighted ? "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20" : ""
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (plan.available) {
                      navigateTo("editor")
                    } else {
                      toast(`${plan.name} is not active yet. Coming soon!`)
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </Section>
  )
}

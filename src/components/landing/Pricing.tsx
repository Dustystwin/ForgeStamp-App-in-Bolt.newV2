import { Check } from "lucide-react"
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

export function Pricing() {
  const { navigateTo } = useNavigation()

  return (
    <Section id="pricing" className="py-12 md:py-16">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Simple Plans for Every Creator
        </h2>
        <p className="mt-3 text-muted-foreground md:text-lg">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-2xl gap-5 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative flex flex-col",
              plan.highlighted
                ? "border-primary/50 shadow-md shadow-primary/[0.06]"
                : "border-border/50"
            )}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5">
                Popular
              </Badge>
            )}
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <ul className="space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-emerald" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-0">
              <Button
                className={cn(
                  "w-full",
                  plan.highlighted
                    ? "bg-primary hover:bg-primary/90 shadow-sm shadow-primary/20"
                    : ""
                )}
                variant={plan.highlighted ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (plan.highlighted) {
                    toast("Pro is not active yet. Coming soon!")
                  } else {
                    navigateTo("editor")
                  }
                }}
              >
                {plan.highlighted ? "Choose Pro" : "Start Free"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </Section>
  )
}

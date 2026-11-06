import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("fs-display text-[1.35rem] font-medium leading-none tracking-tight text-[var(--fs-ink)]", className)}>
      Forge<span className="text-[var(--fs-orange-deep)]">Stamp</span>
    </span>
  )
}

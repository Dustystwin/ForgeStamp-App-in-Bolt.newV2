import { cn } from "@/lib/utils"

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "fs-wordmark fs-display inline-block text-[1.4rem] font-semibold leading-none tracking-[-0.03em]",
        className
      )}
    >
      ForgeStamp
    </span>
  )
}

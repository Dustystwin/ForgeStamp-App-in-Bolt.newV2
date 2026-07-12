import { cn } from "@/lib/utils"

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
}

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-16 px-4 md:py-24 md:px-6", className)}
      {...props}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </section>
  )
}

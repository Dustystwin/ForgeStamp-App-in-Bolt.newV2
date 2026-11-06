const STEPS = [
  {
    title: "Upload",
    description: "Add the image you want to mark. Free can take up to 3 at once.",
  },
  {
    title: "Adjust",
    description: "Set words, a logo, or a QR code, then size, color, and placement. Repeat the mark across the picture if you want.",
  },
  {
    title: "Download",
    description: "Export a PNG, or a ZIP when you mark more than one photo.",
  },
] as const

export function Workflow() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Three steps.
        </h2>
        <div className="fs-mark-divider mt-6" aria-hidden="true" />
        <ol className="mt-8 grid md:mt-10 md:grid-cols-3 md:gap-12">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-[color-mix(in_oklch,var(--fs-amber)_45%,transparent)] py-6 md:border-t-0 md:py-0">
              <h3 className="text-lg font-semibold text-[var(--fs-ink)]">
                <span className="fs-display mr-2 text-2xl font-medium text-[var(--fs-orange-deep)]">{index + 1}</span>
                {step.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed fs-text-soft">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

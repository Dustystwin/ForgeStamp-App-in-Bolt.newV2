const STEPS = [
  {
    title: "Upload",
    description: "Add the image you want to mark.",
  },
  {
    title: "Adjust",
    description: "Set the words, color, size, and placement. Repeat the mark across the picture if you want.",
  },
  {
    title: "Download",
    description: "Export a PNG when it looks right.",
  },
] as const

export function Workflow() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Three steps.
        </h2>
        <ol className="mt-8 grid md:mt-12 md:grid-cols-3 md:gap-12">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-t border-black/10 py-6 md:border-t-0 md:py-0">
              <h3 className="text-lg font-semibold text-[var(--fs-ink)]">
                <span className="mr-2 font-medium fs-text-soft">{index + 1}</span>
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

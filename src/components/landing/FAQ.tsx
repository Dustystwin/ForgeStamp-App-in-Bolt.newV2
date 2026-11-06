const FAQS = [
  {
    q: "Do I need an account to try ForgeStamp?",
    a: "No. You can upload an image and try the editor without signing up. Creating a free account lets you save exported images for 30 days and revisit them later.",
  },
  {
    q: "What image formats does ForgeStamp export?",
    a: "Today, ForgeStamp exports PNG only. JPG and WebP export are listed as coming soon on Spark. They are not available yet.",
  },
  {
    q: "Can I change my plan later?",
    a: "Not yet. Spark and Forge are not for sale. You can use the Free plan today. Switching plans will be possible after billing is added.",
  },
  {
    q: "What's the difference between Single Placement and Full Coverage?",
    a: "Single Placement puts one watermark exactly where you choose. Full Coverage repeats your watermark across the entire image using one of ForgeStamp's patterns, making it harder to crop out.",
  },
] as const

export function FAQ() {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto max-w-3xl">
        <h2 className="fs-display text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Questions
        </h2>

        <dl className="mt-8 divide-y divide-black/10">
          {FAQS.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="text-base font-semibold text-[var(--fs-ink)]">{item.q}</dt>
              <dd className="mt-2 max-w-prose text-sm leading-relaxed fs-text-soft">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

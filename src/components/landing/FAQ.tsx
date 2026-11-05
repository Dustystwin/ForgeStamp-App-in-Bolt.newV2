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
    <section className="fs-surface-cream px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
          Questions, answered.
        </h2>

        <dl className="mt-10 divide-y divide-black/10">
          {FAQS.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="text-base font-semibold text-[var(--fs-ink)]">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--fs-ink)]/65">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

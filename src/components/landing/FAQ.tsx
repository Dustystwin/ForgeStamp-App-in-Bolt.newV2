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
    a: "Single Placement puts one watermark exactly where you choose. Full Coverage repeats it across the image using one of ForgeStamp's patterns, making it harder to crop out. Both work for text, logo, and QR.",
  },
  {
    q: "Can I add my logo or a QR code?",
    a: "Yes. In the editor, switch the watermark to Text, Logo, or QR. Logo uses a PNG, JPG, or WebP you upload. QR turns an http or https link into a code that can be scanned.",
  },
  {
    q: "Can I watermark more than one photo?",
    a: "Free can export up to 3 photos together as a ZIP, using the same text, logo, or QR on each. A Pro account can export up to 25, and an admin can test that higher limit. Spark and Forge are not for sale, and unlimited batches are not available yet.",
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

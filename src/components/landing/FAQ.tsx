const FAQS = [
  {
    q: "Do I need an account to try ForgeStamp?",
    a: "No. You can upload an image and try the editor without signing up. Creating a free account lets you save exported images for 30 days and revisit them later.",
  },
  {
    q: "What happens to a photo I upload?",
    a: "You can try without an account. The photo stays in your browser while you preview it and download a PNG, and ForgeStamp does not store that file. If you are signed in, exporting saves the original and the PNG to My Images for 30 days. You can delete them there sooner.",
  },
  {
    q: "Does a watermark stop someone from copying my photo?",
    a: "A visible watermark helps keep credit on the photo. It is not a guarantee against copying or misuse.",
  },
  {
    q: "What image formats does ForgeStamp export?",
    a: "You can upload a JPG, PNG, or WebP. Today, ForgeStamp exports PNG only. JPG and WebP export are listed as coming soon on Spark. They are not available yet.",
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
    a: "Yes. In the editor, switch the watermark to Text, Logo, or QR. Logo uses a PNG, JPG, or WebP you upload. QR turns an http or https link into a code. Someone who scans it can open a portfolio, shop, or website.",
  },
  {
    q: "Can I watermark more than one photo?",
    a: "Free can export up to 3 photos together as a ZIP, using the same text, logo, or QR on each. A Pro account can export up to 25, and an admin can test that higher limit. Spark and Forge are not for sale, and unlimited batches are not available yet.",
  },
] as const

export function FAQ() {
  return (
    <section className="px-4 py-14 md:px-6 md:py-20">
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

const FAQS = [
  {
    q: "Do I need an account to try ForgeStamp?",
    a: "No. You can upload an image and try the editor without signing up. A free account saves up to 20 exported images for 30 days. Spark keeps up to 100 for 180 days. Forge keeps images until you delete them, within the 500 MB storage limit.",
  },
  {
    q: "What happens to a photo I upload?",
    a: "You can try without an account. The photo stays in your browser while you preview and download it, and ForgeStamp does not store that file. If you are signed in, exporting also saves the original and the watermarked image to My Images. Free keeps up to 20 images for 30 days. Spark keeps up to 100 for 180 days. Forge keeps them until you delete them. Photos you upload can be up to 15 MB, and each account can store 500 MB. If a watermarked file would be too big to store, ForgeStamp keeps a smaller copy of the same picture. You can delete saved images sooner.",
  },
  {
    q: "Does a watermark stop someone from copying my photo?",
    a: "A visible watermark helps keep credit on the photo. It is not a guarantee against copying or misuse.",
  },
  {
    q: "What image formats does ForgeStamp export?",
    a: "You can upload a JPG, PNG, or WebP. Every plan downloads at the photo's original size. Free exports PNG. Spark and Forge can also export JPG and WebP. The format you pick is used for a single download, a ZIP of several photos, and the copy saved to My Images.",
  },
  {
    q: "Can I change my plan later?",
    a: "Not from this page. Spark and Forge are not for sale, and ForgeStamp does not charge a card. A new account is Free. If your account is already Spark or Forge, those features work. An admin can change a plan from the database.",
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
    a: "Yes. The same text, logo, or QR goes on each photo, and more than one downloads as a ZIP. Free can export 3 at a time, Spark 25, and Forge 50. There is no monthly batch allowance. Watermarking runs in your browser, so there is no separate priority queue.",
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

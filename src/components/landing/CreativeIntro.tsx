export function CreativeIntro() {
  return (
    <section className="fs-surface-cream px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
            You made it.
            <br />
            Make your mark.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--fs-ink)]/70">
            Protecting your work shouldn&rsquo;t require design software, a
            tutorial, or a second app. ForgeStamp is the step between
            finishing something and sharing it &mdash; quick enough to use
            every time.
          </p>
        </div>

        {/* Product-specific motif: layered "marks" rather than a stock icon set */}
        <div className="relative flex h-56 items-center justify-center">
          <div className="absolute h-40 w-40 -translate-x-10 rotate-[-8deg] rounded-2xl border-2 border-[var(--fs-aqua)]/40 bg-white" />
          <div className="absolute h-40 w-40 translate-x-8 translate-y-4 rotate-[6deg] rounded-2xl border-2 border-[var(--fs-emerald)]/35 bg-white" />
          <div className="relative flex h-40 w-40 rotate-[-2deg] items-center justify-center rounded-2xl fs-gradient-sunrise shadow-lg shadow-[var(--fs-orange)]/20">
            <span className="rotate-[-18deg] text-sm font-bold tracking-[0.2em] text-white/90">
              YOUR MARK
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

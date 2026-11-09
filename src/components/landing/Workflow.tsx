import { Download } from "lucide-react"
import donut from "@/assets/demos/donut.jpg"
import donutHoneycomb from "@/assets/demos/donut-honeycomb.jpg"

// Steps use a different Unsplash photo than the ridge before/after.
// images.unsplash.com/photo-1551024601-bec78aea704b
// Download repeats Your Text as a honeycomb, not the diagonal pattern.

const PLACEMENT_CELLS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export function Workflow() {
  return (
    <section id="how-it-works" className="fs-step-wash scroll-mt-20 px-4 pt-8 pb-10 md:px-6 md:pt-10 md:pb-12">
      <div className="mx-auto max-w-6xl">
        <h2 className="fs-display text-[1.75rem] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--fs-ink)] md:text-4xl">
          Three steps.
        </h2>

        <ol className="mt-6 grid gap-6 md:mt-7 md:grid-cols-3 md:gap-5">
          <li>
            <figure>
              <div className="flex h-[232px] flex-col bg-[color-mix(in_oklch,var(--fs-amber)_16%,white)] p-3 shadow-[0_16px_28px_-20px_rgba(48,32,16,0.55)] md:h-[248px]">
                <div className="flex min-h-0 flex-1 flex-col rounded-lg border-2 border-dashed border-[color-mix(in_oklch,var(--fs-orange-deep)_50%,white)] bg-white p-2.5">
                  <img
                    src={donut}
                    alt="A stack of sprinkled donuts in the upload tray, before a watermark."
                    width={1400}
                    height={933}
                    className="min-h-0 w-full flex-1 object-cover"
                  />
                  <p className="mt-2 text-center text-xs font-medium text-[var(--fs-ink)]">photo.jpg</p>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--fs-ink)]">
                <span className="fs-display mr-2 text-[1.65rem] font-medium text-[var(--fs-emerald-deep)]">1</span>
                Upload
              </h3>
              <p className="mt-1 max-w-prose text-sm leading-relaxed fs-text-soft">
                Add a JPG, PNG, or WebP. Free can take up to 3 at once.
              </p>
            </figure>
          </li>

          <li>
            <figure>
              <div className="flex h-[232px] flex-col overflow-hidden bg-white shadow-[0_16px_28px_-20px_rgba(48,32,16,0.55)] md:h-[248px]">
                <div className="relative min-h-0 flex-1">
                  <img
                    src={donut}
                    alt="The same donut photograph with Your Text placed in the center. Text is selected; Logo and QR are the other choices."
                    width={1400}
                    height={933}
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold tracking-tight text-white [text-shadow:0_1px_2px_rgba(20,12,6,0.7)]">
                    Your Text
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-black/10 px-2.5 py-2">
                  <div className="flex min-w-0 gap-1" aria-hidden="true">
                    <span className="rounded-md bg-[var(--fs-orange)] px-2 py-1 text-[11px] font-semibold text-[var(--fs-ink)]">
                      Text
                    </span>
                    <span className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--fs-ink)]">Logo</span>
                    <span className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--fs-ink)]">QR</span>
                  </div>
                  <div className="grid shrink-0 grid-cols-3 gap-0.5" aria-hidden="true">
                    {PLACEMENT_CELLS.map((cell) => (
                      <span
                        key={cell}
                        className={
                          cell === 4
                            ? "size-2 bg-[var(--fs-emerald-deep)]"
                            : "size-2 bg-[color-mix(in_oklch,var(--fs-ink)_16%,white)]"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--fs-ink)]">
                <span className="fs-display mr-2 text-[1.65rem] font-medium text-[var(--fs-emerald-deep)]">2</span>
                Adjust
              </h3>
              <p className="mt-1 max-w-prose text-sm leading-relaxed fs-text-soft">
                Set words, a logo, or a QR code, then size, color, and placement. Repeat the mark across the picture if you want.
              </p>
            </figure>
          </li>

          <li>
            <figure>
              <div className="flex h-[232px] flex-col overflow-hidden bg-white shadow-[0_16px_28px_-20px_rgba(48,32,16,0.55)] md:h-[248px]">
                <img
                  src={donutHoneycomb}
                  alt="The same donut photograph with Your Text repeated in a honeycomb, shown as a finished PNG."
                  width={1400}
                  height={933}
                  className="min-h-0 w-full flex-1 object-cover"
                />
                <div className="flex items-center justify-between gap-2 border-t border-black/10 px-2.5 py-2">
                  <span className="truncate text-xs font-medium text-[var(--fs-ink)]">photo.png</span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[var(--fs-orange)] px-2 py-1 text-[11px] font-semibold text-[var(--fs-ink)]">
                    <Download className="size-3" aria-hidden="true" />
                    PNG
                  </span>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-[var(--fs-ink)]">
                <span className="fs-display mr-2 text-[1.65rem] font-medium text-[var(--fs-emerald-deep)]">3</span>
                Download
              </h3>
              <p className="mt-1 max-w-prose text-sm leading-relaxed fs-text-soft">
                Export a PNG, or a ZIP when you mark more than one photo.
              </p>
            </figure>
          </li>
        </ol>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed fs-text-soft md:mt-6">
          A visible watermark helps keep credit on a photo. It is not a guarantee against copying or misuse.
        </p>
      </div>
    </section>
  )
}

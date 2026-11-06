import { Type, Palette, RotateCw, Move } from "lucide-react"
import printableBase from "@/assets/landing/demo/printable-base.png"
import patternSingle from "@/assets/landing/patterns/pattern-single.png"

const CALLOUTS = [
  { icon: Type, label: "Text & fonts", pos: "top-4 left-4 md:-left-6 md:top-8" },
  { icon: Palette, label: "Color & opacity", pos: "top-4 right-4 md:-right-8 md:top-4" },
  { icon: RotateCw, label: "Rotation", pos: "bottom-24 left-2 md:-left-10 md:bottom-28" },
  { icon: Move, label: "Placement", pos: "bottom-4 right-4 md:-right-6 md:bottom-10" },
] as const

export function ProductExperience() {
  return (
    <section
      id="features"
      className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24"
      style={{ background: "linear-gradient(180deg, var(--fs-cream) 0%, color-mix(in oklch, var(--fs-aqua), var(--fs-cream) 82%) 100%)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
            Make it yours.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[var(--fs-ink)]/70 md:text-lg">
            Every detail is adjustable and every change shows up instantly
            &mdash; text, your logo, a QR code, size, color, opacity, rotation,
            placement, and pattern.
          </p>
        </div>

        {/* One dominant visual with contextual callouts, not a repeated card grid */}
        <div className="relative mx-auto mt-14 max-w-md md:mt-16">
          <div className="overflow-hidden rounded-2xl border border-black/5 shadow-[0_25px_60px_-25px_rgba(43,48,58,0.3)]">
            <img
              src={printableBase}
              alt="A printable design before a watermark is applied"
              className="block w-full"
            />
          </div>
          <div className="absolute inset-6 overflow-hidden rounded-xl opacity-0 md:opacity-100">
            <img
              src={patternSingle}
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover"
            />
          </div>

          {CALLOUTS.map(({ icon: Icon, label, pos }) => (
            <div
              key={label}
              className={`absolute hidden items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--fs-ink)] shadow-md md:flex ${pos}`}
            >
              <Icon className="size-3.5 fs-text-orange" />
              {label}
            </div>
          ))}
        </div>

        {/* Mobile: same four controls as a simple inline list instead of floating callouts */}
        <div className="mt-6 flex flex-wrap justify-center gap-2 md:hidden">
          {CALLOUTS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs font-semibold text-[var(--fs-ink)]"
            >
              <Icon className="size-3.5 fs-text-orange" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

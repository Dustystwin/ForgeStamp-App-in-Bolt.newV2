import { FOOTER_LINKS } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-[var(--fs-cream)]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <span className="text-lg font-black tracking-tight fs-gradient-sunrise-text">
              ForgeStamp
            </span>
            <p className="mt-3 text-sm text-[var(--fs-ink)]/60">
              Professional watermarking for creators who care about protecting
              their work.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--fs-ink)]">Product</h4>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[var(--fs-ink)]/60 transition-colors hover:text-[var(--fs-ink)]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--fs-ink)]">Support</h4>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[var(--fs-ink)]/60 transition-colors hover:text-[var(--fs-ink)]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-black/10" />

        <p className="text-center text-sm text-[var(--fs-ink)]/50">
          &copy; 2026 ForgeStamp. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

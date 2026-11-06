import { FOOTER_LINKS } from "@/lib/constants"
import { useNavigation } from "@/App"
import { BrandMark } from "@/components/layout/BrandMark"

export function Footer() {
  const { navigateTo, openLegalPage } = useNavigation()

  const goToProduct = (href: string) => {
    navigateTo("landing")
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" })
    }, 50)
  }

  return (
    <footer className="bg-[var(--fs-cream)]">
      <div className="h-1 fs-gradient-sunrise" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <BrandMark />
            <p className="mt-3 max-w-xs text-sm leading-relaxed fs-text-soft">
              Watermarks for images you want to share.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--fs-ink)]">Product</h4>
            <ul className="mt-3 space-y-2">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-[var(--fs-ink)] hover:underline md:min-h-0"
                    onClick={(event) => {
                      event.preventDefault()
                      goToProduct(link.href)
                    }}
                  >
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
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center text-left text-sm text-[var(--fs-ink)] hover:underline md:min-h-0"
                    onClick={() => openLegalPage(link.page)}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="my-8 h-px bg-black/10" />

        <p className="text-center text-sm fs-text-soft">
          &copy; 2026 ForgeStamp. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

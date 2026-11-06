import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigation } from "@/App"

export const LEGAL_PAGES = {
  privacy: {
    title: "Privacy Policy",
    paragraphs: [
      "This is a draft placeholder. It is not a finished privacy policy, and it is not legal advice.",
      "ForgeStamp does not sell paid plans yet. If you create an account, the app stores the email you sign up with and any images you choose to save, so you can open them again later. Saved images are kept for 30 days.",
      "A real privacy policy will replace this page before ForgeStamp takes any payment.",
    ],
  },
  terms: {
    title: "Terms of Service",
    paragraphs: [
      "This is a draft placeholder. It is not a finished terms of service, and it is not legal advice.",
      "The Free tools are available to try. Spark and Forge are not for sale. Nothing in the app charges a card, and using the free editor does not start a subscription.",
      "Real terms will replace this page before anyone is asked to pay.",
    ],
  },
  contact: {
    title: "Contact",
    paragraphs: [
      "This is a draft placeholder. A contact form and support inbox are not connected to this page yet.",
      "Support times listed on the pricing cards are not active, because Spark and Forge are not for sale.",
      "A real way to reach ForgeStamp will be added here before the app takes payment.",
    ],
  },
  help: {
    title: "Help",
    paragraphs: [
      "This is a draft placeholder. A full help center is not written yet.",
      "What works today: add a text, logo, or QR watermark, place it, use a pattern, watch the live preview, and export a PNG. Free exports one photo at a time. A Pro account can export up to 25 photos at once as a ZIP, with the same watermark on each. Pro is turned on by an admin for testing. You can try the editor without an account. A free account can save exports for 30 days.",
      "What is not available yet: unlimited batches, a monthly batch allowance, JPG or WebP export, and saved presets. Spark and Forge cannot be purchased.",
    ],
  },
} as const

export type LegalPageId = keyof typeof LEGAL_PAGES

export function LegalPage({ page }: { page: LegalPageId }) {
  const { navigateTo } = useNavigation()
  const content = LEGAL_PAGES[page]

  return (
    <section className="fs-surface-cream px-4 py-16 md:px-6 md:py-20">
      <div className="mx-auto max-w-3xl">
        <Button
          variant="ghost"
          className="mb-6 -ml-2 text-[var(--fs-ink)]/70 hover:text-[var(--fs-ink)]"
          onClick={() => navigateTo("landing")}
        >
          <ArrowLeft className="size-4" />
          Back to ForgeStamp
        </Button>

        <p className="text-xs font-semibold uppercase tracking-wide fs-text-orange">
          Draft placeholder
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--fs-ink)] md:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 rounded-lg border border-[var(--fs-orange)]/25 bg-white px-4 py-3 text-sm leading-relaxed text-[var(--fs-ink)]/75">
          Not a final legal document. Do not rely on this page as ForgeStamp&rsquo;s official policy.
        </p>

        <div className="mt-8 space-y-4">
          {content.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-[var(--fs-ink)]/75 md:text-base">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

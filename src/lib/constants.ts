import {
  Upload,
  Paintbrush,
  Download,
  Check,
} from "lucide-react"

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
] as const

export const WORKFLOW_STEPS = [
  {
    number: 1,
    title: "Choose Your Image",
    description:
      "Upload the image you want to protect and begin in seconds.",
    icon: Upload,
  },
  {
    number: 2,
    title: "Shape Your Watermark",
    description:
      "Customize text, a logo, or a QR code — plus size, opacity, placement, spacing, color, and rotation — until it looks exactly how you want.",
    icon: Paintbrush,
  },
  {
    number: 3,
    title: "Preview, Export & Save",
    description:
      "Preview your final image before exporting a clean professional watermarked copy.",
    icon: Download,
  },
] as const

// PRICING PLANS — preview only
// ---------------------------------------------------------------------------
// Free is the only plan someone can buy today. Spark and Forge stay unavailable.
// Prices on those cards are planned prices, not something the app charges.
// There is no checkout. A Pro account, which an admin can turn on for testing,
// can export a batch of 25 photos. Free can export 3. Unlimited batch is not built.
export const PRICING_PLANS = [
  {
    name: "Free",
    tagline: "Use it today",
    badge: null as string | null,
    description: "Enough to place text, a logo, or a QR code, and download a PNG.",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualSavings: null as string | null,
    featuresIntro: null as string | null,
    features: [
      "Text watermarking",
      "Logo watermark",
      "QR code watermark",
      "Standard fonts",
      "Standard colors",
      "All watermark placements",
      "All watermark patterns",
      "Opacity, size, and rotation",
      "PNG export",
      "Live watermark preview",
    ],
    batch: {
      title: "Batch processing",
      items: [
        "Up to 3 photos in one export",
        "Monthly batch allowance (coming soon)",
      ],
    } as { title: string; items: string[] } | null,
    cta: "Try a watermark",
    available: true,
    highlighted: false,
  },
  {
    name: "Spark",
    tagline: "For regular use",
    badge: "Recommended" as string | null,
    description: "A look at the planned extras. The price is a preview, and Spark is not for sale.",
    monthlyPrice: "$8.99",
    annualPrice: "$69.99",
    annualSavings: "Save 35%" as string | null,
    featuresIntro: "Everything in Free, plus:" as string | null,
    features: [
      "Premium font library",
      "Premium color library",
      "High-resolution exports (coming soon)",
      "JPG export (coming soon)",
      "WebP export (coming soon)",
      "Save watermark presets (coming soon)",
      "Expanded export history (coming soon)",
    ],
    batch: {
      title: "Batch processing",
      items: [
        "Up to 25 photos in one export",
        "Monthly batch allowance (coming soon)",
      ],
    } as { title: string; items: string[] } | null,
    cta: "Coming soon",
    available: false,
    highlighted: true,
  },
  {
    name: "Forge",
    tagline: "For everyday work",
    badge: null as string | null,
    description: "A look at the fuller toolkit. The price is a preview, and Forge is not for sale.",
    monthlyPrice: "$14.99",
    annualPrice: "$119.99",
    annualSavings: "Save 33%" as string | null,
    featuresIntro: "Everything in Spark, plus:" as string | null,
    features: [
      "Unlimited watermark presets (coming soon)",
      "Unlimited export history (coming soon)",
      "Unlimited batch processing (coming soon)",
      "Priority processing (coming soon)",
      "Early access to new features",
    ],
    batch: null as { title: string; items: string[] } | null,
    cta: "Coming soon",
    available: false,
    highlighted: false,
  },
] as const

export const FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
  ],
  support: [
    { label: "Contact", page: "contact" },
    { label: "Help Center", page: "help" },
    { label: "Privacy Policy", page: "privacy" },
    { label: "Terms of Service", page: "terms" },
  ],
} as const

export { Check }

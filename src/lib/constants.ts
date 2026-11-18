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

// Prices on Spark and Forge are a preview. Nothing on this page charges a card.
// The features are real for an account that is already on that plan.
// Free exports a PNG at the photo's original size. Spark and Forge can also
// export JPG or WebP and fit the long edge to 2048, 1600, or 1080.
// There is no processing queue and no monthly batch counter.
export const PRICING_PLANS = [
  {
    name: "Free",
    tagline: "Use it today",
    badge: null as string | null,
    description: "Place text, a logo, or a QR code. Outline it, add a date, crop, and download a PNG at the original size.",
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
      "Text outline",
      "Copyright mark and date stamp",
      "Crop and rotate before export",
      "Starter looks",
      "Up to 2 layers on a photo",
      "Emoji marks",
      "Eyedropper color pick",
      "Black and white photo filter",
      "Auto contrast so a mark stays readable",
      "Handle stamp",
      "Watermark strength meter and before/after compare",
      "Install on your phone, with a short welcome",
      "PNG export at the original photo size",
      "Live watermark preview",
      "Brand kit preview (saving a kit is on Spark)",
      "Saved images kept 30 days (up to 20)",
    ],
    batch: {
      title: "Batch processing",
      items: [
        "Up to 3 photos in one export",
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
    description: "These extras work on a Spark account. Spark is not for sale on this page.",
    monthlyPrice: "$8.99",
    annualPrice: "$69.99",
    annualSavings: "Save 35%" as string | null,
    featuresIntro: "Everything in Free, plus:" as string | null,
    features: [
      "Premium font library",
      "Premium color library",
      "JPG export",
      "WebP export",
      "JPG and WebP quality control",
      "Export long edge at 2048, 1600, or 1080",
      "Drop shadow",
      "Signature watermark",
      "Sticker pack",
      "Gradient text",
      "Up to 5 layers on a photo",
      "Platform icon next to a handle",
      "Social size ZIP (Instagram, Story, Pinterest, Etsy, Facebook)",
      "1 brand kit (logo, fonts, colors, handle)",
      "10 saved watermark presets",
      "Saved images kept 180 days (up to 100)",
    ],
    batch: {
      title: "Batch processing",
      items: [
        "Up to 25 photos in one export",
      ],
    } as { title: string; items: string[] } | null,
    cta: "Not for sale",
    available: false,
    highlighted: true,
  },
  {
    name: "Forge",
    tagline: "For everyday work",
    badge: null as string | null,
    description: "These extras work on a Forge account. Forge is not for sale on this page.",
    monthlyPrice: "$14.99",
    annualPrice: "$119.99",
    annualSavings: "Save 33%" as string | null,
    featuresIntro: "Everything in Spark, plus:" as string | null,
    features: [
      "Up to 5 brand kits",
      "Up to 10 layers on a photo",
      "Up to 200 saved watermark presets",
      "Saved images stay until you delete them (500 MB storage limit)",
    ],
    batch: {
      title: "Batch processing",
      items: [
        "Up to 50 photos in one export",
      ],
    } as { title: string; items: string[] } | null,
    cta: "Not for sale",
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

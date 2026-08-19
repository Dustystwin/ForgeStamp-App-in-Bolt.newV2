import {
  Upload,
  Paintbrush,
  Download,
  Type,
  Palette,
  SlidersHorizontal,
  RotateCw,
  LayoutGrid,
  Eye,
  Smartphone,
  Move,
  BookOpen,
  Zap,
  Award,
  Shield,
  Sparkles,
  Users,
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
      "Customize text, font, size, opacity, placement, spacing, color, and rotation until it looks exactly how you want.",
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

export const FEATURES = [
  {
    title: "Text Watermarks",
    description: "Add custom text overlays with full typographic control.",
    icon: Type,
  },
  {
    title: "Font Selection",
    description: "Choose from a curated set of professional display and body fonts.",
    icon: BookOpen,
  },
  {
    title: "Color Selection",
    description: "Pick any color for your watermark text with a visual color picker.",
    icon: Palette,
  },
  {
    title: "Opacity Controls",
    description: "Fine-tune transparency to balance visibility and subtlety.",
    icon: SlidersHorizontal,
  },
  {
    title: "Rotation Controls",
    description: "Angle your watermark for diagonal or custom orientations.",
    icon: RotateCw,
  },
  {
    title: "Watermark Placement",
    description: "Position your watermark exactly where you want it on the image.",
    icon: Move,
  },
  {
    title: "Full Image Tiling",
    description: "Repeat your watermark across the entire image for maximum protection.",
    icon: LayoutGrid,
  },
  {
    title: "Live Preview",
    description: "See changes instantly as you adjust every watermark setting.",
    icon: Eye,
  },
  {
    title: "PNG Export",
    description: "Download your watermarked image as a high-quality PNG file.",
    icon: Download,
  },
  {
    title: "Mobile Friendly Workflow",
    description: "Works beautifully on phones and tablets, not just desktops.",
    icon: Smartphone,
  },
] as const

export const WHY_REASONS = [
  {
    title: "Easy to Learn",
    description: "No tutorials needed. The interface is intuitive from the first click.",
    icon: Sparkles,
  },
  {
    title: "Fast Workflow",
    description: "Go from upload to protected image in under a minute.",
    icon: Zap,
  },
  {
    title: "Professional Results",
    description: "Output that looks polished and intentional, never amateur.",
    icon: Award,
  },
  {
    title: "Protect Your Creative Work",
    description: "Discourage unauthorized use of your creative images.",
    icon: Shield,
  },
  {
    title: "Clean Modern Interface",
    description: "A focused workspace free of clutter and distractions.",
    icon: Eye,
  },
  {
    title: "Built For Creators",
    description: "Designed by creatives, for photographers, designers, and artists.",
    icon: Users,
  },
] as const

// PRICING PLANS — Version 1 (finalized)
// ---------------------------------------------------------------------------
// Billing logic lives in Pricing.tsx: Free always shows $0; Spark and Forge
// switch between monthlyPrice/annualPrice based on the billing toggle.
// Buttons are presentation-only — no checkout/payment logic is wired yet.
// Spark and Forge show a "coming soon" message until billing exists.
export const PRICING_PLANS = [
  {
    name: "Free",
    tagline: "Protect Your First Creation",
    badge: null as string | null,
    description:
      "Everyone starts somewhere. Explore ForgeStamp with the essential watermarking tools and confidently protect your first creations. Perfect for learning the app and creating professional watermarks at no cost.",
    monthlyPrice: "$0",
    annualPrice: "$0",
    annualSavings: null as string | null,
    featuresIntro: null as string | null,
    features: [
      "Text watermarking",
      "Logo watermarking",
      "Standard font library",
      "Standard color palette",
      "All watermark placement options",
      "All watermark patterns",
      "PNG export",
      "Live watermark preview",
      "Standard export quality",
    ],
    batch: {
      title: "Limited Batch Processing",
      items: ["Up to 3 images per batch", "Up to 30 batch-processed images per month"],
    } as { title: string; items: string[] } | null,
    support: {
      title: "Email Support",
      detail: "Typically within 3 business days",
    },
    cta: "Start Free",
    available: true,
    highlighted: false,
  },
  {
    name: "Spark",
    tagline: "Turn Creativity Into Momentum",
    badge: "⭐ Creator Favorite" as string | null,
    description:
      "Every great creation begins with a spark. Unlock premium tools, expanded creative options, and higher usage limits designed to help your creativity and business grow.",
    monthlyPrice: "$8.99",
    annualPrice: "$69.99",
    annualSavings: "Save 35%" as string | null,
    featuresIntro: "Everything in Free, plus:" as string | null,
    features: [
      "Premium font library",
      "Premium color library",
      "High-resolution exports",
      "JPG export",
      "WebP export",
      "Save watermark presets",
      "Expanded export history",
      "Faster export processing",
    ],
    batch: {
      title: "Expanded Batch Processing",
      items: ["Up to 25 images per batch", "Up to 500 batch-processed images per month"],
    } as { title: string; items: string[] } | null,
    support: {
      title: "Priority Email Support",
      detail: "Typically within 2 business days",
    },
    cta: "Upgrade to Spark",
    available: false,
    highlighted: true,
  },
  {
    name: "Forge",
    tagline: "Build Without Limits",
    badge: null as string | null,
    description:
      "The forge is where ideas become finished masterpieces. Forge unlocks the complete professional toolkit for creators and businesses that depend on watermarking every day.",
    monthlyPrice: "$14.99",
    annualPrice: "$119.99",
    annualSavings: "Save 33%" as string | null,
    featuresIntro: "Everything in Spark, plus:" as string | null,
    features: [
      "Unlimited exports",
      "Unlimited watermark presets",
      "Unlimited export history",
      "Unlimited batch processing",
      "Priority processing",
      "Early access to new features",
    ],
    batch: null as { title: string; items: string[] } | null,
    support: {
      title: "Premium Priority Email Support",
      detail: "Typically within 1 business day",
    },
    cta: "Upgrade to Forge",
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
    { label: "Contact", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
} as const

export { Check }

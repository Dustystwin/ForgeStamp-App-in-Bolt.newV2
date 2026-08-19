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

export const PRICING_PLANS = [
  {
    name: "Free",
    description: "Great for trying things out",
    features: [
      "Limited daily image exports",
      "Basic font selection",
      "Standard image export",
      "ForgeStamp branding on exports",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious creators",
    features: [
      "More image exports",
      "Premium font collection",
      "Full customization controls",
      "High-resolution export",
      "No ForgeStamp branding",
    ],
    highlighted: true,
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

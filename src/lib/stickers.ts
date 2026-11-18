export interface StickerDef {
  id: string
  label: string
  svg: string
}

function svg(body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${body}</svg>`
}

/** Original simple marks drawn for ForgeStamp. Not copied from another app. */
export const STICKERS: StickerDef[] = [
  {
    id: "heart",
    label: "Heart",
    svg: svg(`<path fill="#E24B4B" d="M32 54s-18-11.2-24-20C4 26 8 16 18 16c6 0 9.2 3.4 14 9 4.8-5.6 8-9 14-9 10 0 14 10 10 18-6 8.8-24 20-24 20z"/>`),
  },
  {
    id: "star",
    label: "Star",
    svg: svg(`<path fill="#F2B84B" d="M32 6l6.8 16.2L56 24.4l-12.6 10.6L46.8 54 32 45.2 17.2 54l3.4-19L8 24.4l17.2-2.2z"/>`),
  },
  {
    id: "sparkles",
    label: "Sparkles",
    svg: svg(`<path fill="#F2B84B" d="M32 8l3 10 10 3-10 3-3 10-3-10-10-3 10-3z"/><path fill="#FFE08A" d="M14 36l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM48 34l1.6 4.4L54 40l-4.4 1.6L48 46l-1.6-4.4L42 40l4.4-1.6z"/>`),
  },
  {
    id: "camera",
    label: "Camera",
    svg: svg(`<rect x="8" y="18" width="48" height="32" rx="6" fill="#3D4A45"/><circle cx="32" cy="34" r="10" fill="#F4EFE6"/><circle cx="32" cy="34" r="6" fill="#2A3330"/><rect x="24" y="12" width="16" height="8" rx="2" fill="#3D4A45"/>`),
  },
  {
    id: "flower",
    label: "Flower",
    svg: svg(`<g fill="#E7A0B0"><circle cx="32" cy="16" r="8"/><circle cx="46" cy="28" r="8"/><circle cx="40" cy="44" r="8"/><circle cx="24" cy="44" r="8"/><circle cx="18" cy="28" r="8"/></g><circle cx="32" cy="32" r="7" fill="#F2B84B"/>`),
  },
  {
    id: "leaf",
    label: "Autumn leaf",
    svg: svg(`<path fill="#D4722B" d="M32 8c14 8 22 20 20 34-10 2-22-2-28-8 2-10 2-18 8-26z"/><path stroke="#8A4B1F" stroke-width="2" fill="none" d="M30 18c2 8 2 16 0 28"/>`),
  },
  {
    id: "tree",
    label: "Holiday tree",
    svg: svg(`<path fill="#2F6B4F" d="M32 8l14 16H38l10 12H36l8 12H20l8-12H16l10-12h-8z"/><rect x="28" y="48" width="8" height="8" fill="#8A5A32"/><circle cx="32" cy="26" r="2" fill="#F2B84B"/><circle cx="26" cy="36" r="2" fill="#E24B4B"/><circle cx="38" cy="40" r="2" fill="#F4EFE6"/>`),
  },
]

const urls = new Map<string, string>()

export function stickerUrl(id: string): string | null {
  const sticker = STICKERS.find((item) => item.id === id) ?? STICKERS[0]
  if (!sticker) return null
  const cached = urls.get(sticker.id)
  if (cached) return cached
  const url = URL.createObjectURL(new Blob([sticker.svg], { type: "image/svg+xml" }))
  urls.set(sticker.id, url)
  return url
}

export const EMOJI_CHOICES = [
  "📷", "✨", "❤️", "⭐", "🌸", "🍂", "🎄", "☀️",
  "🌙", "🔥", "💧", "🍀", "🎨", "📸", "🏷️", "✔️",
  "💛", "💜", "💙", "🖤", "🌈", "⚡", "🎉", "🎁",
]

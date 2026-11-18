const FAVORITES = "forgestamp-font-favorites"
const RECENT = "forgestamp-font-recent"

function readList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []
  } catch {
    return []
  }
}

function writeList(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values.slice(0, 24)))
  } catch {
    // Private browsing can block storage.
  }
}

export function favoriteFonts(): string[] {
  return readList(FAVORITES)
}

export function recentFonts(): string[] {
  return readList(RECENT)
}

export function toggleFavoriteFont(family: string): string[] {
  const current = favoriteFonts()
  const next = current.includes(family) ? current.filter((item) => item !== family) : [family, ...current]
  writeList(FAVORITES, next)
  return next
}

export function rememberFont(family: string): string[] {
  const next = [family, ...recentFonts().filter((item) => item !== family)]
  writeList(RECENT, next)
  return next
}

/* App shell only. Photos, downloads, and account files are never stored here. */
const SHELL = "forgestamp-shell-v1"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll(["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"])),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== SHELL).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

function isShell(url, request) {
  if (url.origin !== self.location.origin) return false
  if (request.method !== "GET") return false
  const path = url.pathname
  if (/\.(png|jpe?g|webp|gif|avif|heic|mp4|zip)$/i.test(path) && !path.startsWith("/icon-")) return false
  if (path.startsWith("/storage")) return false
  return request.mode === "navigate" || path === "/" || path.endsWith(".js") || path.endsWith(".css") || path.endsWith(".webmanifest") || path.startsWith("/icon-")
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  if (!isShell(url, event.request)) return
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && url.pathname !== "/") {
          const copy = response.clone()
          caches.open(SHELL).then((cache) => cache.put(event.request, copy))
        }
        return response
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match("/"))),
  )
})

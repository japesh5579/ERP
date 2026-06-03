/* Gagan Transmissions ERP — Service Worker */
const CACHE = "gt-erp-v1"

/* Assets to pre-cache on install */
const PRECACHE = ["/offline"]

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const { request } = e
  const url = new URL(request.url)

  /* Never intercept API calls — always need fresh data */
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return

  /* Navigation requests: network-first, offline page as fallback */
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() =>
        caches.match("/offline").then((r) => r || new Response("Offline", { status: 503 }))
      )
    )
    return
  }

  /* Static assets: stale-while-revalidate */
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(request).then((cached) => {
        const fresh = fetch(request).then((res) => {
          if (res.ok) cache.put(request, res.clone())
          return res
        })
        return cached || fresh
      })
    )
  )
})

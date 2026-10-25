/*
 * Ṣọ́ra service worker.
 * - App shell and static assets are cached so the app opens with no connection.
 * - /api/* is never cached: checked messages must not be stored on the device.
 * - Tesseract.js files from the CDN are cached after first use, so screenshot OCR also works offline.
 */
const VERSION = "sora-v1";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === "opaque") (await caches.open(VERSION)).put(request, res.clone());
  return res;
}

async function networkFirstPage(request) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(VERSION)).put("/", res.clone());
    return res;
  } catch {
    // Share-target URLs carry the message in the query string; serve the cached shell for any page.
    return (await caches.match("/")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/api/")) return; // never cache user messages or verdicts
    if (request.mode === "navigate") return event.respondWith(networkFirstPage(request));
    if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
      return event.respondWith(cacheFirst(request));
    }
    return;
  }

  // Fonts and the on-device OCR engine.
  if (url.hostname === "cdn.jsdelivr.net" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request));
  }
});

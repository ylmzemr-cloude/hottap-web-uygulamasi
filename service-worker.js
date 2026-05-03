const CACHE_NAME = 'bymey-hottap-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/app.html',
  '/css/main.css',
  '/css/print.css',
  '/js/ui.js',
  '/js/auth.js',
  '/js/calculator.js',
  '/js/formulas.js',
  '/js/units.js',
  '/js/validation.js',
  '/js/tables.js',
  '/js/supabase.js',
  '/js/pdf.js',
  '/js/offline.js',
  '/data/help-texts.json',
];

// ─── Yükleme: uygulama dosyalarını cache'e al ────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Aktivasyon: eski cache versiyonlarını temizle ────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch: Supabase & CDN → network-first; uygulama → cache-first ────────────

self.addEventListener('fetch', event => {
  // Sadece GET isteklerini yönet
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isExternal =
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudflare') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic');

  if (isExternal) {
    // Network-first: önce ağdan dene, başarısız olursa cache'den döndür
    event.respondWith(
      fetch(event.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first: önce cache'e bak, yoksa ağdan al ve cache'e ekle
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(res => {
          if (res.ok) {
            caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
          }
          return res;
        });
      })
    );
  }
});

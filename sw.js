/* Princess Room X: the whole app is cached so it opens with no connection.
   There is no server here - the figures live in the browser's own storage. */
const CACHE = 'princess-room-x-v6';
const SHELL = ['./', './index.html', './manifest.json', './icon.png',
               'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(SHELL.map(u => c.add(u))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // covers come from TikTok and expire: never serve those from the cache
  if (url.hostname.endsWith('tiktok.com') || url.hostname.includes('tiktokcdn')) return;

  // The page itself comes from the network when there is one, so an improvement
  // is there the next time the app is opened; the cached copy is what keeps it
  // working on a train with no signal.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(hit => hit || caches.match('./'))));
    return;
  }

  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
    return r;
  })));
});

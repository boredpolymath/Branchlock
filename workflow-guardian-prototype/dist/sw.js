const CACHE = 'branchlock-v6';
const MIGRATED_CACHE = 'branchlock-v5';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './latch-lock.svg', './favicon-16.png', './favicon-32.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => caches.keys()).then(keys => keys.includes(MIGRATED_CACHE) ? self.skipWaiting() : undefined)));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('branchlock-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('message', event => {if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

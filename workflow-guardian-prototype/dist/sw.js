const CACHE = 'branchlock-v2';
const ASSETS = ['./', './index.html', './styles.css', './app.js', './manifest.webmanifest', './latch-lock.svg', './favicon-16.png', './favicon-32.png', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))));

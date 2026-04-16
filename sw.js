const CACHE_VERSION = 'mmc-frota-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(STATIC_ASSETS).catch(()=>{})));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x=>x!==CACHE_VERSION).map(x=>caches.delete(x)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (u.hostname.includes('script.google.com')||u.hostname.includes('googleusercontent.com')) return;
  if (e.request.mode==='navigate') { e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html'))); return; }
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => { if(r&&r.status===200){const rc=r.clone();caches.open(CACHE_VERSION).then(ca=>ca.put(e.request,rc))} return r; }).catch(()=>caches.match('/index.html'))));
});

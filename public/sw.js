// CreatorKit Studio Service Worker
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// Pass-through fetch without caching to prevent stale script/Vite issues
self.addEventListener('fetch', () => {
  // Pass directly through to network
  return;
});

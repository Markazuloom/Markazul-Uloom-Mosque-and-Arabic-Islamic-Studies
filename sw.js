// Bump this whenever the cached app shell (below) needs to change, so
// activate() below drops the old cache and everyone picks up the new one.
const CACHE_VERSION = 'v15';
const CACHE_NAME = `markaz-uloom-${CACHE_VERSION}`;

const APP_SHELL = [
    '/',
    '/index.html',
    '/css/styles.min.css?v=15',
    '/js/script.min.js?v=15',
    '/manifest.json',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/optimized/logo.webp',
    '/images/logo.jpg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(
                names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

// Cache-first for the site's own static files only. Prayer times come from
// a cross-origin API (Aladhan) and must always go to the network live -
// caching them could show a visitor yesterday's prayer times while offline.
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(request).then((response) => {
                if (response.ok) {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, responseCopy));
                }
                return response;
            });
        }).catch(() => caches.match('/index.html'))
    );
});

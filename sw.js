// Bump this whenever the cached app shell (below) needs to change, so
// activate() below drops the old cache and everyone picks up the new one.
const CACHE_VERSION = 'v56';
const CACHE_NAME = `markaz-uloom-${CACHE_VERSION}`;

const APP_SHELL = [
    '/',
    '/index.html',
    '/css/styles.min.css?v=56',
    '/js/script.min.js?v=56',
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

    // Videos are big and are fetched in byte ranges (needed for seeking, and Safari
    // refuses to play from a cache that ignores them): never cache them, let the browser fetch.
    if (request.destination === 'video' || request.destination === 'audio' || request.headers.has('range')) {
        return;
    }

    // The page itself (the HTML) is fetched from the network first, so a new version of the
    // site shows up at once and never points at files that no longer exist. The saved copy is
    // only used when the visitor is offline or the connection takes more than 3.5 seconds.
    if (request.mode === 'navigate' || request.destination === 'document') {
        event.respondWith(pageResponse(request));
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

function pageResponse(request) {
    const network = fetch(request).then((response) => {
        if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
        }
        return response;
    });
    const saved = caches.match('/index.html');
    const patient = new Promise((resolve) => setTimeout(resolve, 3500))
        .then(() => saved)
        .then((cached) => cached || network);
    return Promise.race([network, patient])
        .catch(() => saved.then((cached) => cached || Response.error()));
}

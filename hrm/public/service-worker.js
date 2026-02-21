// hrm/public/service-worker.js
// Service Worker for PWA offline support and caching

// Dynamically generate cache name based on current date (changes daily or on reload)
// Mismatched cache names will force cache clearing on activate.
const CACHE_NAME = 'hrm-v' + new Date().getTime();

// Define minimal URLs for offline fallback, don't proactively cache 'main.js' since Webpack hashes them
const urlsToCache = [
    '/',
    '/manifest.json',
];

// Install event - cache minimal static assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event - clean up ALL old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // Take control of all open pages
});

// Fetch event - NETWORK FIRST approach for everything (Fixes the cache issue)
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // If network response is good, clone it and cache it, then return it
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Network failed (offline), try the cache
                console.log('Network failed, falling back to cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});

// Listen for message to skip waiting (force update)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Implement your data sync logic here
    console.log('Syncing data in background');
}

// Push event - show notification
self.addEventListener('push', (event) => {
    let data = { title: 'New Notification', body: 'You have a new update.' };
    try {
        data = event.data.json();
    } catch (e) {
        console.warn('Push data is not JSON:', event.data.text());
        data = { title: 'New Notification', body: event.data.text() };
    }

    const options = {
        body: data.body,
        icon: '/hrm-logo.png', // matches public folder
        badge: '/favicon.svg',
        data: data.data || {},
        vibrate: [100, 50, 100],
        actions: [
            { action: 'open', title: 'Open App' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // If a window is already open, focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

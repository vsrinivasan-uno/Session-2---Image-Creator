// Service Worker for AI-CCORE Performance Optimization
// Version 1.0 - Vercel Compatible

const CACHE_NAME = 'ai-ccore-v1.0';
const STATIC_CACHE_NAME = 'ai-ccore-static-v1.0';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/critical.css',
    '/logo.png',
    '/favicon.svg'
];

// Static resources to cache on first access
const STATIC_RESOURCES = [
    '/styles.css',
    '/script.js',
    '/database.js',
    '/ai-ccore-owl-logo.png',
    '/building-background.jpg'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache critical resources
            caches.open(CACHE_NAME).then((cache) => {
                console.log('Service Worker: Caching critical resources');
                return cache.addAll(CRITICAL_RESOURCES);
            }),
            // Cache static resources
            caches.open(STATIC_CACHE_NAME).then((cache) => {
                console.log('Service Worker: Caching static resources');
                return cache.addAll(STATIC_RESOURCES.concat(EXTERNAL_RESOURCES));
            })
        ]).then(() => {
            console.log('Service Worker: Installation complete');
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and non-http(s) requests
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    // Skip API requests (for Vercel compatibility)
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached version if available
            if (cachedResponse) {
                console.log('Service Worker: Serving from cache:', event.request.url);
                return cachedResponse;
            }

            // Otherwise fetch from network
            console.log('Service Worker: Fetching from network:', event.request.url);
            return fetch(event.request).then((response) => {
                // Don't cache if not a successful response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone the response (can only be consumed once)
                const responseToCache = response.clone();

                // Cache successful responses
                caches.open(STATIC_CACHE_NAME).then((cache) => {
                    if (shouldCache(event.request.url)) {
                        console.log('Service Worker: Caching new resource:', event.request.url);
                        cache.put(event.request, responseToCache);
                    }
                });

                return response;
            }).catch(() => {
                // Return offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

// Helper function to determine if a resource should be cached
function shouldCache(url) {
    // Cache images, CSS, JS, and fonts
    return /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot)(\?.*)?$/.test(url) ||
           url.includes('fonts.googleapis.com') ||
           url.includes('cdnjs.cloudflare.com');
}

// Message event for manual cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_UPDATE') {
        // Force cache update
        caches.delete(CACHE_NAME);
        caches.delete(STATIC_CACHE_NAME);
        console.log('Service Worker: Cache cleared for update');
    }
}); 
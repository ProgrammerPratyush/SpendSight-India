self.addEventListener("install", (event) => {
    console.log("[ServiceWorker] Installed");

    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[ServiceWorker] Activated");

    event.waitUntil(self.clients.claim());
});
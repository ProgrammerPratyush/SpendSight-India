export async function registerServiceWorker() {
    // Only available in browsers
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator)) {
        console.info("[PWA] Service Workers are not supported.");
        return;
    }

    try {
        const registration = await navigator.serviceWorker.register("/service-worker.js");

        console.info("[PWA] Service Worker registered.", registration.scope);
    } catch (error) {
        console.error("[PWA] Service Worker registration failed.", error);
    }
}
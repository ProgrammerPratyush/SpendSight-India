import { registerServiceWorker } from "./serviceWorker";

export async function initializePWA() {
    await registerServiceWorker();
}
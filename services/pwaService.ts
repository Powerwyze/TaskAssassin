/**
 * PWA Service for handling Push Notifications and Badging
 */

// VAPID public key - In production, fetch this from your backend
// For now, you can generate one at: https://vapidkeys.com/
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

/**
 * Request notification permission and subscribe to push notifications
 */
export const setupPushNotifications = async (): Promise<PushSubscription | null> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications not supported");
        return null;
    }

    try {
        // Wait for service worker to be ready
        const reg = await navigator.serviceWorker.ready;

        // Request permission
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
            console.log("Notification permission denied");
            return null;
        }

        console.log("Notification permission granted");

        // If no VAPID key is set, just return null (permission is granted though)
        if (!VAPID_PUBLIC_KEY) {
            console.warn("No VAPID public key configured. Set VITE_VAPID_PUBLIC_KEY in .env.local");
            return null;
        }

        // Subscribe to push notifications
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
        });

        console.log("Push subscription created:", subscription);
        return subscription;

    } catch (error) {
        console.error("Error setting up push notifications:", error);
        return null;
    }
};

/**
 * Get the current push subscription
 */
export const getPushSubscription = async (): Promise<PushSubscription | null> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return null;
    }

    try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.getSubscription();
        return subscription;
    } catch (error) {
        console.error("Error getting push subscription:", error);
        return null;
    }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribePushNotifications = async (): Promise<boolean> => {
    try {
        const subscription = await getPushSubscription();
        if (subscription) {
            await subscription.unsubscribe();
            console.log("Unsubscribed from push notifications");
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error unsubscribing:", error);
        return false;
    }
};

/**
 * Set app badge count (Android primarily)
 */
export const setAppBadge = async (count: number): Promise<void> => {
    if ('setAppBadge' in navigator) {
        try {
            if (count > 0) {
                await (navigator as any).setAppBadge(count);
            } else {
                await (navigator as any).clearAppBadge();
            }
        } catch (error) {
            console.error('Failed to set app badge:', error);
        }
    }
};

/**
 * Clear app badge
 */
export const clearAppBadge = async (): Promise<void> => {
    if ('clearAppBadge' in navigator) {
        try {
            await (navigator as any).clearAppBadge();
        } catch (error) {
            console.error('Failed to clear app badge:', error);
        }
    }
};

/**
 * Show a local notification (doesn't require push subscription)
 */
export const showLocalNotification = async (title: string, options?: NotificationOptions): Promise<void> => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        console.log("Notifications not supported");
        return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        return;
    }

    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            ...options
        });
    } catch (error) {
        console.error("Error showing notification:", error);
    }
};

/**
 * Check if notifications are supported and permission is granted
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        return false;
    }
    return Notification.permission === "granted";
};

/**
 * Helper function to convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

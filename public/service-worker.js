// service-worker.js
self.addEventListener("install", (event) => {
    console.log("Service worker installing...");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service worker activated");
});

self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "TaskAssassin Update";
    const options = {
        body: data.body || "You have a new notification.",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: data.url || "/"
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data || "/";
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

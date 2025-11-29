import {
    ref,
    push,
    set,
    remove,
    onValue,
    update,
    serverTimestamp
} from 'firebase/database';
import { database } from './firebaseConfig';
import { Notification } from '../types';

/**
 * Send a notification to a user
 */
export const sendNotification = async (
    toUid: string,
    type: Notification['type'],
    title: string,
    message: string,
    actionUrl?: string
): Promise<void> => {
    const notificationRef = push(ref(database, `notifications/${toUid}`));

    const notificationData = {
        id: notificationRef.key,
        type,
        title,
        message,
        timestamp: serverTimestamp(),
        read: false,
        actionUrl: actionUrl || null
    };

    await set(notificationRef, notificationData);
};

/**
 * Subscribe to a user's notifications
 */
export const subscribeNotifications = (
    uid: string,
    callback: (notifications: Notification[]) => void
): (() => void) => {
    const notificationsRef = ref(database, `notifications/${uid}`);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
        const notifications: Notification[] = [];
        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                notifications.push(child.val());
            });
        }
        // Sort by timestamp descending (newest first)
        notifications.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });

        callback(notifications);
    });

    return unsubscribe;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (uid: string, notificationId: string): Promise<void> => {
    const notificationRef = ref(database, `notifications/${uid}/${notificationId}`);
    await update(notificationRef, { read: true });
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (uid: string): Promise<void> => {
    const notificationsRef = ref(database, `notifications/${uid}`);
    await remove(notificationsRef);
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (uid: string, notificationId: string): Promise<void> => {
    const notificationRef = ref(database, `notifications/${uid}/${notificationId}`);
    await remove(notificationRef);
};

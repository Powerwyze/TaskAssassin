/**
 * Firebase Cloud Functions for TaskAssassin Push Notifications
 * 
 * This file contains all the backend functions needed to send push notifications
 * to users when events happen (friend requests, messages, task assignments, etc.)
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';

// Initialize Firebase Admin
admin.initializeApp();

// Configure VAPID keys for web push
// These should be set in Firebase Functions config or environment variables
const VAPID_PUBLIC_KEY = functions.config().vapid?.public_key || process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = functions.config().vapid?.private_key || process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = functions.config().vapid?.subject || process.env.VAPID_SUBJECT || 'mailto:bryan.stewart@powerwyze.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        VAPID_SUBJECT,
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

/**
 * Helper function to send a push notification to a user
 */
async function sendPushToUser(
    userId: string,
    title: string,
    body: string,
    url?: string,
    badge?: number
): Promise<void> {
    try {
        // Get user's push subscription from database
        const subscriptionSnapshot = await admin.database()
            .ref(`subscriptions/${userId}`)
            .once('value');

        const subscriptionData = subscriptionSnapshot.val();

        if (!subscriptionData || !subscriptionData.subscription) {
            console.log(`No subscription found for user ${userId}`);
            return;
        }

        const subscription = subscriptionData.subscription;

        // Prepare notification payload
        const payload = JSON.stringify({
            title,
            body,
            url: url || '/',
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png'
        });

        // Send notification
        await webpush.sendNotification(subscription, payload);

        console.log(`Push notification sent to user ${userId}`);

        // Also create an in-app notification in the database
        const notificationId = admin.database().ref().push().key;
        await admin.database()
            .ref(`notifications/${userId}/${notificationId}`)
            .set({
                id: notificationId,
                type: 'GENERAL',
                title,
                message: body,
                timestamp: Date.now(),
                read: false,
                actionUrl: url || '/'
            });

    } catch (error) {
        console.error(`Error sending push to user ${userId}:`, error);

        // If subscription is expired/invalid, remove it
        if ((error as any).statusCode === 410) {
            await admin.database()
                .ref(`subscriptions/${userId}`)
                .remove();
            console.log(`Removed expired subscription for user ${userId}`);
        }
    }
}

/**
 * Callable function to send a test notification
 * Usage: Call from frontend to test push notifications
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    await sendPushToUser(
        userId,
        'Test Notification 🔔',
        'Your push notifications are working!',
        '/'
    );

    return { success: true, message: 'Test notification sent' };
});

/**
 * Trigger: When a friend request is created
 * Sends notification to the recipient
 */
export const onFriendRequestCreated = functions.database
    .ref('friendRequests/{userId}/{requestId}')
    .onCreate(async (snapshot, context) => {
        const userId = context.params.userId;
        const requestData = snapshot.val();

        const fromUserName = requestData.fromUser?.codename || 'Someone';

        await sendPushToUser(
            userId,
            'New Friend Request! 👋',
            `${fromUserName} wants to be your friend`,
            '/social'
        );
    });

/**
 * Trigger: When a social message is created
 * Sends notification to the recipient
 */
export const onMessageReceived = functions.database
    .ref('messages/{userId}/{messageId}')
    .onCreate(async (snapshot, context) => {
        const userId = context.params.userId;
        const messageData = snapshot.val();

        // Only notify if this is an incoming message (not sent by the user)
        if (messageData.fromId === userId) {
            return null;
        }

        // Get sender's name
        const senderSnapshot = await admin.database()
            .ref(`users/${messageData.fromId}/codename`)
            .once('value');

        const senderName = senderSnapshot.val() || 'Someone';

        await sendPushToUser(
            userId,
            `Message from ${senderName} 💬`,
            messageData.text.substring(0, 100), // Truncate long messages
            `/social?chat=${messageData.fromId}`
        );
    });

/**
 * Trigger: When a task is assigned to a user
 * Sends notification about the new task
 */
export const onTaskAssigned = functions.database
    .ref('tasks/{userId}/{taskId}')
    .onCreate(async (snapshot, context) => {
        const userId = context.params.userId;
        const taskData = snapshot.val();

        // Only notify if task was assigned by someone else
        if (taskData.issuer === 'SELF' || taskData.fromUid === userId) {
            return null;
        }

        const assignerName = taskData.issuer || 'Your handler';

        await sendPushToUser(
            userId,
            'New Mission Assigned! 🎯',
            `${assignerName} assigned you: ${taskData.codename}`,
            '/'
        );
    });

/**
 * Trigger: When a task deadline is approaching (run daily)
 * Checks all pending tasks and sends reminders
 */
export const checkDeadlines = functions.pubsub
    .schedule('0 9 * * *') // Every day at 9 AM
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Get all users
        const usersSnapshot = await admin.database()
            .ref('users')
            .once('value');

        const users = usersSnapshot.val();

        for (const userId in users) {
            // Get user's pending tasks
            const tasksSnapshot = await admin.database()
                .ref(`tasks/${userId}`)
                .orderByChild('status')
                .equalTo('PENDING')
                .once('value');

            const tasks = tasksSnapshot.val();

            if (!tasks) continue;

            // Check for tasks due tomorrow
            for (const taskId in tasks) {
                const task = tasks[taskId];

                if (task.deadline === tomorrowStr) {
                    await sendPushToUser(
                        userId,
                        'Mission Deadline Tomorrow! ⏰',
                        `Don't forget: ${task.codename}`,
                        '/'
                    );
                }
            }
        }

        console.log('Deadline check completed');
        return null;
    });

/**
 * Trigger: When a streak is about to break (run daily)
 * Reminds users to complete a task if they haven't today
 */
export const checkStreaks = functions.pubsub
    .schedule('0 20 * * *') // Every day at 8 PM
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const today = new Date().toISOString().split('T')[0];

        // Get all users with active streaks
        const usersSnapshot = await admin.database()
            .ref('users')
            .once('value');

        const users = usersSnapshot.val();

        for (const userId in users) {
            // Get user stats
            const statsSnapshot = await admin.database()
                .ref(`userStats/${userId}`)
                .once('value');

            const stats = statsSnapshot.val();

            // Only notify if user has a streak and hasn't completed anything today
            if (stats && stats.currentStreak > 0) {
                const lastCompletion = stats.lastCompletionDate;

                if (lastCompletion !== today) {
                    await sendPushToUser(
                        userId,
                        'Don\'t Break Your Streak! 🔥',
                        `Complete a mission today to keep your ${stats.currentStreak}-day streak!`,
                        '/'
                    );
                }
            }
        }

        console.log('Streak check completed');
        return null;
    });

/**
 * Manual trigger: Send notification to specific user (admin only)
 * Useful for testing or sending announcements
 */
export const sendCustomNotification = functions.https.onCall(async (data, context) => {
    // Ensure user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    // TODO: Add admin check here
    // For now, anyone can send to themselves

    const { userId, title, body, url } = data;

    if (!userId || !title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    await sendPushToUser(userId, title, body, url);

    return { success: true };
});

/**
 * HTTP endpoint: Save push subscription
 * Called from frontend when user grants notification permission
 */
export const saveSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { subscription } = data;

    if (!subscription) {
        throw new functions.https.HttpsError('invalid-argument', 'Subscription data required');
    }

    // Save subscription to database
    await admin.database()
        .ref(`subscriptions/${userId}`)
        .set({
            subscription,
            created: Date.now(),
            lastUpdated: Date.now()
        });

    console.log(`Subscription saved for user ${userId}`);
    return { success: true };
});

/**
 * HTTP endpoint: Remove push subscription
 * Called when user unsubscribes or logs out
 */
export const removeSubscription = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    await admin.database()
        .ref(`subscriptions/${userId}`)
        .remove();

    console.log(`Subscription removed for user ${userId}`);
    return { success: true };
});

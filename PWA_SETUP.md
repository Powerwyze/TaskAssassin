# PWA Setup Guide for TaskAssassin

## Overview

TaskAssassin is configured as a Progressive Web App (PWA), which means users can install it directly from their browser **without going through any app store**.

## What's Already Set Up

✅ **Manifest.json** - App metadata for installation  
✅ **Service Worker** - Background script for offline support and push notifications  
✅ **PWA Service** - Helper functions for notifications and badges  
✅ **Auto-registration** - Service worker registers automatically on load

## How Users Install the App

### Android (Chrome, Edge, Samsung Internet)
1. Visit your deployed site (must be HTTPS - Vercel/Netlify provides this automatically)
2. Browser will show an install prompt, OR
3. Tap the three-dot menu → "Install app" or "Add to Home Screen"
4. App icon appears on home screen like a native app
5. Opens in its own window without browser UI

### iOS (Safari)
1. Visit your site in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. App icon appears on home screen
5. Opens full-screen like a native app

**No app store approval needed. No TestFlight. Just share the URL!**

## Push Notifications Setup

### Step 1: Generate VAPID Keys

Visit https://vapidkeys.com/ and generate a key pair. You'll get:
- **Public Key** - Goes in your `.env.local` file
- **Private Key** - Keep secret! Goes on your backend server (Firebase Functions, etc.)

### Step 2: Add to Environment Variables

Create or update `.env.local` in the project root:

```bash
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

### Step 3: Backend Setup (Firebase Functions Example)

You'll need a backend function to send push notifications. Example using Firebase Cloud Functions:

```javascript
const webpush = require('web-push');

// Set VAPID keys
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Function to send notification
exports.sendNotification = functions.https.onCall(async (data, context) => {
  const { subscription, title, body, url } = data;
  
  const payload = JSON.stringify({
    title,
    body,
    url
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});
```

### Step 4: Save User Subscriptions

When a user grants notification permission, save their push subscription to your database:

```typescript
import { setupPushNotifications } from './services/pwaService';
import { getDatabase, ref, set } from 'firebase/database';

async function subscribeUserToPush(userId: string) {
  const subscription = await setupPushNotifications();
  
  if (subscription) {
    // Save to Firebase
    const db = getDatabase();
    await set(ref(db, `subscriptions/${userId}`), {
      subscription: subscription.toJSON(),
      created: Date.now()
    });
  }
}
```

### Step 5: Trigger Notifications

From your backend, when events happen (new message, friend request, etc.):

```javascript
// Get user's subscription from database
const subscription = await getSubscriptionForUser(userId);

// Send notification
await webpush.sendNotification(subscription, JSON.stringify({
  title: "New Friend Request!",
  body: "Alex wants to be your friend",
  url: "/social"
}));
```

## Badge Support (Unread Count Bubbles)

### Android
**Works!** The app uses the Badging API which is supported in Chrome/Edge on Android:

```typescript
import { setAppBadge, clearAppBadge } from './services/pwaService';

// Show unread count
await setAppBadge(5); // Shows "5" on app icon

// Clear badge
await clearAppBadge();
```

### iOS
**Limited.** Safari doesn't fully support app icon badges for PWAs. For guaranteed badges on iOS, you'd need to:
- Wrap the app with Capacitor to create a native shell
- Submit to App Store or use TestFlight

**Recommendation:** Start with PWA (works great on Android), and if iOS badge bubbles become critical, add Capacitor wrapper later.

## Current Implementation in TaskAssassin

The app uses the notification service in `notificationService.ts` which integrates with Firebase. Badge counts can be automatically updated by:

1. Listening to notifications in real-time
2. Counting unread notifications
3. Updating the badge:

```typescript
import { setAppBadge } from './services/pwaService';
import { subscribeNotifications } from './services/notificationService';

subscribeNotifications(userId, (notifications) => {
  const unreadCount = notifications.filter(n => !n.read).length;
  setAppBadge(unreadCount);
});
```

## Testing Locally

1. **Development Server:** Run `npm run dev`
2. **HTTPS Required:** PWAs need HTTPS. On localhost it works without, but for real testing:
   - Use ngrok: `ngrok http 5173`
   - Or deploy to Vercel/Netlify (free tier)
3. **Test Installation:** Visit on mobile device and try installing
4. **Test Notifications:** Grant permission and trigger a test notification

## Deployment Checklist

- [ ] Deploy to HTTPS hosting (Vercel, Netlify, Firebase Hosting, etc.)
- [ ] Generate VAPID keys
- [ ] Add VAPID public key to `.env.local`
- [ ] Add VAPID keys to backend environment variables
- [ ] Create backend function to send push notifications
- [ ] Test installation on Android device
- [ ] Test installation on iOS device
- [ ] Test notifications on Android
- [ ] Set up badge count updates

## Icon Requirements

Place app icons in `/public/icons/`:
- `icon-192.png` - 192x192px
- `icon-512.png` - 512x512px

Recommended: Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) to create all required sizes.

## Troubleshooting

**Service Worker Not Registering?**
- Check browser console for errors
- Ensure you're on HTTPS (or localhost)
- Clear site data and reload

**Notifications Not Working?**
- Check permission was granted
- Verify VAPID keys are correct
- Check service worker is active
- Look for console errors

**App Not Installable?**
- Verify manifest.json is accessible at `/manifest.json`
- Check all required manifest fields are present
- Ensure service worker is registered
- Visit on HTTPS (except localhost)

**Badges Not Showing?**
- Android: Should work in Chrome/Edge
- iOS: Not supported for PWAs, consider Capacitor wrapper
- Check `navigator.setAppBadge` is available in console

## Next Steps

1. **Deploy to Vercel/Netlify** - Get HTTPS URL
2. **Generate VAPID keys** - https://vapidkeys.com/
3. **Test on real devices** - Android + iOS
4. **Implement backend push** - Firebase Functions or similar
5. **Share URL with testers** - No store approval needed!

---

**Questions?** Check the PWA documentation or the implementation in `/services/pwaService.ts`

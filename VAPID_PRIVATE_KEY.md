# 🔒 VAPID Private Key - KEEP THIS SECRET!

**DO NOT COMMIT THIS TO GIT OR SHARE PUBLICLY**

Your VAPID private key for push notifications:
```
privateKey: 2Nj6eg_ACkH3Lvf1nMPgouxWXzkrfw_pm5uskrIyH9Y
```

## Where to Use This

### Backend Environment Variables (Firebase Functions, Vercel, etc.)

Add this to your backend's environment configuration:

**Firebase Functions (.env or Firebase config):**
```bash
VAPID_PRIVATE_KEY=2Nj6eg_ACkH3Lvf1nMPgouxWXzkrfw_pm5uskrIyH9Y
VAPID_PUBLIC_KEY=BL_8MXx3VgRK5qQPejBsWw9FLhO3SiS8JTOjncaasV2XFDBlIxRR0Ztc1N0L-_I_x96zSr6WUx5OXbXN4N3bdZ8
VAPID_SUBJECT=mailto:bryan.stewart@powerwyze.com
```

**Vercel/Netlify Functions:**
1. Go to project settings
2. Add environment variables:
   - `VAPID_PRIVATE_KEY`: `2Nj6eg_ACkH3Lvf1nMPgouxWXzkrfw_pm5uskrIyH9Y`
   - `VAPID_PUBLIC_KEY`: `BL_8MXx3VgRK5qQPejBsWw9FLhO3SiS8JTOjncaasV2XFDBlIxRR0Ztc1N0L-_I_x96zSr6WUx5OXbXN4N3bdZ8`
   - `VAPID_SUBJECT`: `mailto:bryan.stewart@powerwyze.com`

## Example Backend Code (Firebase Functions)

```typescript
import * as functions from 'firebase-functions';
import * as webpush from 'web-push';

// Set up VAPID details
webpush.setVapidDetails(
  'mailto:bryan.stewart@powerwyze.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Cloud function to send notifications
export const sendPushNotification = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

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

## Security Notes

✅ **Public key** - Safe to use in frontend (already added to .env.local)  
🔒 **Private key** - NEVER put in frontend code, only backend  
📧 **Subject** - Your email for web push identification  

**This file is .gitignored - keep it that way!**

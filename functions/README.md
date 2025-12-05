# Firebase Functions Setup Guide

This directory contains the backend Firebase Cloud Functions that send push notifications to TaskAssassin users.

## 🚀 Quick Start

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project (if not already done)

```bash
# From the root of your project
firebase init

# Select:
# - Functions
# - Realtime Database
# Choose your existing Firebase project
# Select TypeScript
# Use ESLint: No
# Install dependencies: Yes
```

### 4. Install Function Dependencies

```bash
cd functions
npm install
```

### 5. Set VAPID Keys in Firebase Config

You have two options:

**Option A: Using Firebase CLI (Recommended)**

```bash
firebase functions:config:set vapid.public_key="BL_8MXx3VgRK5qQPejBsWw9FLhO3SiS8JTOjncaasV2XFDBlIxRR0Ztc1N0L-_I_x96zSr6WUx5OXbXN4N3bdZ8"

firebase functions:config:set vapid.private_key="2Nj6eg_ACkH3Lvf1nMPgouxWXzkrfw_pm5uskrIyH9Y"

firebase functions:config:set vapid.subject="mailto:bryan.stewart@powerwyze.com"
```

**Option B: Using .env file (Local Testing)**

Create `functions/.env`:
```bash
VAPID_PUBLIC_KEY=BL_8MXx3VgRK5qQPejBsWw9FLhO3SiS8JTOjncaasV2XFDBlIxRR0Ztc1N0L-_I_x96zSr6WUx5OXbXN4N3bdZ8
VAPID_PRIVATE_KEY=2Nj6eg_ACkH3Lvf1nMPgouxWXzkrfw_pm5uskrIyH9Y
VAPID_SUBJECT=mailto:bryan.stewart@powerwyze.com
```

### 6. Deploy Functions

```bash
# From the root project directory
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:onFriendRequestCreated,functions:onMessageReceived
```

## 📋 Available Functions

### Real-time Triggers

✅ **onFriendRequestCreated** - Sends notification when someone sends a friend request  
✅ **onMessageReceived** - Sends notification when a message is received  
✅ **onTaskAssigned** - Sends notification when a task is assigned  

### Scheduled Functions

✅ **checkDeadlines** - Runs daily at 9 AM, sends reminders for tasks due tomorrow  
✅ **checkStreaks** - Runs daily at 8 PM, reminds users to maintain their streak  

### Callable Functions (Frontend)

✅ **sendTestNotification** - Send a test push notification  
✅ **saveSubscription** - Save user's push subscription  
✅ **removeSubscription** - Remove user's push subscription  
✅ **sendCustomNotification** - Send custom notification to a user  

## 🔧 Frontend Integration

### Save Subscription After User Subscribes

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { setupPushNotifications } from './services/pwaService';

async function subscribeUser() {
  // Get push subscription
  const subscription = await setupPushNotifications();
  
  if (subscription) {
    // Call Firebase Function to save it
    const functions = getFunctions();
    const saveSubscription = httpsCallable(functions, 'saveSubscription');
    
    await saveSubscription({ 
      subscription: subscription.toJSON() 
    });
    
    console.log('Subscription saved to backend!');
  }
}
```

### Send Test Notification

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

async function testNotification() {
  const functions = getFunctions();
  const sendTest = httpsCallable(functions, 'sendTestNotification');
  
  const result = await sendTest();
  console.log(result); // { success: true, message: 'Test notification sent' }
}
```

### Remove Subscription on Logout

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

async function unsubscribeUser() {
  const functions = getFunctions();
  const removeSubscription = httpsCallable(functions, 'removeSubscription');
  
  await removeSubscription();
  console.log('Subscription removed');
}
```

## 🧪 Testing Locally

### Start Firebase Emulators

```bash
cd functions
npm run serve
```

This starts:
- Functions emulator on http://localhost:5001
- Database emulator on http://localhost:9000
- Functions UI on http://localhost:4000

### Test a Function

```bash
# Call a function locally
firebase functions:shell

# Then in the shell:
sendTestNotification({ userId: 'test-user-id' })
```

## 📊 Monitoring

### View Function Logs

```bash
firebase functions:log
```

### View Specific Function Logs

```bash
firebase functions:log --only onFriendRequestCreated
```

### Monitor in Firebase Console

1. Go to Firebase Console
2. Navigate to Functions
3. See execution stats, errors, and logs

## 🔒 Security Notes

- ✅ All callable functions require authentication
- ✅ VAPID private key is never exposed to frontend
- ✅ Subscriptions are stored per-user in the database
- ✅ Expired subscriptions are automatically removed

## 🐛 Troubleshooting

**Functions not deploying?**
```bash
# Check your Firebase project
firebase projects:list

# Use the correct project
firebase use your-project-id

# Try deploying again
firebase deploy --only functions
```

**VAPID keys not working?**
```bash
# Check current config
firebase functions:config:get

# If empty, set them again
firebase functions:config:set vapid.public_key="YOUR_KEY"
```

**Notifications not received?**
1. Check user has a subscription in `/subscriptions/{userId}`
2. Check function logs for errors: `firebase functions:log`
3. Verify VAPID keys are correct
4. Test with `sendTestNotification` function first

## 📦 Package Structure

```
functions/
├── src/
│   └── index.ts          # Main functions file
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── .env                  # Local environment variables (gitignored)
```

## 🚢 Deployment Checklist

- [x] Install Firebase CLI
- [x] Login to Firebase
- [x] Initialize Firebase project
- [x] Set VAPID keys in config
- [x] Deploy functions
- [x] Test with sendTestNotification
- [x] Integrate with frontend
- [x] Monitor logs

## 💡 Tips

- Start with just deploying `sendTestNotification` to test your setup
- Use emulators for local development to avoid billing
- Monitor function execution times to optimize performance
- Set up Cloud Logging alerts for errors
- Consider batching notifications to reduce costs

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Firebase Realtime Database Triggers](https://firebase.google.com/docs/functions/database-events)

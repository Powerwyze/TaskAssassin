# Firebase Setup Instructions for Task Assassin

This guide will help you set up Firebase for your Task Assassin app to enable real-time social features (friends, messaging, and task sharing).

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "Task Assassin")
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`) to add a web app
2. Enter an app nickname (e.g., "Task Assassin Web")
3. **Do NOT** check "Set up Firebase Hosting" (unless you want to use it)
4. Click "Register app"
5. You'll see your Firebase configuration object - **keep this page open**, you'll need it in Step 5

## Step 3: Enable Authentication

1. In the left sidebar, click **Authentication**
2. Click "Get started"
3. Go to the **Sign-in method** tab
4. Click on **Email/Password**
5. Enable the **Email/Password** toggle
6. Click "Save"

## Step 4: Set Up Realtime Database

1. In the left sidebar, click **Realtime Database**
2. Click "Create Database"
3. Choose your database location (select the closest to your users)
4. Start in **Test mode** for now (we'll update security rules later)
5. Click "Enable"

### Configure Security Rules (Important!)

Once the database is created, go to the **Rules** tab and replace the default rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "friends": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "friendRequests": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": true
      }
    },
    "messages": {
      "$threadId": {
        ".read": "auth != null && ($threadId.contains(auth.uid))",
        ".write": "auth != null && ($threadId.contains(auth.uid))"
      }
    },
    "tasks": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": true
      }
    }
  }
}
```

Click **Publish** to save the rules.

## Step 5: Add Firebase Config to Your App

1. Open the file `services/firebaseConfig.ts` in your project
2. Copy your Firebase configuration from the Firebase Console (from Step 2)
3. Replace the placeholder values with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Important:**
- Make sure you use the **databaseURL** from your Realtime Database (not Firestore)
- The databaseURL should end with `.firebaseio.com`

## Step 6: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your app in the browser
3. Click "NEW AGENT" to register a new account
4. Fill in:
   - Email address
   - Password (at least 6 characters)
   - Agent codename
5. Click "REGISTER AGENT"

If successful, you should be logged in and see your dashboard!

## Step 7: Test Social Features

### Create Multiple Accounts

To test social features, you'll need at least 2 accounts:

1. Open your app in a **normal browser window** and create Account #1
2. Open your app in an **incognito/private window** and create Account #2

### Test Friend Requests

1. In Account #1, go to the **NETWORK** tab
2. Switch to the **SEARCH** tab
3. You should see Account #2 in the recommended agents
4. Click the **+** button to send a friend request

5. In Account #2, go to **NETWORK** → **WIRE** tab
6. You should see the pending friend request
7. Click the green checkmark to accept

### Test Messaging

1. Once you're friends, click the **message icon** next to your friend's name
2. Type a message and press Enter
3. Switch to the other account's window - you should see the message appear in real-time!

### Test Task Issuing

1. Click the **shield icon** next to a friend to issue them a task
2. Enter a task title and briefing
3. Click "AUTHORIZE CONTRACT"
4. The task will appear in your friend's dashboard

## Security Notes

⚠️ **Important:** The security rules provided are for development/testing. For production, you should:

1. Add more granular access controls
2. Implement rate limiting
3. Add server-side validation
4. Consider using Firebase Security Rules with better validation

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check that your `apiKey` in `firebaseConfig.ts` is correct
- Make sure there are no extra spaces or quotes

### "Permission denied" errors
- Make sure you've published the security rules from Step 4
- Ensure you're logged in (check the header shows your codename)

### Messages not appearing in real-time
- Check your browser console for errors
- Verify your `databaseURL` is correct and ends with `.firebaseio.com`
- Make sure you're using **Realtime Database**, not Firestore

### Can't find users in the search
- Make sure both users have completed their profile setup
- Try refreshing the NETWORK page
- Check that the user exists in Firebase Console → Realtime Database → users

## Need Help?

If you encounter issues:

1. Check the browser console (F12) for error messages
2. Verify your Firebase config values are correct
3. Ensure your database security rules are published
4. Make sure Authentication and Realtime Database are both enabled

## What's Been Implemented

✅ **Firebase Authentication**
- Email/password registration
- Login/logout
- Persistent sessions

✅ **Real-time Social Features**
- Friend requests (send, accept, decline)
- Friends list with real-time updates
- Real-time messaging between friends
- Task issuing to friends
- User search and recommendations

✅ **User Profiles**
- Codename, avatar, handler preference
- Life goals for motivation
- Persistent profile storage

---

**Note:** All social features now work in real-time across multiple devices/browsers. When one user sends a message or friend request, the other user will see it immediately without refreshing the page!

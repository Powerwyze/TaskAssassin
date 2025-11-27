# Firebase Database Rules Check

## Current Issue
Users are not showing up in the NETWORK > SEARCH tab.

## Most Likely Cause
Your Firebase Realtime Database security rules might be blocking read access to the `/users` path.

## How to Fix

### 1. Go to Firebase Console
https://console.firebase.google.com/

### 2. Select Your Project
**gen-lang-client-0549725206**

### 3. Go to Realtime Database → Rules

Click on the **Rules** tab in your Realtime Database section.

### 4. Update Your Rules

Replace your current rules with this:

```json
{
  "rules": {
    "users": {
      ".read": "auth != null",
      "$uid": {
        ".write": "$uid === auth.uid",
        "profile": {
          ".write": "$uid === auth.uid"
        }
      }
    },
    "userStats": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "achievements": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "notifications": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "friends": {
      "$uid": {
        ".read": "$uid === auth.uid",
        "$friendUid": {
          ".write": "$uid === auth.uid || $friendUid === auth.uid"
        }
      }
    },
    "friendRequests": {
      "$uid": {
        ".read": "$uid === auth.uid",
        "$requestId": {
          ".write": "$uid === auth.uid || (!data.exists() && newData.exists())"
        }
      }
    },
    "sentFriendRequests": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "messages": {
      "$threadId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    },
    "tasks": {
      "$uid": {
        ".read": "$uid === auth.uid",
        "$taskId": {
          ".write": "$uid === auth.uid || (!data.exists() && newData.exists())"
        }
      }
    },
    "bugs": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Rules Summary
- **users**: Read all (auth), Write own profile.
- **userStats**: Read all (auth), Write own.
- **achievements**: Read all (auth), Write own.
- **notifications**: Read/Write own.
- **friends**: Read own. Write own or friend's list (for adding/removing).
- **friendRequests**: Read own. Write own (accept/decline) OR create new (sender) OR cancel (sender).
- **sentFriendRequests**: Read own. Write own OR delete (recipient, for cleanup).
- **userMessages**: Read own. Write own (sender) OR write to recipient (sender).
- **tasks**: Read own. Write own OR create new (issuer, with sender validation).
- **bugs**: Read/Write all (auth).

### 5. Click Publish

Click the **Publish** button to save the rules.

### 6. Test Again

Refresh your app and try searching for users again. Check the browser console for the debug messages.

## What to Check in Console

Look for these messages:
- 🔍 Fetching all users from Firebase...
- ✅ Users data retrieved: X users found
- 👤 Found user: [CODENAME]
- ❌ Error fetching users: [ERROR]

If you see an error about "Permission denied", that confirms the security rules need to be updated.

import {
  ref,
  push,
  set,
  get,
  remove,
  onValue,
  query,
  orderByChild,
  equalTo,
  serverTimestamp,
  update
} from 'firebase/database';
import { database } from './firebaseConfig';
import { SocialUser, FriendRequest, SocialMessage } from '../types';

// ==================== FRIEND REQUESTS ====================

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
  const requestRef = push(ref(database, `friendRequests/${toUid}`));
  await set(requestRef, {
    id: requestRef.key,
    fromUid,
    timestamp: serverTimestamp(),
    status: 'PENDING'
  });
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  currentUid: string,
  requestId: string,
  fromUid: string
): Promise<void> => {
  // Add both users to each other's friends list
  const updates: { [key: string]: any } = {};
  updates[`friends/${currentUid}/${fromUid}`] = {
    addedAt: serverTimestamp()
  };
  updates[`friends/${fromUid}/${currentUid}`] = {
    addedAt: serverTimestamp()
  };

  // Remove the friend request
  updates[`friendRequests/${currentUid}/${requestId}`] = null;

  await update(ref(database), updates);
};

/**
 * Decline a friend request
 */
export const declineFriendRequest = async (
  currentUid: string,
  requestId: string
): Promise<void> => {
  await remove(ref(database, `friendRequests/${currentUid}/${requestId}`));
};

/**
 * Remove a friend
 */
export const removeFriend = async (currentUid: string, friendUid: string): Promise<void> => {
  const updates: { [key: string]: any } = {};
  updates[`friends/${currentUid}/${friendUid}`] = null;
  updates[`friends/${friendUid}/${currentUid}`] = null;

  await update(ref(database), updates);
};

/**
 * Subscribe to friend requests in real-time
 */
export const subscribeFriendRequests = (
  uid: string,
  callback: (requests: FriendRequest[]) => void
): (() => void) => {
  const requestsRef = ref(database, `friendRequests/${uid}`);

  const unsubscribe = onValue(requestsRef, async (snapshot) => {
    const requests: FriendRequest[] = [];

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Fetch user details for each request
      for (const requestId in data) {
        const request = data[requestId];
        const userSnapshot = await get(ref(database, `users/${request.fromUid}/profile`));

        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          requests.push({
            id: requestId,
            fromUser: {
              id: request.fromUid,
              codename: userProfile.codename,
              avatar: userProfile.avatar,
              status: 'OFFLINE', // You can implement online presence tracking
              handlerId: userProfile.handlerId
            },
            timestamp: request.timestamp
          });
        }
      }
    }

    callback(requests);
  });

  return unsubscribe;
};

// ==================== FRIENDS ====================

/**
 * Subscribe to friends list in real-time
 */
export const subscribeFriends = (
  uid: string,
  callback: (friends: SocialUser[]) => void
): (() => void) => {
  const friendsRef = ref(database, `friends/${uid}`);

  const unsubscribe = onValue(friendsRef, async (snapshot) => {
    const friends: SocialUser[] = [];

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Fetch user details for each friend
      for (const friendUid in data) {
        const userSnapshot = await get(ref(database, `users/${friendUid}/profile`));

        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          friends.push({
            id: friendUid,
            codename: userProfile.codename,
            avatar: userProfile.avatar,
            status: 'OFFLINE', // You can implement online presence tracking
            handlerId: userProfile.handlerId
          });
        }
      }
    }

    callback(friends);
  });

  return unsubscribe;
};

/**
 * Search for users by codename
 */
export const searchUsers = async (searchTerm: string, currentUid: string): Promise<SocialUser[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  const users: SocialUser[] = [];

  if (snapshot.exists()) {
    const data = snapshot.val();

    for (const uid in data) {
      if (uid === currentUid) continue; // Skip current user

      const profile = data[uid].profile;
      if (profile && profile.codename.toLowerCase().includes(searchTerm.toLowerCase())) {
        users.push({
          id: uid,
          codename: profile.codename,
          avatar: profile.avatar,
          status: 'OFFLINE',
          handlerId: profile.handlerId
        });
      }
    }
  }

  return users;
};

/**
 * Get all users (for recommendations)
 */
export const getAllUsers = async (currentUid: string, limit: number = 10): Promise<SocialUser[]> => {
  try {
    console.log('🔍 Fetching all users from Firebase...');
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);
    const users: SocialUser[] = [];

    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('✅ Users data retrieved:', Object.keys(data).length, 'users found');
      let count = 0;

      for (const uid in data) {
        if (uid === currentUid) continue; // Skip current user
        if (count >= limit) break;

        const profile = data[uid].profile;
        if (profile && profile.codename) {
          console.log('👤 Found user:', profile.codename);
          users.push({
            id: uid,
            codename: profile.codename,
            avatar: profile.avatar,
            status: 'OFFLINE',
            handlerId: profile.handlerId
          });
          count++;
        }
      }
      console.log('📋 Returning', users.length, 'users');
    } else {
      console.log('⚠️ No users found in database');
    }

    return users;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }
};

// ==================== MESSAGES ====================

/**
 * Send a message to another user
 */
/**
 * Send a message to another user
 */
export const sendMessage = async (
  fromUid: string,
  toUid: string,
  text: string
): Promise<void> => {
  // Generate a unique ID for the message
  const tempRef = push(ref(database, `messages/${fromUid}_${toUid}`));
  const messageId = tempRef.key;

  const messageData = {
    id: messageId,
    fromId: fromUid,
    toId: toUid,
    text,
    timestamp: serverTimestamp()
  };

  // Create updates object for atomic update
  const updates: { [key: string]: any } = {};
  updates[`messages/${fromUid}_${toUid}/${messageId}`] = messageData;
  updates[`messages/${toUid}_${fromUid}/${messageId}`] = messageData;

  await update(ref(database), updates);
};

/**
 * Subscribe to messages between two users in real-time
 */
export const subscribeMessages = (
  uid1: string,
  uid2: string,
  callback: (messages: SocialMessage[]) => void
): (() => void) => {
  const thread1Ref = ref(database, `messages/${uid1}_${uid2}`);
  const thread2Ref = ref(database, `messages/${uid2}_${uid1}`);

  const messages: SocialMessage[] = [];
  let thread1Data: any = {};
  let thread2Data: any = {};

  const updateMessages = () => {
    const allMessages: SocialMessage[] = [];
    const seenIds = new Set();

    // Helper to add messages if not already seen
    const addMessages = (data: any) => {
      Object.values(data).forEach((msg: any) => {
        if (!seenIds.has(msg.id)) {
          allMessages.push(msg);
          seenIds.add(msg.id);
        }
      });
    };

    addMessages(thread1Data);
    addMessages(thread2Data);

    // Sort by timestamp
    const sortedMessages = allMessages.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    callback(sortedMessages);
  };

  const unsubscribe1 = onValue(thread1Ref, (snapshot) => {
    thread1Data = snapshot.exists() ? snapshot.val() : {};
    updateMessages();
  });

  const unsubscribe2 = onValue(thread2Ref, (snapshot) => {
    thread2Data = snapshot.exists() ? snapshot.val() : {};
    updateMessages();
  });

  // Return function to unsubscribe from both listeners
  return () => {
    unsubscribe1();
    unsubscribe2();
  };
};

/**
 * Issue a task to another user
 */
export const issueTask = async (
  fromUid: string,
  toUid: string,
  title: string,
  briefing: string
): Promise<void> => {
  const taskRef = push(ref(database, `tasks/${toUid}`));
  await set(taskRef, {
    id: taskRef.key,
    codename: title.toUpperCase(),
    briefing,
    deadline: new Date().toISOString().split('T')[0],
    startImage: 'https://placehold.co/400x300/1e293b/ef4444?text=PENDING+SCAN',
    status: 'PROPOSED',
    stars: 0,
    issuer: fromUid,
    timestamp: serverTimestamp()
  });

  // Also send a notification message
  await sendMessage(fromUid, toUid, `>> CONTRACT ISSUED: ${title}`);
};

/**
 * Subscribe to tasks assigned to the user
 */
export const subscribeTasks = (
  uid: string,
  callback: (tasks: any[]) => void
): (() => void) => {
  const tasksRef = ref(database, `tasks/${uid}`);

  const unsubscribe = onValue(tasksRef, (snapshot) => {
    const tasks: any[] = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.values(data).forEach((task: any) => {
        tasks.push(task);
      });
    }
    callback(tasks);
  });

  return unsubscribe;
};

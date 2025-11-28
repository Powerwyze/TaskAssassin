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
import { SocialUser, FriendRequest, SocialMessage, SentFriendRequest } from '../types';

// ==================== FRIEND REQUESTS ====================

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (fromUid: string, toUid: string, message?: string): Promise<void> => {
  const requestRef = push(ref(database, `friendRequests/${toUid}`));
  const requestId = requestRef.key;

  const requestData = {
    id: requestId,
    fromUid,
    timestamp: serverTimestamp(),
    status: 'PENDING',
    message: message || null
  };

  const updates: { [key: string]: any } = {};
  updates[`friendRequests/${toUid}/${requestId}`] = requestData;
  updates[`sentFriendRequests/${fromUid}/${requestId}`] = {
    ...requestData,
    toUid
  };

  await update(ref(database), updates);
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (
  currentUid: string,
  requestId: string,
  fromUid: string
): Promise<void> => {
  // 1. Add to current user's friend list (This should always succeed)
  const updates: { [key: string]: any } = {};
  updates[`friends/${currentUid}/${fromUid}`] = {
    addedAt: serverTimestamp()
  };
  // Remove the request from our list
  updates[`friendRequests/${currentUid}/${requestId}`] = null;

  await update(ref(database), updates);

  // 2. Try to add to other user's friend list (This might fail due to rules)
  try {
    const otherUpdates: { [key: string]: any } = {};
    otherUpdates[`friends/${fromUid}/${currentUid}`] = {
      addedAt: serverTimestamp()
    };
    otherUpdates[`sentFriendRequests/${fromUid}/${requestId}`] = null;
    await update(ref(database), otherUpdates);
  } catch (error) {
    console.warn("Could not update other user's friend list (likely permission issue):", error);
    // We don't throw here, so the local user still sees the friendship
  }
};

/**
 * Decline a friend request
 */
export const declineFriendRequest = async (
  currentUid: string,
  requestId: string,
  fromUid: string
): Promise<void> => {
  const updates: { [key: string]: any } = {};
  updates[`friendRequests/${currentUid}/${requestId}`] = null;
  updates[`sentFriendRequests/${fromUid}/${requestId}`] = null;

  await update(ref(database), updates);
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
 * Subscribe to friends list
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
      for (const friendUid in data) {
        const userSnapshot = await get(ref(database, `users/${friendUid}/profile`));
        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          friends.push({
            id: friendUid,
            codename: userProfile.codename,
            avatar: userProfile.avatar,
            status: 'OFFLINE', // Default
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
              status: 'OFFLINE', // Default
              handlerId: userProfile.handlerId
            },
            timestamp: request.timestamp,
            message: request.message
          });
        }
      }
    }

    callback(requests);
  });

  return unsubscribe;
};

/**
 * Subscribe to sent friend requests in real-time
 */
export const subscribeSentFriendRequests = (
  uid: string,
  callback: (requests: SentFriendRequest[]) => void
): (() => void) => {
  const requestsRef = ref(database, `sentFriendRequests/${uid}`);

  const unsubscribe = onValue(requestsRef, async (snapshot) => {
    const requests: SentFriendRequest[] = [];

    if (snapshot.exists()) {
      const data = snapshot.val();

      for (const requestId in data) {
        const request = data[requestId];
        // We need to fetch the 'toUser' profile
        const userSnapshot = await get(ref(database, `users/${request.toUid}/profile`));

        if (userSnapshot.exists()) {
          const userProfile = userSnapshot.val();
          requests.push({
            id: requestId,
            toUser: {
              id: request.toUid,
              codename: userProfile.codename,
              avatar: userProfile.avatar,
              status: 'OFFLINE', // Default
              handlerId: userProfile.handlerId
            },
            timestamp: request.timestamp,
            message: request.message
          });
        }
      }
    }

    callback(requests);
  });

  return unsubscribe;
};

// ==================== MESSAGING ====================

/**
 * Send a message to a friend
 */
export const sendMessage = async (fromUid: string, toUid: string, text: string): Promise<void> => {
  const messageId = push(ref(database, 'userMessages')).key; // Generate key
  if (!messageId) throw new Error("Failed to generate message ID");

  const messageData = {
    id: messageId,
    fromUid,
    toUid,
    text,
    timestamp: serverTimestamp()
  };

  const updates: { [key: string]: any } = {};
  // Write to sender's outbox
  updates[`userMessages/${fromUid}/${messageId}`] = messageData;
  // Write to recipient's inbox
  updates[`userMessages/${toUid}/${messageId}`] = messageData;

  await update(ref(database), updates);
};

/**
 * Subscribe to messages between two users
 */
export const subscribeMessages = (
  currentUid: string,
  otherUid: string,
  callback: (messages: SocialMessage[]) => void
): (() => void) => {
  const messagesRef = query(
    ref(database, `userMessages/${currentUid}`),
    orderByChild('timestamp')
  );

  const unsubscribe = onValue(messagesRef, (snapshot) => {
    const messages: SocialMessage[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const msg = childSnapshot.val();
        // Filter for messages involved in this specific conversation
        if (
          (msg.fromUid === currentUid && msg.toUid === otherUid) ||
          (msg.fromUid === otherUid && msg.toUid === currentUid)
        ) {
          messages.push({
            id: msg.id,
            fromId: msg.fromUid,
            toId: msg.toUid,
            text: msg.text,
            timestamp: msg.timestamp
          });
        }
      });
    }
    callback(messages);
  });

  return unsubscribe;
};

// ==================== TASK ASSIGNMENT ====================

/**
 * Issue a task to a friend
 */
export const issueTask = async (
  fromUid: string,
  toUid: string,
  title: string,
  briefing: string,
  deadline: string,
  issuerName: string,
  status: 'PROPOSED' | 'PENDING' = 'PROPOSED',
  startImage?: string
): Promise<string> => {
  const taskRef = push(ref(database, `tasks/${toUid}`));
  const taskData = {
    id: taskRef.key,
    codename: title,
    briefing,
    deadline,
    startImage: startImage || 'https://placehold.co/400x300/1e293b/ef4444?text=ASSIGNED+TASK',
    status,
    stars: 0,
    issuer: issuerName,
    fromUid,
    timestamp: serverTimestamp()
  };

  await set(taskRef, taskData);

  // Also track in sentTasks for the issuer
  if (fromUid !== toUid) {
    const sentTaskRef = ref(database, `sentTasks/${fromUid}/${taskRef.key}`);
    await set(sentTaskRef, {
      taskId: taskRef.key,
      toUid: toUid,
      timestamp: serverTimestamp()
    });
  }

  return taskRef.key!;
};

/**
 * Subscribe to assigned tasks
 */
export const subscribeTasks = (
  uid: string,
  callback: (tasks: any[]) => void
): (() => void) => {
  const tasksRef = ref(database, `tasks/${uid}`);

  const unsubscribe = onValue(tasksRef, (snapshot) => {
    const tasks: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        tasks.push(childSnapshot.val());
      });
    }
    callback(tasks);
  });

  return unsubscribe;
};

/**
 * Subscribe to tasks sent BY the user
 */
export const subscribeSentTasks = (
  uid: string,
  callback: (tasks: any[]) => void
): (() => void) => {
  const sentRef = ref(database, `sentTasks/${uid}`);

  // Keep track of active listeners for individual tasks
  let taskUnsubscribes: (() => void)[] = [];

  const unsubscribeSent = onValue(sentRef, (snapshot) => {
    // 1. Clear old task listeners
    taskUnsubscribes.forEach(unsub => unsub());
    taskUnsubscribes = [];

    if (!snapshot.exists()) {
      callback([]);
      return;
    }

    const sentItems: { toUid: string, taskId: string }[] = [];
    snapshot.forEach(child => {
      sentItems.push(child.val());
    });

    const tasksData: any[] = new Array(sentItems.length).fill(null);

    if (sentItems.length === 0) {
      callback([]);
      return;
    }

    sentItems.forEach((item, index) => {
      const taskRef = ref(database, `tasks/${item.toUid}/${item.taskId}`);
      const unsub = onValue(taskRef, (taskSnap) => {
        if (taskSnap.exists()) {
          tasksData[index] = taskSnap.val();
        } else {
          // Task might have been deleted
          tasksData[index] = null;
        }

        // Emit updated list, filtering out nulls (deleted or not yet loaded)
        const currentTasks = tasksData.filter(t => t !== null);
        callback(currentTasks);
      });
      taskUnsubscribes.push(unsub);
    });
  });

  return () => {
    unsubscribeSent();
    taskUnsubscribes.forEach(unsub => unsub());
  };
};

/**
 * Delete a task
 */
export const deleteTask = async (uid: string, taskId: string): Promise<void> => {
  const taskRef = ref(database, `tasks/${uid}/${taskId}`);
  await remove(taskRef);
};

/**
 * Update a task
 */
export const updateTask = async (uid: string, taskId: string, updates: any): Promise<void> => {
  const taskRef = ref(database, `tasks/${uid}/${taskId}`);
  await update(taskRef, updates);
};

// ==================== USER DISCOVERY ====================

/**
 * Get all users (for search/recommendations)
 * In a real app, this should be paginated and filtered server-side
 */
export const getAllUsers = async (currentUid: string, limit: number = 20): Promise<SocialUser[]> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);
  const users: SocialUser[] = [];

  if (snapshot.exists()) {
    snapshot.forEach((childSnapshot) => {
      const uid = childSnapshot.key;
      const profile = childSnapshot.val().profile;

      if (uid !== currentUid && profile) {
        users.push({
          id: uid!,
          codename: profile.codename,
          avatar: profile.avatar,
          status: 'OFFLINE', // Default
          handlerId: profile.handlerId
        });
      }
    });
  }

  // Sort by codename
  users.sort((a, b) => a.codename.localeCompare(b.codename));

  // Simple client-side limit for now
  return users.slice(0, limit);
};

/**
 * Report a bug
 */
export const reportBug = async (uid: string, description: string): Promise<void> => {
  const bugRef = push(ref(database, 'bugs'));
  await set(bugRef, {
    uid,
    description,
    timestamp: serverTimestamp(),
    status: 'OPEN'
  });
};

/**
 * Subscribe to bug reports
 */
export const subscribeBugReports = (
  callback: (reports: any[]) => void
): (() => void) => {
  const bugsRef = ref(database, 'bugs');
  const unsubscribe = onValue(bugsRef, (snapshot) => {
    const reports: any[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        reports.push({
          id: child.key,
          ...child.val()
        });
      });
    }
    callback(reports);
  });
  return unsubscribe;
};

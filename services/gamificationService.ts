import { ref, get, set, update, serverTimestamp, onValue } from 'firebase/database';
import { database } from './firebaseConfig';
import { UserStats, Achievement, Notification } from '../types';

// ==================== USER STATS ====================

const defaultStats: UserStats = {
  currentStreak: 0,
  longestStreak: 0,
  totalTasksCompleted: 0,
  totalStars: 0,
  level: 1,
  xp: 0,
  weeklyCompletions: 0,
  monthlyCompletions: 0
};

/**
 * Get user statistics
 */
export const getUserStats = async (uid: string): Promise<UserStats> => {
  const snapshot = await get(ref(database, `userStats/${uid}`));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  // Initialize stats if they don't exist
  await set(ref(database, `userStats/${uid}`), defaultStats);
  return defaultStats;
};

/**
 * Subscribe to user stats in real-time
 */
export const subscribeUserStats = (
  uid: string,
  callback: (stats: UserStats) => void
): (() => void) => {
  const statsRef = ref(database, `userStats/${uid}`);

  const unsubscribe = onValue(statsRef, async (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      // Initialize if doesn't exist
      await set(statsRef, defaultStats);
      callback(defaultStats);
    }
  });

  return unsubscribe;
};

/**
 * Update stats after task completion
 * Returns new achievements unlocked (if any)
 */
export const updateStatsOnTaskCompletion = async (
  uid: string,
  starsEarned: number
): Promise<string[]> => {
  const stats = await getUserStats(uid);
  const today = new Date().toISOString().split('T')[0];

  // Calculate streak
  let newStreak = stats.currentStreak;
  const lastDate = stats.lastCompletionDate;

  if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === today) {
      // Already completed today, don't increment streak
      newStreak = stats.currentStreak;
    } else if (lastDate === yesterdayStr) {
      // Completed yesterday, increment streak
      newStreak = stats.currentStreak + 1;
    } else {
      // Streak broken, reset to 1
      newStreak = 1;
    }
  } else {
    // First completion
    newStreak = 1;
  }

  // Calculate XP and level
  const xpGained = starsEarned * 10; // 10 XP per star
  const newXP = stats.xp + xpGained;
  const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP

  // Update stats
  const updates: { [key: string]: any } = {};
  updates[`userStats/${uid}/currentStreak`] = newStreak;
  updates[`userStats/${uid}/longestStreak`] = Math.max(newStreak, stats.longestStreak);
  updates[`userStats/${uid}/totalTasksCompleted`] = stats.totalTasksCompleted + 1;
  updates[`userStats/${uid}/totalStars`] = stats.totalStars + starsEarned;
  updates[`userStats/${uid}/level`] = newLevel;
  updates[`userStats/${uid}/xp`] = newXP;
  updates[`userStats/${uid}/lastCompletionDate`] = today;
  updates[`userStats/${uid}/weeklyCompletions`] = stats.weeklyCompletions + 1;
  updates[`userStats/${uid}/monthlyCompletions`] = stats.monthlyCompletions + 1;

  await update(ref(database), updates);

  // Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(uid, {
    ...stats,
    currentStreak: newStreak,
    longestStreak: Math.max(newStreak, stats.longestStreak),
    totalTasksCompleted: stats.totalTasksCompleted + 1,
    totalStars: stats.totalStars + starsEarned,
    level: newLevel,
    xp: newXP
  });

  return newAchievements;
};

// ==================== ACHIEVEMENTS ====================

const achievementDefinitions = [
  { id: 'first_task', name: 'First Mission', description: 'Complete your first task', icon: '🎯', requirement: 1, type: 'tasks' },
  { id: 'task_master_10', name: 'Task Master', description: 'Complete 10 tasks', icon: '⭐', requirement: 10, type: 'tasks' },
  { id: 'task_veteran_50', name: 'Task Veteran', description: 'Complete 50 tasks', icon: '🏆', requirement: 50, type: 'tasks' },
  { id: 'task_legend_100', name: 'Task Legend', description: 'Complete 100 tasks', icon: '👑', requirement: 100, type: 'tasks' },
  { id: 'streak_3', name: '3-Day Streak', description: 'Complete tasks 3 days in a row', icon: '🔥', requirement: 3, type: 'streak' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Complete tasks 7 days in a row', icon: '💪', requirement: 7, type: 'streak' },
  { id: 'streak_30', name: 'Month Master', description: 'Complete tasks 30 days in a row', icon: '🌟', requirement: 30, type: 'streak' },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Earn 100 total stars', icon: '✨', requirement: 100, type: 'stars' },
  { id: 'level_5', name: 'Rising Agent', description: 'Reach level 5', icon: '📈', requirement: 5, type: 'level' },
  { id: 'level_10', name: 'Elite Operative', description: 'Reach level 10', icon: '🚀', requirement: 10, type: 'level' }
];

/**
 * Get user achievements
 */
export const getUserAchievements = async (uid: string): Promise<Achievement[]> => {
  const snapshot = await get(ref(database, `achievements/${uid}`));
  const userAchievements: { [key: string]: { unlockedAt: string } } = snapshot.exists() ? snapshot.val() : {};

  const stats = await getUserStats(uid);

  return achievementDefinitions.map(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    icon: def.icon,
    requirement: def.requirement,
    currentProgress: getProgressForAchievement(def.type, stats),
    unlockedAt: userAchievements[def.id]?.unlockedAt
  }));
};

/**
 * Helper to get current progress for an achievement type
 */
const getProgressForAchievement = (type: string, stats: UserStats): number => {
  switch (type) {
    case 'tasks': return stats.totalTasksCompleted;
    case 'streak': return stats.currentStreak;
    case 'stars': return stats.totalStars;
    case 'level': return stats.level;
    default: return 0;
  }
};

/**
 * Check and unlock achievements
 * Returns array of newly unlocked achievement IDs
 */
const checkAndUnlockAchievements = async (uid: string, stats: UserStats): Promise<string[]> => {
  const snapshot = await get(ref(database, `achievements/${uid}`));
  const unlockedAchievements: { [key: string]: { unlockedAt: string } } = snapshot.exists() ? snapshot.val() : {};

  const newlyUnlocked: string[] = [];
  const updates: { [key: string]: any } = {};

  for (const achievement of achievementDefinitions) {
    // Skip if already unlocked
    if (unlockedAchievements[achievement.id]) continue;

    const progress = getProgressForAchievement(achievement.type, stats);

    if (progress >= achievement.requirement) {
      newlyUnlocked.push(achievement.id);
      updates[`achievements/${uid}/${achievement.id}`] = {
        unlockedAt: new Date().toISOString()
      };

      // Create notification for achievement
      await createNotification(uid, {
        type: 'ACHIEVEMENT',
        title: `Achievement Unlocked: ${achievement.name}`,
        message: achievement.description,
        timestamp: new Date().toISOString(),
        read: false
      });
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(ref(database), updates);
  }

  return newlyUnlocked;
};

// ==================== LEADERBOARD ====================

export interface LeaderboardEntry {
  uid: string;
  codename: string;
  totalStars: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  weeklyCompletions: number;
  monthlyCompletions: number;
  xp: number;
  achievementsUnlocked: number;
}

/**
 * Get leaderboard (friends only) with detailed stats
 */
export const getFriendsLeaderboard = async (uid: string, friendIds: string[]): Promise<LeaderboardEntry[]> => {
  const leaderboard: LeaderboardEntry[] = [];

  // Add current user
  const userStats = await getUserStats(uid);
  const userProfileSnap = await get(ref(database, `users/${uid}/profile`));
  const userAchievementsSnap = await get(ref(database, `achievements/${uid}`));
  const userAchievementsCount = userAchievementsSnap.exists()
    ? Object.keys(userAchievementsSnap.val()).length
    : 0;

  if (userProfileSnap.exists()) {
    const userProfile = userProfileSnap.val();
    leaderboard.push({
      uid,
      codename: userProfile.codename,
      totalStars: userStats.totalStars,
      level: userStats.level,
      currentStreak: userStats.currentStreak,
      longestStreak: userStats.longestStreak,
      totalTasksCompleted: userStats.totalTasksCompleted,
      weeklyCompletions: userStats.weeklyCompletions,
      monthlyCompletions: userStats.monthlyCompletions,
      xp: userStats.xp,
      achievementsUnlocked: userAchievementsCount
    });
  }

  // Add friends
  // Add friends
  const friendPromises = friendIds.map(async (friendId) => {
    const friendStats = await getUserStats(friendId);
    const friendProfileSnap = await get(ref(database, `users/${friendId}/profile`));
    const friendAchievementsSnap = await get(ref(database, `achievements/${friendId}`));
    const friendAchievementsCount = friendAchievementsSnap.exists()
      ? Object.keys(friendAchievementsSnap.val()).length
      : 0;

    if (friendProfileSnap.exists()) {
      const friendProfile = friendProfileSnap.val();
      return {
        uid: friendId,
        codename: friendProfile.codename,
        totalStars: friendStats.totalStars,
        level: friendStats.level,
        currentStreak: friendStats.currentStreak,
        longestStreak: friendStats.longestStreak,
        totalTasksCompleted: friendStats.totalTasksCompleted,
        weeklyCompletions: friendStats.weeklyCompletions,
        monthlyCompletions: friendStats.monthlyCompletions,
        xp: friendStats.xp,
        achievementsUnlocked: friendAchievementsCount
      };
    }
    return null;
  });

  const friendsData = await Promise.all(friendPromises);
  friendsData.forEach(friend => {
    if (friend) leaderboard.push(friend);
  });

  // Sort by total stars (descending)
  leaderboard.sort((a, b) => b.totalStars - a.totalStars);

  return leaderboard;
};

// ==================== NOTIFICATIONS ====================

/**
 * Create a notification
 */
export const createNotification = async (
  uid: string,
  notification: Omit<Notification, 'id'>
): Promise<void> => {
  const notifRef = ref(database, `notifications/${uid}`);
  const snapshot = await get(notifRef);
  const notifications: Notification[] = snapshot.exists() ? snapshot.val() : [];

  const newNotification: Notification = {
    id: Date.now().toString(),
    ...notification
  };

  notifications.unshift(newNotification); // Add to beginning

  // Keep only last 50 notifications
  const trimmed = notifications.slice(0, 50);

  await set(notifRef, trimmed);
};

/**
 * Subscribe to notifications
 */
export const subscribeNotifications = (
  uid: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const notifRef = ref(database, `notifications/${uid}`);

  const unsubscribe = onValue(notifRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback([]);
    }
  });

  return unsubscribe;
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (uid: string, notificationId: string): Promise<void> => {
  const snapshot = await get(ref(database, `notifications/${uid}`));
  if (!snapshot.exists()) return;

  const notifications: Notification[] = snapshot.val();
  const index = notifications.findIndex(n => n.id === notificationId);

  if (index !== -1) {
    notifications[index].read = true;
    await set(ref(database, `notifications/${uid}`), notifications);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (uid: string): Promise<void> => {
  const snapshot = await get(ref(database, `notifications/${uid}`));
  if (!snapshot.exists()) return;

  const notifications: Notification[] = snapshot.val();
  const updated = notifications.map(n => ({ ...n, read: true }));

  await set(ref(database, `notifications/${uid}`), updated);
};

export type MissionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROPOSED';

export interface MissionResult {
  missionComplete: boolean;
  starsAwarded: number;
  debrief: string;
  tacticalAdvice: string[];
}

export interface Mission {
  id: string;
  codename: string; // Title
  briefing: string; // Description
  deadline: string;
  recurrence?: 'WEEKLY' | 'MONTHLY' | null;
  startImage: string; // The "Before" / Messy image
  endImage?: string; // The "After" / Clean image
  status: MissionStatus;
  stars: number;
  lastFeedback?: string;
  issuer?: string; // 'COMMAND' or Agent Codename
  fromUid?: string;
  toUid?: string;
}

export interface CameraCapture {
  preview: string;
  base64: string;
  timestamp: string;
}

export interface HandlerPersona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  suggestedMissions?: {
    title: string;
    briefing: string;
  }[];
}

export interface UserProfile {
  codename: string;
  handlerId: string;
  lifeGoal: string;
  avatar?: string;
  hasSeenTutorial?: boolean;
  customHandlerName?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'HANDLER';
  text: string;
  suggestedMissions?: {
    title: string;
    briefing: string;
  }[];
}

// --- SOCIAL TYPES ---

export interface SocialUser {
  id: string;
  codename: string;
  avatar?: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  handlerId: string;
}

export interface FriendRequest {
  id: string;
  fromUser: SocialUser;
  timestamp: string;
  message?: string;
}

export interface SentFriendRequest {
  id: string;
  toUser: SocialUser;
  timestamp: string;
  message?: string;
}

export interface SocialMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}

// --- GAMIFICATION TYPES ---

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  totalStars: number;
  level: number;
  xp: number;
  lastCompletionDate?: string;
  weeklyCompletions: number;
  monthlyCompletions: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: number;
  currentProgress: number;
}

export interface Notification {
  id: string;
  type: 'DEADLINE' | 'FRIEND_REQUEST' | 'MESSAGE' | 'TASK_ASSIGNED' | 'ACHIEVEMENT' | 'STREAK';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
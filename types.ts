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
}

export interface UserProfile {
  codename: string;
  handlerId: string;
  lifeGoal: string;
  avatar?: string;
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
}

export interface SocialMessage {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  timestamp: string;
}
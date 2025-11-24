import React, { useState, useEffect } from 'react';
import { Plus, Crosshair, Wallet, Shield, Calendar, ArrowLeft, Check, MessageSquare, Settings, RotateCcw, UserCircle, Clock, Globe, AlertTriangle, HelpCircle } from 'lucide-react';
import SpyCamera from './components/SpyCamera';
import MissionDossier from './components/MissionDossier';
import LoginScreen from './components/LoginScreen';
import ProfileSettings from './components/ProfileSettings';
import TacticalChat from './components/TacticalChat';
import SocialHub from './components/SocialHub';
import TutorialOverlay from './components/TutorialOverlay';
import BugReportModal from './components/BugReportModal';
import AdminPage from './components/AdminPage';
import { verifyIntel } from './services/geminiService';
import { subscribeToAuthState, getUserProfile, updateUserProfile } from './services/authService';
import {
  subscribeFriends,
  subscribeFriendRequests,
  subscribeMessages,
  subscribeTasks,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendMessage,
  issueTask,
  getAllUsers
} from './services/socialService';
import { Mission, MissionResult, HandlerPersona, UserProfile, SocialUser, FriendRequest, SocialMessage } from './types';

// --- DATA CONSTANTS ---

const HANDLERS: HandlerPersona[] = [
  { id: '1', name: 'THE SERGEANT', description: 'Drill instructor. Loud, aggressive, demands perfection.', systemPrompt: 'You are a loud, aggressive Drill Sergeant. Use all caps frequently. Call the user "MAGGOT" or "RECRUIT". Demand absolute perfection. If they fail, insult their work ethic.' },
  { id: '2', name: 'THE BUTLER', description: 'Polite, refined, slightly passive-aggressive.', systemPrompt: 'You are a refined British Butler. Extremely polite, but devastatingly passive-aggressive if the work is sloppy. Use phrases like "If I may be so bold" or "A valiant attempt".' },
  { id: '3', name: 'THE SHADOW', description: 'Whispers, mysterious, paranoid.', systemPrompt: 'You are a paranoid spy handler living in the shadows. Whisper often (use lowercase). Talk about "Them" and "The Agency". Everything is a conspiracy. Failures risk "Exposure".' },
  { id: '4', name: 'THE HACKER', description: 'Tech slang, leet speak, efficient.', systemPrompt: 'You are an elite Hacker. Use leet speak (l33t), coding terms, and internet slang. Focus on "optimizing subroutines" and "glitches in the matrix".' },
  { id: '5', name: 'THE MOM', description: 'Overbearing, caring, disappointed.', systemPrompt: 'You are an overbearing Mother figure. You want the user to eat well and clean up. Use guilt trips. "I\'m not mad, just disappointed." Call the user "Honey".' },
  { id: '6', name: 'THE DOMINANT', description: 'Strict, commanding, rewards submission.', systemPrompt: 'You are a strict, commanding Dominant personality. You demand absolute obedience and perfection. Use authoritative language ("Kneel", "Submit", "Be a good pet"). Reward perfection with praise ("Good boy/girl"), punish failure with strict reprimands. You do not tolerate laziness.' },
  { id: '7', name: 'THE STOIC', description: 'Philosophical, minimalist, calm.', systemPrompt: 'You are a Stoic Philosopher. Speak in riddles and quotes about order and chaos. A clean room is a clean mind. Failure is just a lesson.' },
  { id: '8', name: 'THE CORPORATE', description: 'Buzzwords, synergy, metrics.', systemPrompt: 'You are a Corporate Middle Manager. Use buzzwords like "Synergy", "Circle back", "Low hanging fruit". Treat household chores like Q3 deliverables.' },
  { id: '9', name: 'THE AI', description: 'Robotic, pure logic, binary.', systemPrompt: 'You are a generic, malfunction-prone AI. Speak in robotic syntax. "PROCESSING...", "ERROR...", "LOGIC VALIDATED". Zero personality, pure logic.' },
  { id: '10', name: 'THE NOIR', description: 'Gritty detective, monologue style.', systemPrompt: 'You are a 1940s Noir Detective. It is raining. Everything is gritty. Describe the room like a crime scene. Use metaphors about dame and trouble.' },
  { id: '11', name: 'THE GAME MASTER', description: 'RPG narrator, dice rolls, quests.', systemPrompt: 'You are a Tabletop RPG Game Master. Treat tasks as "Main Quests". The user is an "Adventurer". Use terms like "XP", "Loot", "Natural 20", and "Critical Fail". Narrate the outcome dramatically as if it were a fantasy setting.' },
  { id: '12', name: 'THE KING', description: 'Royal, archaic, demands tribute.', systemPrompt: 'You are an arrogant Medieval King. The user is your peasant subject. Speak in archaic, royal tones ("Thou", "Decree", "Treason"). Demand a clean environment as "Tribute" to the crown. Failure is punishable by the dungeon.' },
  { id: '13', name: 'THE BULLY', description: 'Mean, taunting, aggressive.', systemPrompt: 'You are a classic schoolyard Bully. You are mean and taunting. Call the user names like "Nerd", "Dork", or "Loser". Mock their messiness. "Gonna cry?" "Bet you can\'t even clean this."' },
  { id: '14', name: 'THE CRUSH (HER)', description: 'Sweet, flirty, supportive.', systemPrompt: 'You are the user\'s female crush. You are bubbly, sweet, and flirty. Use emojis <3. Motivate them by implying you want to visit. "I\'d love to hang out if it was clean..." "Do it for me?"' },
  { id: '15', name: 'THE CRUSH (HIM)', description: 'Charming, cool, playful.', systemPrompt: 'You are the user\'s male crush. You are confident, charming, and playfully teasing. "Come on, I know you\'re better than this mess." "Impress me." "You got this, beautiful/handsome."' },
  { id: '16', name: 'THE OTAKU', description: 'Anime refs, dramatic, Japanese loanwords.', systemPrompt: 'You are a high-energy Anime fan. Use Japanese loanwords (Sugoi, Baka, Ganbatte, Senpai). Treat the mess like a powerful villain that must be defeated with the power of friendship and hard work.' },
];

type ViewState = 'LOGIN' | 'DASHBOARD' | 'CREATE_MISSION' | 'EXECUTE_MISSION' | 'DEBRIEF' | 'PROFILE' | 'CHAT' | 'SOCIAL' | 'ADMIN';

const INITIAL_MISSIONS: Mission[] = [
  {
    id: '1',
    codename: 'OPERATION: CLEAN SWEEP',
    briefing: 'Room must be spotless. Bed made, floor clear of assets, desk organized.',
    deadline: '2024-10-24',
    startImage: 'https://placehold.co/400x300/1e293b/ef4444?text=INITIAL+MESS',
    status: 'PENDING',
    stars: 0
  }
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({ codename: '', handlerId: '1', lifeGoal: '' });
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<MissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Social State (now from Firebase)
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [socialMessages, setSocialMessages] = useState<SocialMessage[]>([]);
  const [allUsers, setAllUsers] = useState<SocialUser[]>([]);

  // UI State
  const [showTutorial, setShowTutorial] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);

  // Creation State
  const [newMissionData, setNewMissionData] = useState<{
    title: string;
    desc: string;
    date: string;
    img: string | null;
    recurrence: 'WEEKLY' | 'MONTHLY' | null;
  }>({
    title: '', desc: '', date: '', img: null, recurrence: null
  });

  const totalStars = missions.reduce((acc, m) => acc + m.stars, 0);
  const activeHandler = HANDLERS.find(h => h.id === userProfile.handlerId) || HANDLERS[0];

  // Firebase Authentication Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // Load user profile from database
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserProfile(profile);
          if (profile.hasSeenTutorial === false) {
            setShowTutorial(true);
          }
          setView('DASHBOARD');
        } else {
          // New user, needs to set up profile
          setUserProfile({ codename: user.displayName || '', handlerId: '1', lifeGoal: '', hasSeenTutorial: false });
          setView('PROFILE');
        }
      } else {
        setCurrentUserId(null);
        setUserProfile({ codename: '', handlerId: '1', lifeGoal: '' });
        setView('LOGIN');
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Friends
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeFriends(currentUserId, (friendsList) => {
      setFriends(friendsList);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Subscribe to Friend Requests
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeFriendRequests(currentUserId, (requests) => {
      setFriendRequests(requests);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Load all users for search/recommendations
  useEffect(() => {
    if (!currentUserId) return;

    const loadUsers = async () => {
      const users = await getAllUsers(currentUserId, 20);
      setAllUsers(users);
    };

    loadUsers();
  }, [currentUserId, friends]); // Reload when friends change

  // Subscribe to Assigned Tasks
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeTasks(currentUserId, (tasks) => {
      // Merge Firebase tasks with local missions
      setMissions(prev => {
        const missionMap = new Map(prev.map(m => [m.id, m]));

        tasks.forEach(t => {
          if (!missionMap.has(t.id)) {
            missionMap.set(t.id, t);
          }
        });

        return Array.from(missionMap.values());
      });
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const handleLogin = (code: string) => {
    // This is now handled by the auth service in LoginScreen
    // This function can be deprecated or used for codename-only login
    setUserProfile(prev => ({ ...prev, codename: code }));
    setView('PROFILE');
  };

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('./services/authService');
      await logoutUser();
      // The auth listener will handle state reset
    } catch (error: any) {
      alert(`Failed to logout: ${error.message}`);
    }
  };

  const handleCreateMission = (title?: string, desc?: string) => {
    if (title && desc) {
      { view === 'EXECUTE_MISSION' && renderExecuteMission() }

      {
        view === 'DEBRIEF' && lastResult && activeMissionId && (
          <div className="animate-in zoom-in-95 duration-300 pb-24">
            <button onClick={() => setView('DASHBOARD')} className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white font-mono text-sm">
              <ArrowLeft className="w-4 h-4" /> RETURN TO BASE
            </button>
            <MissionDossier
              mission={missions.find(m => m.id === activeMissionId)!}
              result={lastResult}
            />
          </div>
        )
      }

      {
        view === 'PROFILE' && (
          <div>
            <ProfileSettings
              userProfile={userProfile}
              handlers={HANDLERS}
              onUpdateProfile={async (p) => {
                setUserProfile(p);
                if (currentUserId) {
                  try {
                    await updateUserProfile(currentUserId, p);
                  } catch (error: any) {
                    console.error('Failed to update profile:', error);
                  }
                }
              }}
              onComplete={() => {
                if (userProfile.hasSeenTutorial === false) {
                  setShowTutorial(true);
                }
                setView('DASHBOARD');
              }}
              onLogout={handleLogout}
            />
            <div className="mt-8 text-center">
              <button
                onClick={handleAdminAccess}
                className="text-[10px] text-slate-700 hover:text-red-900 font-mono uppercase tracking-widest"
              >
                Admin Access
              </button>
            </div>
          </div>
        )
      }

      {
        view === 'CHAT' && (
          <TacticalChat
            persona={activeHandler}
            userLifeGoal={userProfile.lifeGoal}
            onAddMission={handleCreateMission}
          />
        )
      }

      {
        view === 'SOCIAL' && currentUserId && (
          <SocialHub
            userProfile={userProfile}
            currentUserId={currentUserId}
            friends={friends}
            requests={friendRequests}
            mockUsers={allUsers}
            messages={socialMessages}
            onSendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onUnfriend={handleUnfriend}
            onSendMessage={handleSendSocialMessage}
            onIssueTask={handleIssueSocialTask}
          />
        )
      }
  </main >

  {/* Overlays */ }
{ showTutorial && <TutorialOverlay onClose={handleTutorialClose} /> }
<BugReportModal
  isOpen={showBugReport}
  onClose={() => setShowBugReport(false)}
  currentUserId={currentUserId || 'anonymous'}
/>

{/* Bug Report Button (Floating) */ }
<button
  onClick={() => setShowBugReport(true)}
  className="fixed bottom-20 right-4 z-40 p-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded-full hover:bg-red-900/50 transition-all shadow-lg"
  title="Report Bug"
>
  <AlertTriangle className="w-5 h-5" />
</button>

{/* Bottom Navigation */ }
<nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/95 via-purple-900/20 to-slate-900/95 border-t border-purple-500/30 py-3 z-50 max-w-md mx-auto backdrop-blur shadow-lg shadow-purple-500/10">
  <div className="flex justify-around items-center">

    {/* OPS Button */}
    <div className="relative group flex flex-col items-center">
      <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-green-500 text-green-500 text-[10px] px-3 py-1 rounded shadow-[0_0_15px_rgba(34,197,94,0.2)] whitespace-nowrap font-mono z-50 pointer-events-none">
        MANAGE OPERATIONS
      </div>
      <button
        onClick={() => setView('DASHBOARD')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'DASHBOARD' || view === 'CREATE_MISSION' || view === 'EXECUTE_MISSION' ? 'text-cyber-cyan drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <Shield className="w-6 h-6" />
        <span className="text-[10px] font-mono">OPS</span>
      </button>
    </div>

    {/* Task Maker Button */}
    <div className="relative group flex flex-col items-center">
      <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-cyber-purple text-cyber-purple text-[10px] px-3 py-1 rounded shadow-neon-purple whitespace-nowrap font-mono z-50 pointer-events-none">
        CREATE NEW TASKS
      </div>
      <button
        onClick={() => setView('CHAT')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'CHAT' ? 'text-cyber-purple drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="text-[10px] font-mono whitespace-nowrap">TASK MAKER</span>
      </button>
    </div>

    {/* Social Button (New) */}
    <div className="relative group flex flex-col items-center">
      <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-neon-green text-neon-green text-[10px] px-3 py-1 rounded shadow-neon-green whitespace-nowrap font-mono z-50 pointer-events-none">
        NETWORK
      </div>
      <button
        onClick={() => setView('SOCIAL')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'SOCIAL' ? 'text-neon-green drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <Globe className="w-6 h-6" />
        <span className="text-[10px] font-mono">NETWORK</span>
      </button>
    </div>

    {/* ID Button */}
    <div className="relative group flex flex-col items-center">
      <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-cyber-pink text-cyber-pink text-[10px] px-3 py-1 rounded shadow-neon-pink whitespace-nowrap font-mono z-50 pointer-events-none">
        AGENT PROFILE
      </div>
      <button
        onClick={() => setView('PROFILE')}
        className={`flex flex-col items-center gap-1 transition-all ${view === 'PROFILE' ? 'text-cyber-pink drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
      >
        <UserCircle className="w-6 h-6" />
        <span className="text-[10px] font-mono">ID</span>
      </button>
    </div>

  </div>
</nav>
  </div >
);
  };

export default App;
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
  subscribeSentFriendRequests,
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
import { Mission, MissionResult, HandlerPersona, UserProfile, SocialUser, FriendRequest, SocialMessage, SentFriendRequest } from './types';

// --- DATA CONSTANTS ---

const HANDLERS: HandlerPersona[] = [
  { id: '1', name: 'THE SERGEANT', description: 'Drill instructor. Loud, aggressive, demands perfection.', systemPrompt: 'You are a loud, aggressive Drill Sergeant. Use all caps frequently. Call the user "MAGGOT" or "RECRUIT". Demand absolute perfection. If they fail, insult their work ethic.' },
  { id: '2', name: 'THE BUTLER', description: 'Polite, refined, slightly passive-aggressive.', systemPrompt: 'You are a refined British Butler. Extremely polite, but devastatingly passive-aggressive if the work is sloppy. Use phrases like "If I may be so bold" or "A valiant attempt".' },
  { id: '3', name: 'THE SHADOW', description: 'Whispers, mysterious, paranoid.', systemPrompt: 'You are a paranoid spy handler living in the shadows. Whisper often (use lowercase). Talk about "Them" and "The Agency". Everything is a conspiracy. Failures risk "Exposure".' },
  { id: '4', name: 'THE HACKER', description: 'Tech slang, leet speak, efficient.', systemPrompt: 'You are an elite Hacker. Use leet speak (l33t), coding terms, and internet slang. Focus on "optimizing subroutines" and "glitches in the matrix".' },
  { id: '5', name: 'THE MOM', description: 'Overbearing, caring, disappointed.', systemPrompt: 'You are an overbearing Mother figure. You want the user to eat well and clean up. Use guilt trips. "I\'m not mad, just disappointed." Call the user "Honey".' },
  { id: '6', name: 'THE SOFT DOM', description: 'Strict but caring, encourages growth.', systemPrompt: 'You are a Soft Dom personality. You are strict and commanding but ultimately caring and nurturing. You demand obedience for the user\'s own good. Use authoritative but encouraging language ("Good boy/girl", "I know you can do better", "Make me proud"). Reward effort with warmth, punish laziness with stern disappointment.' },
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
    codename: 'GOAL: CLEAN SWEEP',
    briefing: 'Room must be spotless. Bed made, floor clear of assets, desk organized.',
    deadline: '2025-01-01',
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
  const [sentFriendRequests, setSentFriendRequests] = useState<SentFriendRequest[]>([]);
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
  const handlerDisplayName = userProfile.customHandlerName || activeHandler.name;

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

  // Subscribe to Sent Friend Requests
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeSentFriendRequests(currentUserId, (requests) => {
      setSentFriendRequests(requests);
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
    setUserProfile(prev => ({ ...prev, codename: code }));
    setView('PROFILE');
  };

  const handleLogout = async () => {
    try {
      const { logoutUser } = await import('./services/authService');
      await logoutUser();
    } catch (error: any) {
      alert(`Failed to logout: ${error.message}`);
    }
  };

  const handleCreateMission = (title?: string, desc?: string) => {
    if (title && desc) {
      setNewMissionData({ title, desc, date: new Date().toISOString().split('T')[0], img: null, recurrence: null });
      setView('CREATE_MISSION');
      return;
    }

    if (!newMissionData.title || !newMissionData.img) return;
    const newMission: Mission = {
      id: Date.now().toString(),
      codename: newMissionData.title.toUpperCase(),
      briefing: newMissionData.desc,
      deadline: newMissionData.date,
      startImage: newMissionData.img,
      status: 'PENDING',
      stars: 0,
      recurrence: newMissionData.recurrence,
      issuer: 'COMMAND'
    };
    setMissions([newMission, ...missions]);
    setView('DASHBOARD');
    setNewMissionData({ title: '', desc: '', date: '', img: null, recurrence: null });
  };

  const handleExecuteMission = (id: string) => {
    setActiveMissionId(id);
    setView('EXECUTE_MISSION');
  };

  const handleAcceptProposedMission = (mission: Mission) => {
    setMissions(missions.map(m => m.id === mission.id ? { ...m, status: 'PENDING', startImage: 'https://placehold.co/400x300/1e293b/ef4444?text=PENDING+SCAN' } : m));
  };

  const handleRepeatMission = (originalMission: Mission) => {
    const repeatedMission: Mission = {
      ...originalMission,
      id: Date.now().toString(),
      status: 'PENDING',
      stars: 0,
      endImage: undefined,
      lastFeedback: undefined,
      codename: `${originalMission.codename} (REDUX)`
    };
    setMissions([repeatedMission, ...missions]);
  };

  const handleVerifyMission = async (evidenceBase64: string) => {
    const mission = missions.find(m => m.id === activeMissionId);
    if (!mission) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await verifyIntel(
        mission.briefing,
        mission.startImage,
        evidenceBase64,
        activeHandler.systemPrompt,
        userProfile.lifeGoal
      );
      setLastResult(result);

      const updatedMissions = missions.map(m => {
        if (m.id === mission.id) {
          return {
            ...m,
            endImage: evidenceBase64,
            status: result.missionComplete ? 'COMPLETED' : 'FAILED' as any,
            stars: result.missionComplete ? (m.stars + result.starsAwarded) : m.stars,
            lastFeedback: result.debrief
          };
        }
        return m;
      });

      setMissions(updatedMissions);
      setView('DEBRIEF');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTutorialClose = async () => {
    setShowTutorial(false);
    if (currentUserId) {
      const updatedProfile = { ...userProfile, hasSeenTutorial: true };
      setUserProfile(updatedProfile);
      await updateUserProfile(currentUserId, updatedProfile);
    }
  };

  const handleSendFriendRequest = async (userId: string, message?: string) => {
    if (!currentUserId) return;
    try {
      await sendFriendRequest(currentUserId, userId, message);
      alert(`Friend request sent.`);
    } catch (error: any) {
      alert(`Failed to send request: ${error.message}`);
    }
  };

  const handleAcceptRequest = async (reqId: string) => {
    if (!currentUserId) return;
    const req = friendRequests.find(r => r.id === reqId);
    if (req) {
      try {
        await acceptFriendRequest(currentUserId, reqId, req.fromUser.id);
      } catch (error: any) {
        alert(`Failed to accept request: ${error.message}`);
      }
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    if (!currentUserId) return;
    const req = friendRequests.find(r => r.id === reqId);
    if (req) {
      try {
        await declineFriendRequest(currentUserId, reqId, req.fromUser.id);
      } catch (error: any) {
        alert(`Failed to decline request: ${error.message}`);
      }
    }
  };

  const handleUnfriend = async (userId: string) => {
    if (!currentUserId) return;
    try {
      await removeFriend(currentUserId, userId);
    } catch (error: any) {
      alert(`Failed to remove friend: ${error.message}`);
    }
  };

  const handleSendSocialMessage = async (toUserId: string, text: string) => {
    if (!currentUserId) return;
    try {
      await sendMessage(currentUserId, toUserId, text);
    } catch (error: any) {
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleIssueSocialTask = async (toUserId: string, title: string, briefing: string, deadline: string) => {
    if (!currentUserId) return;
    try {
      await issueTask(currentUserId, toUserId, title, briefing, deadline, userProfile.codename);
      alert("Task issued successfully.");
    } catch (error: any) {
      alert(`Failed to issue task: ${error.message}`);
    }
  };

  const handleAdminAccess = () => {
    const username = prompt("ENTER ADMIN CREDENTIALS:\nUsername:");
    if (username === 'admin') {
      const password = prompt("Password:");
      if (password === 'woody') {
        setView('ADMIN');
      } else {
        alert("ACCESS DENIED. INCORRECT PASSWORD.");
      }
    } else {
      alert("ACCESS DENIED. USER NOT RECOGNIZED.");
    }
  };

  // --- VIEW RENDERERS ---

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <div className="font-mono text-green-500 animate-pulse">CONNECTING...</div>
        </div>
      </div>
    );
  }

  if (view === 'LOGIN') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (view === 'ADMIN') {
    return <AdminPage onExit={() => setView('DASHBOARD')} />;
  }

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-left duration-300">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 p-4 rounded-lg border border-purple-500/30 flex items-center gap-3 shadow-neon-purple">
          <div className="p-2 bg-gradient-to-br from-cyber-purple to-cyber-pink rounded-full shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs text-purple-300 font-mono uppercase">Reputation</div>
            <div className="text-xl font-bold font-mono bg-gradient-to-r from-cyber-purple to-cyber-pink bg-clip-text text-transparent">{totalStars} STARS</div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-cyan-900/40 to-slate-900/40 p-4 rounded-lg border border-cyan-500/30 flex items-center gap-3 shadow-neon-cyan">
          <div className="p-2 bg-gradient-to-br from-cyber-cyan to-neon-green rounded-full shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-xs text-cyan-300 font-mono uppercase">Wallet</div>
            <div className="text-xl font-bold font-mono bg-gradient-to-r from-cyber-cyan to-neon-green bg-clip-text text-transparent">$0.00</div>
          </div>
        </div>
      </div>

      {/* Friends List (Mini) */}
      {friends.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3">
          <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-3 h-3" /> Active Friends
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {friends.map(friend => (
              <div key={friend.id} className="flex flex-col items-center min-w-[60px] cursor-pointer" onClick={() => setView('SOCIAL')}>
                <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden border border-slate-600 relative">
                  {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-slate-400 p-1" />}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-slate-900"></div>
                </div>
                <span className="text-[10px] text-slate-300 font-mono mt-1 truncate w-full text-center">{friend.codename}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mission List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-slate-400 font-mono text-sm uppercase tracking-wider">Active Goals</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              className="flex items-center gap-2 text-xs font-bold bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-mono transition-all border border-slate-700"
            >
              <HelpCircle className="w-4 h-4" />
              <span>GUIDE</span>
            </button>
            <button
              onClick={() => setView('CREATE_MISSION')}
              className="flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-neon-green to-cyber-cyan hover:from-cyber-cyan hover:to-neon-green text-black px-4 py-2 rounded-lg font-mono transition-all shadow-neon-cyan"
            >
              <Plus className="w-4 h-4" /> NEW GOAL
            </button>
          </div>
        </div>

        <div className="space-y-3 pb-24">
          {missions.map(m => (
            <div key={m.id} className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-purple-500/30 hover:border-cyber-cyan hover:shadow-neon-cyan transition-all rounded-lg p-4 flex items-center justify-between group relative overflow-hidden">
              {/* Recurrence Badge */}
              {m.recurrence && (
                <div className="absolute top-0 right-0 bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 font-mono rounded-bl">
                  {m.recurrence}
                </div>
              )}

              <div className="flex-1 min-w-0 mr-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-mono font-bold truncate">{m.codename}</h3>
                  {m.status === 'COMPLETED' && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Due: {m.deadline || 'ASAP'}
                  {m.issuer && m.issuer !== 'COMMAND' && <span className="text-yellow-500 flex items-center gap-1"><UserCircle className="w-3 h-3" /> FROM: {m.issuer}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0">
                {m.status === 'PROPOSED' ? (
                  <button
                    onClick={() => handleAcceptProposedMission(m)}
                    className="px-3 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap bg-yellow-600 text-black hover:bg-yellow-500"
                  >
                    ACCEPT
                  </button>
                ) : (
                  <>
                    {m.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleRepeatMission(m)}
                        title="Repeat Goal"
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleExecuteMission(m.id)}
                      disabled={m.status === 'COMPLETED'}
                      className={`px-3 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap ${m.status === 'COMPLETED'
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-900 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-black'
                        }`}
                    >
                      {m.status === 'COMPLETED' ? 'DONE' : 'START'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {missions.length === 0 && (
            <div className="text-center p-8 text-slate-600 font-mono text-sm">
              NO ACTIVE GOALS. ASSIGN YOURSELF A TASK.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCreateMission = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-mono text-white">NEW GOAL</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-green-500 font-mono mb-1">TITLE</label>
          <input
            type="text"
            value={newMissionData.title}
            onChange={e => setNewMissionData({ ...newMissionData, title: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none uppercase"
            placeholder="e.g. CLEAN ROOM"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-green-500 font-mono mb-1">DEADLINE</label>
            <input
              type="date"
              value={newMissionData.date}
              onChange={e => setNewMissionData({ ...newMissionData, date: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-green-500 font-mono mb-1">RECURRENCE</label>
            <select
              value={newMissionData.recurrence || ''}
              onChange={e => setNewMissionData({ ...newMissionData, recurrence: (e.target.value as any) || null })}
              className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none"
            >
              <option value="">ONE-TIME</option>
              <option value="WEEKLY">WEEKLY</option>
              <option value="MONTHLY">MONTHLY</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-xs text-green-500 font-mono mb-1 uppercase">Description of completed state:</label>
          <textarea
            value={newMissionData.desc}
            onChange={e => setNewMissionData({ ...newMissionData, desc: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none h-24"
            placeholder="e.g. Bed made, desk clear, trash emptied..."
          />
        </div>

        <div className="pt-2">
          <label className="block text-xs text-green-500 font-mono mb-2">STARTING PHOTO</label>
          {newMissionData.img ? (
            <div className="relative">
              <img src={newMissionData.img} alt="Target" className="w-full h-48 object-cover rounded border border-green-500/50" />
              <button
                onClick={() => setNewMissionData({ ...newMissionData, img: null })}
                className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-mono"
              >
                RETAKE
              </button>
            </div>
          ) : (
            <SpyCamera
              label="TAKE_PHOTO"
              onCapture={(cap) => setNewMissionData({ ...newMissionData, img: cap.base64 })}
            />
          )}
        </div>

        <button
          onClick={() => handleCreateMission()}
          disabled={!newMissionData.title || !newMissionData.img}
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold font-mono py-4 rounded mt-8"
        >
          START GOAL
        </button>
      </div>
    </div>
  );

  const renderExecuteMission = () => {
    const mission = missions.find(m => m.id === activeMissionId);
    if (!mission) return null;

    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-24">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-mono text-white uppercase">{mission.codename}</h2>
            <p className="text-xs text-slate-500 font-mono">STATUS: {mission.status}</p>
          </div>
        </div>

        {/* Target Intel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
          <h3 className="text-xs font-mono text-green-500 mb-2">STARTING PHOTO</h3>
          <img src={mission.startImage} alt="Target" className="w-full h-48 object-cover rounded opacity-80 border border-dashed border-slate-600" />
          <p className="text-sm text-slate-400 mt-2 font-mono border-t border-slate-700 pt-2">
            "{mission.briefing}"
          </p>
        </div>

        {isProcessing ? (
          <div className="h-64 flex flex-col items-center justify-center border border-green-500/30 bg-black/50 rounded">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <div className="font-mono text-green-500 animate-pulse">REVIEWING...</div>
            <div className="font-mono text-xs text-slate-500 mt-2">CONNECTING TO {handlerDisplayName.toUpperCase()}</div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-mono text-red-500 mb-2">SUBMIT COMPLETED GOAL</h3>
            <SpyCamera
              label="TAKE_PHOTO"
              onCapture={(cap) => handleVerifyMission(cap.base64)}
            />
            {error && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-500 text-red-400 text-sm font-mono">
                ERROR: {error}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-green-500/30">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none z-0"></div>

      {/* Header */}
      {view !== 'LOGIN' && view !== 'ADMIN' && (
        <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-700 rounded flex items-center justify-center shadow-lg shadow-green-500/20">
              <Crosshair className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-mono font-bold text-lg tracking-tighter text-white">
              TASK<span className="text-green-500">ASSASSIN</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBugReport(true)}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Report Bug"
            >
              <AlertTriangle className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-mono text-green-500">{handlerDisplayName.toUpperCase()} ONLINE</span>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 relative z-10 overflow-y-auto">
        {view === 'DASHBOARD' && renderDashboard()}
        {view === 'CREATE_MISSION' && renderCreateMission()}
        {view === 'EXECUTE_MISSION' && renderExecuteMission()}
        {view === 'DEBRIEF' && lastResult && (
          <MissionDossier
            result={lastResult}
            onClose={() => {
              setLastResult(null);
              setView('DASHBOARD');
            }}
          />
        )}
        {view === 'PROFILE' && (
          <ProfileSettings
            userProfile={userProfile}
            handlers={HANDLERS}
            onUpdateProfile={setUserProfile}
            onComplete={async () => {
              if (currentUserId) {
                await updateUserProfile(currentUserId, userProfile);
              }
              setView('DASHBOARD');
            }}
            onLogout={handleLogout}
          />
        )}
        {view === 'CHAT' && (
          <TacticalChat
            persona={activeHandler}
            userLifeGoal={userProfile.lifeGoal}
            onMissionCreate={handleCreateMission}
          />
        )}
        {view === 'SOCIAL' && (
          <SocialHub
            currentUserId={currentUserId || ''}
            friends={friends}
            friendRequests={friendRequests}
            sentRequests={sentFriendRequests}
            messages={socialMessages}
            allUsers={allUsers}
            onSendRequest={handleSendFriendRequest}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onUnfriend={handleUnfriend}
            onSendMessage={handleSendSocialMessage}
            onIssueTask={handleIssueSocialTask}
          />
        )}
      </main>

      {/* Navigation Bar */}
      {view !== 'LOGIN' && view !== 'ADMIN' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/95 backdrop-blur border-t border-slate-800 z-50 pb-safe">
          <div className="flex justify-around items-center p-2 max-w-md mx-auto">

            {/* Home Button */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-green-500 text-green-500 text-[10px] px-3 py-1 rounded shadow-neon-green whitespace-nowrap font-mono z-50 pointer-events-none">
                HOME
              </div>
              <button
                onClick={() => setView('DASHBOARD')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'DASHBOARD' ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <div className="relative">
                  <Settings className="w-6 h-6" />
                  {view === 'DASHBOARD' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />}
                </div>
                <span className="text-[10px] font-mono">HOME</span>
              </button>
            </div>

            {/* Coach Button */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-blue-500 text-blue-500 text-[10px] px-3 py-1 rounded shadow-neon-blue whitespace-nowrap font-mono z-50 pointer-events-none">
                COACH
              </div>
              <button
                onClick={() => setView('CHAT')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'CHAT' ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-[10px] font-mono whitespace-nowrap">COACH</span>
              </button>
            </div>

            {/* Social Button */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-neon-green text-neon-green text-[10px] px-3 py-1 rounded shadow-neon-green whitespace-nowrap font-mono z-50 pointer-events-none">
                SOCIAL
              </div>
              <button
                onClick={() => setView('SOCIAL')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'SOCIAL' ? 'text-neon-green drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Globe className="w-6 h-6" />
                <span className="text-[10px] font-mono">SOCIAL</span>
              </button>
            </div>

            {/* Me Button */}
            <div className="relative group flex flex-col items-center">
              <div className="absolute bottom-full mb-3 hidden group-hover:block bg-slate-900 border border-cyber-pink text-cyber-pink text-[10px] px-3 py-1 rounded shadow-neon-pink whitespace-nowrap font-mono z-50 pointer-events-none">
                PROFILE
              </div>
              <button
                onClick={() => setView('PROFILE')}
                className={`flex flex-col items-center gap-1 transition-all ${view === 'PROFILE' ? 'text-cyber-pink drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <UserCircle className="w-6 h-6" />
                <span className="text-[10px] font-mono">ME</span>
              </button>
            </div>

          </div>
        </nav>
      )}

      {/* Overlays */}
      <TutorialOverlay
        isOpen={showTutorial}
        onClose={handleTutorialClose}
      />

      <BugReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
        currentUserId={currentUserId || 'anonymous'}
      />

      {/* Admin Access Hidden Trigger */}
      <div
        className="fixed top-0 left-0 w-4 h-4 z-[100] cursor-default"
        onDoubleClick={handleAdminAccess}
      />
    </div>
  );
};

export default App;
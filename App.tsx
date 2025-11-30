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
  const [sentTasks, setSentTasks] = useState<Mission[]>([]);
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
  const [showProgressDashboard, setShowProgressDashboard] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Gamification State
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  // Sorting State
  const [sortFilter, setSortFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROPOSED' | 'SENT'>('ALL');

  const totalStars = missions.reduce((acc, m) => acc + m.stars, 0);
  const activeHandler = HANDLERS.find(h => h.id === userProfile.handlerId) || HANDLERS[0];
  const handlerDisplayName = userProfile.customHandlerName || activeHandler.name;

  // Filter missions based on sortFilter
  const filteredMissions = sortFilter === 'SENT' ? sentTasks : missions.filter(m => {
    if (sortFilter === 'ALL') return true;
    return m.status === sortFilter;
  });

  // Firebase Authentication Listener
  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // Subscribe to user profile in real-time
        profileUnsubscribe = subscribeUserProfile(user.uid, (profile) => {
          if (profile) {
            setUserProfile(profile);
            if (profile.hasSeenTutorial === false) {
              setShowTutorial(true);
            }
            // Only switch view if we are in LOGIN (initial load)
            setIsLoadingAuth(prev => {
              if (prev) setView('DASHBOARD');
              return false;
            });
          } else {
            // New user, needs to set up profile
            setUserProfile({ codename: user.displayName || '', handlerId: '1', lifeGoal: '', hasSeenTutorial: false });
            setIsLoadingAuth(prev => {
              if (prev) setView('PROFILE');
              return false;
            });
          }
        });

      } else {
        setCurrentUserId(null);
        setUserProfile({ codename: '', handlerId: '1', lifeGoal: '' });
        setView('LOGIN');
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
        setIsLoadingAuth(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
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

  // Subscribe to all users for search/recommendations
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeAllUsers(currentUserId, (users) => {
      setAllUsers(users);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Subscribe to Assigned Tasks
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeTasks(currentUserId, (tasks) => {
      // Replace missions with server state
      setMissions(tasks);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Subscribe to Sent Tasks
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeSentTasks(currentUserId, (tasks) => {
      setSentTasks(tasks);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  // Subscribe to User Stats
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = subscribeUserStats(currentUserId, (stats) => {
      setUserStats(stats);
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

  const handleCreateMission = async (title?: string, desc?: string) => {
    if (title && desc) {
      setNewMissionData({ title, desc, date: new Date().toISOString().split('T')[0].replace(/^\d{4}/, '2025'), img: null, recurrence: null });
      setView('CREATE_MISSION');
      return;
    }

    if (!newMissionData.title || !newMissionData.img) return;

    if (currentUserId) {
      try {
        await issueTask(
          currentUserId,
          currentUserId,
          newMissionData.title,
          newMissionData.desc || newMissionData.title,
          newMissionData.date,
          'SELF',
          'PENDING',
          newMissionData.img || undefined
        );
      } catch (e: any) {
        alert('Failed to save mission: ' + e.message);
        return;
      }
    } else {
      const newMission: Mission = {
        id: Date.now().toString(),
        codename: newMissionData.title,
        briefing: newMissionData.desc || newMissionData.title,
        deadline: newMissionData.date,
        startImage: newMissionData.img,
        status: 'PENDING',
        stars: 0,
        recurrence: newMissionData.recurrence,
        issuer: 'SELF'
      };
      setMissions(prev => [...prev, newMission]);
    }

    setView('DASHBOARD');
    setNewMissionData({ title: '', desc: '', date: '', img: null, recurrence: null });
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

      const updates = {
        endImage: evidenceBase64,
        status: result.missionComplete ? 'COMPLETED' : 'FAILED',
        stars: result.missionComplete ? (mission.stars + result.starsAwarded) : mission.stars,
        lastFeedback: result.debrief
      };

      if (currentUserId) {
        await updateTask(currentUserId, mission.id, updates);

        if (result.missionComplete) {
          const newAchievements = await updateStatsOnTaskCompletion(currentUserId, result.starsAwarded);
          celebrate(result.starsAwarded, soundEnabled, newAchievements, false);
        }
      } else {
        const updatedMissions = missions.map(m => {
          if (m.id === mission.id) {
            return { ...m, ...updates } as Mission;
          }
          return m;
        });
        setMissions(updatedMissions);
        if (result.missionComplete) celebrate(result.starsAwarded, soundEnabled, [], false);
      }

      setView('DEBRIEF');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteMission = (missionId: string) => {
    setActiveMissionId(missionId);
    setView('EXECUTE_MISSION');
  };

  const handleDeleteTask = async (mission: Mission) => {
    if (!confirm('Delete this mission?')) return;
    if (currentUserId) {
      await deleteTask(currentUserId, mission.id);
    } else {
      setMissions(prev => prev.filter(m => m.id !== mission.id));
    }
  };

  const handleRepeatMission = async (mission: Mission) => {
    const updates = { status: 'PENDING', endImage: null, lastFeedback: null };
    if (currentUserId) {
      await updateTask(currentUserId, mission.id, updates);
    } else {
      setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, ...updates } as Mission : m));
    }
  };

  const handleAcceptProposedMission = async (mission: Mission) => {
    const updates = { status: 'PENDING' };
    if (currentUserId) {
      await updateTask(currentUserId, mission.id, updates);
    } else {
      setMissions(prev => prev.map(m => m.id === mission.id ? { ...m, ...updates } as Mission : m));
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

      if (view === 'ADMIN') {
        return <AdminPage />;
      }

      const renderDashboard = () => (
        <div className="space-y-6 pb-24 animate-in slide-in-from-left duration-300">
          {/* User Profile Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-xl font-mono shadow-neon-green">
                {userProfile.codename ? userProfile.codename.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">{userProfile.codename || 'AGENT UNKNOWN'}</h2>
                <p className="text-xs text-slate-400 font-mono">{userProfile.lifeGoal || 'NO LIFE GOAL SET'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProgressDashboard(true)}
                className="p-2 text-slate-500 hover:text-blue-400 transition-colors hover:bg-slate-800 rounded-full"
                title="View Progress"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="p-2 text-slate-500 hover:text-yellow-400 transition-colors hover:bg-slate-800 rounded-full"
                title="View Leaderboard"
              >
                <Trophy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/40 p-4 rounded-lg border border-purple-500/30 flex items-center gap-3 shadow-neon-purple">
              <div className="p-2 bg-gradient-to-br from-cyber-purple to-cyber-pink rounded-full shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-purple-300 font-mono uppercase">Level {userStats?.level || 1}</div>
                <div className="text-xl font-bold font-mono bg-gradient-to-r from-cyber-purple to-cyber-pink bg-clip-text text-transparent">{totalStars} STARS</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-900/40 to-slate-900/40 p-4 rounded-lg border border-orange-500/30 flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-full shadow-lg">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-orange-300 font-mono uppercase">Streak</div>
                <div className="text-xl font-bold font-mono bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{userStats?.currentStreak || 0} DAYS</div>
              </div>
            </div>
          </div>

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

            {/* Sorting Controls */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar">
              <button
                onClick={() => setSortFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${sortFilter === 'ALL' ? 'bg-green-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                ALL
              </button>
              <button
                onClick={() => setSortFilter('PENDING')}
                className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${sortFilter === 'PENDING' ? 'bg-green-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                EXECUTE
              </button>
              <button
                onClick={() => setSortFilter('COMPLETED')}
                className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${sortFilter === 'COMPLETED' ? 'bg-green-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                COMPLETED
              </button>
              <button
                onClick={() => setSortFilter('FAILED')}
                className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${sortFilter === 'FAILED' ? 'bg-green-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                FAILED
              </button>
              <button
                onClick={() => setSortFilter('SENT')}
                className={`px-3 py-1 rounded-full text-xs font-mono whitespace-nowrap transition-colors ${sortFilter === 'SENT' ? 'bg-green-500 text-black font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                SENT
              </button>
            </div>

            <div className="space-y-4">
              {filteredMissions.map(m => (
                <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between group hover:border-green-500/30 transition-all shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`w-12 h-12 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 border ${m.status === 'COMPLETED' ? 'border-green-500/50 text-green-500' : 'border-slate-700 text-slate-500'}`}>
                      {m.status === 'COMPLETED' ? <Check className="w-6 h-6" /> : <Crosshair className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-mono font-bold truncate ${m.status === 'COMPLETED' ? 'text-green-500 line-through' : 'text-white'}`}>{m.codename}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                        <span className={m.status === 'PENDING' ? 'text-yellow-500' : m.status === 'COMPLETED' ? 'text-green-500' : 'text-red-500'}>
                          {m.status}
                        </span>
                        <span>•</span>
                        <span>{m.deadline}</span>
                        {m.recurrence && (
                          <>
                            <span>•</span>
                            <span className="text-blue-400 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> {m.recurrence}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.status === 'PROPOSED' ? (
                      <button
                        onClick={() => handleAcceptProposedMission(m)}
                        className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold font-mono shadow-neon-green"
                      >
                        ACCEPT
                      </button>
                    ) : (
                      <>
                        {m.status === 'COMPLETED' && sortFilter !== 'SENT' && (
                          <button
                            onClick={() => handleRepeatMission(m)}
                            title="Repeat Goal"
                            className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {sortFilter !== 'SENT' && (
                          <button
                            onClick={() => handleExecuteMission(m.id)}
                            disabled={m.status === 'COMPLETED'}
                            className={`px-3 py-2 rounded text-xs font-mono font-bold flex items-center gap-2 whitespace-nowrap transition-all ${m.status === 'COMPLETED'
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-900 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-black shadow-neon-green'
                              }`}
                          >
                            {m.status === 'COMPLETED' ? 'DONE' : 'START'}
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteTask(m)}
                          title="Delete Goal"
                          className="p-2 bg-slate-800 hover:bg-red-900/50 text-slate-500 hover:text-red-500 rounded border border-transparent hover:border-red-500/30 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filteredMissions.length === 0 && (
              <div className="text-center p-8 text-slate-600 font-mono text-sm border border-dashed border-slate-800 rounded-lg mt-4">
                NO GOALS FOUND.
              </div>
            )}
          </div>
        </div>
      );

      const renderCreateMission = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-24">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-mono text-white tracking-wide">NEW GOAL</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-green-500 font-mono mb-1">TITLE</label>
              <input
                type="text"
                value={newMissionData.title}
                onChange={e => setNewMissionData({ ...newMissionData, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none uppercase placeholder:text-slate-600"
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
                className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none h-24 placeholder:text-slate-600"
                placeholder="e.g. Bed made, desk clear, trash emptied..."
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs text-green-500 font-mono mb-2">STARTING PHOTO</label>
              {newMissionData.img ? (
                <div className="relative group">
                  <img src={newMissionData.img} alt="Target" className="w-full h-48 object-cover rounded border border-green-500/50" />
                  <button
                    onClick={() => setNewMissionData({ ...newMissionData, img: null })}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 rounded font-mono shadow-lg transition-colors"
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
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-black font-bold font-mono py-4 rounded mt-8 transition-all shadow-neon-green disabled:shadow-none"
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
              <button onClick={() => setView('DASHBOARD')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-lg font-mono text-white uppercase tracking-wide">{mission.codename}</h2>
                <p className="text-xs text-slate-500 font-mono">STATUS: <span className="text-yellow-500">{mission.status}</span></p>
              </div>
            </div>

            {/* Target Intel */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-10">
                <Crosshair className="w-24 h-24 text-green-500" />
              </div>
              <h3 className="text-xs font-mono text-green-500 mb-2 uppercase tracking-wider">Target Intel</h3>
              <img src={mission.startImage} alt="Target" className="w-full h-48 object-cover rounded opacity-80 border border-dashed border-slate-600 mb-3" />
              <p className="text-sm text-slate-300 font-mono border-t border-slate-700 pt-3 italic">
                "{mission.briefing}"
              </p>
            </div>

            {isProcessing ? (
              <div className="h-64 flex flex-col items-center justify-center border border-green-500/30 bg-black/50 rounded backdrop-blur-sm">
                <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4 shadow-neon-green"></div>
                <div className="font-mono text-green-500 animate-pulse text-lg">ANALYZING INTEL...</div>
              </div>
            ) : (
              <div>
                <h3 className="text-xs font-mono text-red-500 mb-2 uppercase tracking-wider">Submit Evidence</h3>
                <SpyCamera
                  label="TAKE_PHOTO"
                  onCapture={(cap) => handleVerifyMission(cap.base64)}
                />
                {error && (
                  <div className="mt-4 p-4 bg-red-900/20 border border-red-500/50 rounded text-red-400 text-sm font-mono flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>ERROR: {error}</span>
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
            <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
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

                {/* NOTIFICATION CENTER */}
                {currentUserId && <NotificationCenter userId={currentUserId} />}

                <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-green-500 hidden sm:inline">{handlerDisplayName.toUpperCase()} ONLINE</span>
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
                mission={missions.find(m => m.id === activeMissionId)}
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
                onAddMission={handleCreateMission}
              />
            )}
            {view === 'SOCIAL' && (
              <SocialHub
                userProfile={userProfile}
                currentUserId={currentUserId || ''}
                friends={friends}
                requests={friendRequests}
                sentRequests={sentFriendRequests}
                messages={socialMessages}
                mockUsers={allUsers}
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

          {/* Gamification Modals */}
          {showProgressDashboard && currentUserId && (
            <ProgressDashboard
              userId={currentUserId}
              onClose={() => setShowProgressDashboard(false)}
            />
          )}

          {showLeaderboard && currentUserId && (
            <Leaderboard
              userId={currentUserId}
              friendIds={friends.map(f => f.id)}
              onClose={() => setShowLeaderboard(false)}
            />
          )}

          {/* Admin Access Hidden Trigger */}
          <div
            className="fixed top-0 left-0 w-4 h-4 z-[100] cursor-default"
            onDoubleClick={handleAdminAccess}
          />
        </div>
      );
    };

    export default App;
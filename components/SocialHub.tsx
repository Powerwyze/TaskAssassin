import React, { useState, useEffect, useRef } from 'react';
import { SocialUser, FriendRequest, SocialMessage, UserProfile } from '../types';
import { Users, Search, UserPlus, MessageSquare, Shield, Check, X, Send, ArrowLeft, User } from 'lucide-react';
import { subscribeMessages } from '../services/socialService';

interface SocialHubProps {
    userProfile: UserProfile;
    currentUserId: string;
    friends: SocialUser[];
    requests: FriendRequest[];
    mockUsers: SocialUser[]; // Potential friends to search
    messages: SocialMessage[]; // Deprecated, kept for backward compatibility
    onSendRequest: (userId: string) => void;
    onAcceptRequest: (requestId: string) => void;
    onDeclineRequest: (requestId: string) => void;
    onUnfriend: (userId: string) => void;
    onSendMessage: (toUserId: string, text: string) => void;
    onIssueTask: (toUserId: string, title: string, briefing: string, deadline: string) => void;
}

type SocialView = 'LIST' | 'CHAT' | 'ISSUE_TASK';
type ListTab = 'ALLIES' | 'WIRE' | 'SEARCH';

const SocialHub: React.FC<SocialHubProps> = ({
    userProfile, currentUserId, friends, requests, mockUsers,
    onSendRequest, onAcceptRequest, onDeclineRequest, onUnfriend, onSendMessage, onIssueTask
}) => {
    const [view, setView] = useState<SocialView>('LIST');
    const [activeTab, setActiveTab] = useState<ListTab>('ALLIES');
    const [selectedUser, setSelectedUser] = useState<SocialUser | null>(null);
    const [chatInput, setChatInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Chat messages for current conversation (real-time)
    const [chatMessages, setChatMessages] = useState<SocialMessage[]>([]);

    // Task Issue State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskBriefing, setTaskBriefing] = useState('');
    const [taskDeadline, setTaskDeadline] = useState('');
    const [issueSuccess, setIssueSuccess] = useState(false);

    // Subscribe to messages when chat is opened
    useEffect(() => {
        if (view === 'CHAT' && selectedUser && currentUserId) {
            const unsubscribe = subscribeMessages(currentUserId, selectedUser.id, (messages) => {
                setChatMessages(messages);
            });

            return () => unsubscribe();
        }
    }, [view, selectedUser, currentUserId]);

    // Auto-scroll chat
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages, view]);

    const handleChatOpen = (user: SocialUser) => {
        setSelectedUser(user);
        setView('CHAT');
    };

    const handleTaskOpen = (user: SocialUser) => {
        setSelectedUser(user);
        setTaskTitle('');
        setTaskBriefing('');
        setTaskDeadline(new Date().toISOString().split('T')[0]);
        setIssueSuccess(false);
        setView('ISSUE_TASK');
    };

    const handleSendMessage = () => {
        if (!selectedUser || !chatInput.trim()) return;
        onSendMessage(selectedUser.id, chatInput);
        setChatInput('');
    };

    const handleIssueTask = () => {
        if (!selectedUser || !taskTitle || !taskBriefing || !taskDeadline) return;
        onIssueTask(selectedUser.id, taskTitle, taskBriefing, taskDeadline);
        setIssueSuccess(true);
        setTimeout(() => {
            setView('LIST');
            setSelectedUser(null);
        }, 1500);
    };

    // --- RENDERERS ---

    const renderUserList = () => {
        if (activeTab === 'ALLIES') {
            if (friends.length === 0) {
                return <div className="p-8 text-center text-slate-500 font-mono text-sm">NO ALLIES IN NETWORK. SEARCH FOR AGENTS.</div>;
            }
            return (
                <div className="space-y-3">
                    {friends.map(friend => (
                        <div key={friend.id} className="bg-slate-800 border border-slate-700 p-4 rounded flex items-center justify-between group animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden border border-green-500/30">
                                    {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <User className="p-2 w-full h-full text-slate-400" />}
                                </div>
                                <div>
                                    <div className="text-green-400 font-mono font-bold">{friend.codename}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">STATUS: {friend.status}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleChatOpen(friend)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-green-500 transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleTaskOpen(friend)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-yellow-500 transition-colors" title="Issue Task">
                                    <Shield className="w-4 h-4" />
                                </button>
                                <button onClick={() => onUnfriend(friend.id)} className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'WIRE') {
            if (requests.length === 0) {
                return <div className="p-8 text-center text-slate-500 font-mono text-sm">NO PENDING TRANSMISSIONS.</div>;
            }
            return (
                <div className="space-y-3">
                    {requests.map(req => (
                        <div key={req.id} className="bg-slate-800 border border-yellow-500/30 p-4 rounded flex items-center justify-between animate-in slide-in-from-right">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-700 rounded-full overflow-hidden">
                                    {req.fromUser.avatar ? <img src={req.fromUser.avatar} className="w-full h-full object-cover" /> : <User className="p-2 w-full h-full text-slate-400" />}
                                </div>
                                <div>
                                    <div className="text-white font-mono font-bold text-sm">{req.fromUser.codename}</div>
                                    <div className="text-[10px] text-yellow-500 font-mono">WANTS TO CONNECT</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onAcceptRequest(req.id)} className="p-2 bg-green-600 text-black rounded hover:bg-green-500">
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeclineRequest(req.id)} className="p-2 bg-red-900/50 text-red-400 rounded hover:bg-red-900">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (activeTab === 'SEARCH') {
            // Filter users by search query (case-insensitive) and exclude current friends
            const filteredUsers = mockUsers.filter(u =>
                !friends.find(f => f.id === u.id) &&
                u.codename.toLowerCase().includes(searchQuery.toLowerCase())
            );

            return (
                <div className="space-y-3">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="SEARCH AGENT DB..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded py-2 pl-10 pr-4 text-sm font-mono text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mb-2 uppercase">
                        {searchQuery ? `Search Results (${filteredUsers.length})` : 'All Agents'}
                    </div>
                    {filteredUsers.length === 0 && searchQuery && (
                        <div className="p-8 text-center text-slate-500 font-mono text-sm">
                            NO AGENTS FOUND MATCHING "{searchQuery}"
                        </div>
                    )}
                    {filteredUsers.map(user => (
                        <div key={user.id} className="bg-slate-800/50 border border-slate-700 p-3 rounded flex items-center justify-between animate-in slide-in-from-bottom-1">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-700 rounded-full overflow-hidden">
                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <User className="p-2 w-full h-full text-slate-400" />}
                                </div>
                                <div className="text-slate-300 font-mono text-sm">{user.codename}</div>
                            </div>
                            {requests.find(r => r.fromUser.id === user.id) ? (
                                <span className="text-[10px] text-yellow-500 font-mono">PENDING</span>
                            ) : (
                                <button onClick={() => onSendRequest(user.id)} className="p-1.5 bg-slate-700 hover:bg-green-600 hover:text-black text-green-500 rounded transition-colors">
                                    <UserPlus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            );
        }
    };

    if (view === 'CHAT' && selectedUser) {
        return (
            <div className="flex flex-col h-[calc(100vh-180px)] pb-24 animate-in fade-in">
                <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-4">
                    <button onClick={() => setView('LIST')} className="hover:bg-slate-800 p-2 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <div className="w-8 h-8 bg-slate-700 rounded-full overflow-hidden">
                        {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" /> : <User className="p-2 w-full h-full text-slate-400" />}
                    </div>
                    <div>
                        <div className="text-green-500 font-mono font-bold">{selectedUser.codename}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SECURE CONNECTION</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-2 custom-scrollbar">
                    {chatMessages.length === 0 && <div className="text-center text-slate-600 font-mono text-xs mt-10">ENCRYPTION KEYS EXCHANGED. START TYPING.</div>}
                    {chatMessages.map(msg => {
                        const isMe = msg.fromId === currentUserId;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded font-mono text-sm ${isMe ? 'bg-green-900/20 border border-green-500/50 text-green-100' : 'bg-slate-800 border border-slate-700 text-slate-300'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        )
                    })}
                    <div ref={chatEndRef} />
                </div>

                <div className="mt-4 flex gap-2">
                    <input
                        className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 font-mono text-sm text-white focus:border-green-500 focus:outline-none"
                        placeholder="Message..."
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage} className="bg-slate-800 text-green-500 p-3 rounded hover:bg-green-600 hover:text-black transition-colors">
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'ISSUE_TASK' && selectedUser) {
        if (issueSuccess) {
            return (
                <div className="h-full flex flex-col items-center justify-center pb-24 animate-in zoom-in">
                    <Check className="w-16 h-16 text-green-500 mb-4 animate-bounce" />
                    <h3 className="text-xl font-mono text-white font-bold">TRANSMISSION SENT</h3>
                    <p className="text-slate-500 font-mono text-sm mt-2">Contract issued to {selectedUser.codename}</p>
                </div>
            );
        }

        return (
            <div className="pb-24 animate-in slide-in-from-right">
                <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-400 hover:text-white font-mono text-sm mb-6">
                    <ArrowLeft className="w-4 h-4" /> CANCEL TRANSMISSION
                </button>

                <h2 className="text-lg font-mono text-white mb-1">ISSUE CONTRACT</h2>
                <p className="text-xs text-slate-500 font-mono mb-6">TARGET AGENT: <span className="text-green-500">{selectedUser.codename}</span></p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-green-500 font-mono mb-1">MISSION CODENAME</label>
                        <input
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none uppercase"
                            placeholder="OPERATION: DISHES"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-green-500 font-mono mb-1">DEADLINE</label>
                        <input
                            type="date"
                            value={taskDeadline}
                            onChange={e => setTaskDeadline(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-green-500 font-mono mb-1">BRIEFING / REQUIREMENTS</label>
                        <textarea
                            value={taskBriefing}
                            onChange={e => setTaskBriefing(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none h-32"
                            placeholder="Detail the requirements for success..."
                        />
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded text-xs font-mono text-yellow-500/80">
                        WARNING: ISSUING TASKS CONSUMES SOCIAL CREDIT. ENSURE AGENT IS CAPABLE.
                    </div>

                    <button
                        onClick={handleIssueTask}
                        disabled={!taskTitle || !taskBriefing || !taskDeadline}
                        className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold font-mono py-4 rounded flex items-center justify-center gap-2 mt-4"
                    >
                        <Shield className="w-5 h-5" /> AUTHORIZE CONTRACT
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 animate-in fade-in">
            {/* TABS */}
            <div className="flex border-b border-slate-700 mb-4">
                {(['ALLIES', 'WIRE', 'SEARCH'] as ListTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 font-mono text-xs font-bold transition-colors relative ${activeTab === tab ? 'text-green-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {tab}
                        {tab === 'WIRE' && requests.length > 0 && (
                            <span className="absolute top-2 right-4 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        )}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"></div>
                        )}
                    </button>
                ))}
            </div>

            {renderUserList()}
        </div>
    );
};

export default SocialHub;
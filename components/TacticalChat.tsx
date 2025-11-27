import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, HandlerPersona } from '../types';
import { Send, Bot, User as UserIcon, PlusCircle, Loader } from 'lucide-react';
import { consultTacticalComputer } from '../services/geminiService';

interface TacticalChatProps {
  persona: HandlerPersona;
  userLifeGoal: string;
  onAddMission: (title: string, desc: string) => void;
}

const TacticalChat: React.FC<TacticalChatProps> = ({ persona, userLifeGoal, onAddMission }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      sender: 'HANDLER',
      text: `Secure line established. This is ${persona.name}. What's something about you that you want to improve?`
    }
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'USER', text: input };
    const updatedHistory = [...messages, userMsg];

    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const result = await consultTacticalComputer(updatedHistory, persona.systemPrompt, userLifeGoal);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'HANDLER',
        text: result.response,
        suggestedMissions: result.suggestedMissions
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'HANDLER',
        text: "Connection disrupted. Encryption key invalid."
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border ${msg.sender === 'USER' ? 'bg-slate-800 border-slate-600' : 'bg-green-900/20 border-green-500'
                }`}>
                {msg.sender === 'USER' ? <UserIcon className="w-4 h-4 text-slate-400" /> : <Bot className="w-4 h-4 text-green-500" />}
              </div>

              <div className="space-y-2 w-full">
                <div className={`p-3 rounded-lg text-sm font-mono leading-relaxed ${msg.sender === 'USER' ? 'bg-slate-700 text-white' : 'bg-black border border-green-900 text-green-400'
                  }`}>
                  {msg.text}
                </div>

                {msg.suggestedMissions && msg.suggestedMissions.length > 0 && (
                  <div className="bg-slate-800/50 border border-green-500/30 rounded p-3 animate-in zoom-in duration-300">
                    <div className="text-xs text-slate-400 mb-2 uppercase tracking-wider border-b border-slate-700 pb-1">Available Contracts</div>
                    <div className="space-y-3">
                      {msg.suggestedMissions.map((mission, idx) => (
                        <div key={idx} className="bg-slate-900/80 p-3 rounded border border-slate-700">
                          <div className="font-bold text-white font-mono mb-1 text-sm">{mission.title}</div>
                          <div className="text-xs text-slate-500 mb-3">{mission.briefing}</div>
                          <button
                            onClick={() => onAddMission(mission.title, mission.briefing)}
                            className="w-full bg-green-600 hover:bg-green-500 text-black text-[10px] font-bold py-2 rounded flex items-center justify-center gap-2 font-mono uppercase"
                          >
                            <PlusCircle className="w-3 h-3" /> Accept
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 items-center p-2">
              <div className="w-8 h-8 rounded-full bg-green-900/20 border border-green-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center gap-1 text-green-500 font-mono text-xs">
                <Loader className="w-3 h-3 animate-spin" /> DECRYPTING RESPONSE...
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type orders or ask for intel..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="bg-slate-800 hover:bg-green-600 hover:text-black text-green-500 border border-slate-700 p-3 rounded transition-colors disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TacticalChat;
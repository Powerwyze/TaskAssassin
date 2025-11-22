import React, { useRef } from 'react';
import { HandlerPersona, UserProfile } from '../types';
import { User, ChevronRight, LogOut, ArrowRight, Camera } from 'lucide-react';

interface ProfileSettingsProps {
  userProfile: UserProfile;
  handlers: HandlerPersona[];
  onUpdateProfile: (profile: UserProfile) => void;
  onComplete: () => void;
  onLogout: () => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ userProfile, handlers, onUpdateProfile, onComplete, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ ...userProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-24">
      <h2 className="text-xl font-mono text-white mb-4 border-b border-slate-700 pb-2">AGENT PROFILE</h2>
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex items-center gap-4">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 border-2 border-slate-600 overflow-hidden relative">
            {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <User className="w-10 h-10" />
            )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
            </div>
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
        </div>

        <div>
          <div className="text-xs text-slate-500 font-mono">CODENAME</div>
          <div className="text-xl text-white font-mono font-bold">{userProfile.codename}</div>
          <div className="text-xs text-green-500 font-mono mt-1">CLEARANCE: LEVEL 1</div>
        </div>
      </div>

      {/* Life Goal Section */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-green-500 font-mono uppercase tracking-wider">
           I'm trying to improve my life in this way:
        </label>
        <textarea
          value={userProfile.lifeGoal}
          onChange={(e) => onUpdateProfile({ ...userProfile, lifeGoal: e.target.value })}
          placeholder="e.g. I want to stop procrastinating, I want to impress my date, I want to build discipline..."
          className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white font-mono focus:border-green-500 focus:outline-none text-sm h-24"
        />
        <p className="text-[10px] text-slate-500 font-mono">
          * This data will be used by your Handler to motivate you.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-mono text-slate-400 mb-3 uppercase tracking-wider">Select Handler Personality</h3>
        <div className="space-y-2 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {handlers.map((h) => (
            <button
              key={h.id}
              onClick={() => onUpdateProfile({ ...userProfile, handlerId: h.id })}
              className={`w-full p-4 rounded border text-left transition-all relative group ${
                userProfile.handlerId === h.id 
                  ? 'bg-green-900/20 border-green-500' 
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-mono font-bold ${userProfile.handlerId === h.id ? 'text-green-400' : 'text-white'}`}>
                  {h.name}
                </span>
                {userProfile.handlerId === h.id && <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>}
              </div>
              <p className="text-xs text-slate-500 font-mono leading-relaxed">{h.description}</p>
              {userProfile.handlerId !== h.id && (
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={onComplete}
        className="w-full bg-green-600 hover:bg-green-500 text-black font-bold font-mono py-4 rounded shadow-[0_0_15px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2"
      >
        CONFIRM CREDENTIALS & ENTER <ArrowRight className="w-4 h-4" />
      </button>

      <button 
        onClick={onLogout}
        className="w-full border border-red-900/50 text-red-500 p-4 rounded font-mono text-sm hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> DISCONNECT SESSION
      </button>
    </div>
  );
};

export default ProfileSettings;
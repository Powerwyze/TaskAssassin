import React, { useState } from 'react';
import { Fingerprint, Scan, ShieldCheck, UserPlus } from 'lucide-react';
import { loginUser, registerUser } from '../services/authService';

interface LoginScreenProps {
  onLogin: (codename: string) => void;
}

type AuthMode = 'LOGIN' | 'REGISTER';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codename, setCodename] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'LOGIN') {
      if (!email.trim() || !password.trim()) {
        setError('All fields required');
        return;
      }
    } else {
      if (!email.trim() || !password.trim() || !codename.trim()) {
        setError('All fields required');
        return;
      }
    }

    setIsScanning(true);

    try {
      if (mode === 'LOGIN') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, codename);
      }

      setAccessGranted(true);
      // The auth state listener in App.tsx will handle navigation
    } catch (err: any) {
      setIsScanning(false);
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated gradient background effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyber-purple via-cyber-cyan to-neon-green opacity-30 animate-pulse-slow"></div>
        <div className="absolute inset-0"
             style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(6, 182, 212, .2) 25%, rgba(6, 182, 212, .2) 26%, transparent 27%, transparent 74%, rgba(168, 85, 247, .2) 75%, rgba(168, 85, 247, .2) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(16, 185, 129, .2) 25%, rgba(16, 185, 129, .2) 26%, transparent 27%, transparent 74%, rgba(236, 72, 153, .2) 75%, rgba(236, 72, 153, .2) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
        </div>
      </div>

      <div className="max-w-sm w-full space-y-8 z-10">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-slate-900 to-purple-900 rounded-full border-2 border-cyber-cyan flex items-center justify-center relative shadow-neon-cyan animate-pulse-slow">
             {accessGranted ? (
               <ShieldCheck className="w-10 h-10 text-neon-green animate-bounce drop-shadow-[0_0_10px_rgba(16,185,129,1)]" />
             ) : isScanning ? (
               <Scan className="w-10 h-10 text-cyber-cyan animate-spin drop-shadow-[0_0_10px_rgba(6,182,212,1)]" />
             ) : (
               <Fingerprint className="w-10 h-10 text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
             )}
             {isScanning && <div className="absolute inset-0 border-4 border-cyber-purple rounded-full animate-ping opacity-40"></div>}
          </div>
          <h1 className="text-3xl font-mono font-bold tracking-tighter bg-gradient-to-r from-cyber-cyan via-neon-green to-cyber-purple bg-clip-text text-transparent">
            TASK<span className="bg-gradient-to-r from-cyber-pink to-cyber-purple bg-clip-text text-transparent">ASSASSIN</span>
          </h1>
          <p className="text-purple-400 font-mono text-xs tracking-[0.2em]">SECURE TERMINAL LOGIN</p>
        </div>

        {!accessGranted ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMode('LOGIN')}
                className={`flex-1 py-2 font-mono text-xs rounded ${
                  mode === 'LOGIN'
                    ? 'bg-green-600 text-black'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                LOGIN
              </button>
              <button
                type="button"
                onClick={() => setMode('REGISTER')}
                className={`flex-1 py-2 font-mono text-xs rounded ${
                  mode === 'REGISTER'
                    ? 'bg-green-600 text-black'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                NEW AGENT
              </button>
            </div>

            {/* Email Field */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:opacity-100"></div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="EMAIL ADDRESS"
                className="relative w-full bg-slate-900 text-green-500 font-mono placeholder-slate-600 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:opacity-100"></div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PASSWORD"
                className="relative w-full bg-slate-900 text-green-500 font-mono placeholder-slate-600 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Codename Field (Registration Only) */}
            {mode === 'REGISTER' && (
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:opacity-100"></div>
                <input
                  type="text"
                  value={codename}
                  onChange={(e) => setCodename(e.target.value.toUpperCase())}
                  placeholder="AGENT CODENAME"
                  className="relative w-full bg-slate-900 text-green-500 font-mono placeholder-slate-600 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-green-500 uppercase tracking-wider"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg text-center font-mono text-xs">
                ERROR: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isScanning}
              className="w-full bg-gradient-to-r from-neon-green via-cyber-cyan to-cyber-purple hover:from-cyber-purple hover:via-cyber-cyan hover:to-neon-green text-white font-bold font-mono py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-neon-cyan"
            >
              {isScanning
                ? 'VERIFYING BIOMETRICS...'
                : mode === 'LOGIN'
                ? 'INITIATE SESSION'
                : 'REGISTER AGENT'}
            </button>
          </form>
        ) : (
          <div className="bg-gradient-to-r from-neon-green/10 to-cyber-cyan/10 border border-neon-green text-neon-green p-4 rounded-lg text-center font-mono animate-in zoom-in duration-300 shadow-neon-green">
            <p className="text-lg font-bold">ACCESS GRANTED</p>
            <p className="text-sm mt-2">WELCOME, AGENT</p>
            <p className="text-xs mt-4 animate-pulse">LOADING MISSION DATA...</p>
          </div>
        )}

        <div className="text-center text-[10px] text-slate-600 font-mono fixed bottom-6 left-0 right-0">
          UNAUTHORIZED ACCESS IS A FEDERAL CRIME<br/>
          SYS.SEC.LEVEL: 5 (TOP SECRET)
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
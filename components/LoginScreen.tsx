import React, { useState, useEffect } from 'react';
import { Fingerprint, Scan, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (codename: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [codename, setCodename] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codename.trim()) return;
    
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setAccessGranted(true);
      setTimeout(() => {
        onLogin(codename);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Matrix background effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
      </div>

      <div className="max-w-sm w-full space-y-8 z-10">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-slate-900 rounded-full border-2 border-green-500 flex items-center justify-center relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
             {accessGranted ? (
               <ShieldCheck className="w-10 h-10 text-green-400 animate-bounce" />
             ) : isScanning ? (
               <Scan className="w-10 h-10 text-green-500 animate-spin" />
             ) : (
               <Fingerprint className="w-10 h-10 text-slate-500" />
             )}
             {isScanning && <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-20"></div>}
          </div>
          <h1 className="text-3xl font-mono font-bold text-white tracking-tighter">
            TASK<span className="text-green-500">ASSASSIN</span>
          </h1>
          <p className="text-slate-500 font-mono text-xs tracking-[0.2em]">SECURE TERMINAL LOGIN</p>
        </div>

        {!accessGranted ? (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-teal-600 rounded-lg blur opacity-25 group-focus-within:opacity-75 transition duration-1000 group-hover:opacity-100"></div>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value.toUpperCase())}
                placeholder="ENTER AGENT CODENAME"
                className="relative w-full bg-slate-900 text-green-500 font-mono placeholder-slate-600 border border-slate-700 rounded-lg p-4 text-center focus:outline-none focus:border-green-500 uppercase tracking-wider"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!codename || isScanning}
              className="w-full bg-green-600 hover:bg-green-500 text-black font-bold font-mono py-3 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(22,163,74,0.5)]"
            >
              {isScanning ? 'VERIFYING BIOMETRICS...' : 'INITIATE SESSION'}
            </button>
          </form>
        ) : (
          <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-lg text-center font-mono animate-in zoom-in duration-300">
            <p className="text-lg font-bold">ACCESS GRANTED</p>
            <p className="text-sm mt-2">WELCOME BACK, AGENT {codename}</p>
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
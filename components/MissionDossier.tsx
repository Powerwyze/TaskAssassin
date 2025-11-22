import React from 'react';
import { Mission, MissionResult } from '../types';
import { CheckCircle, AlertTriangle, Star, ShieldAlert } from 'lucide-react';

interface MissionDossierProps {
  mission: Mission;
  result: MissionResult;
}

const MissionDossier: React.FC<MissionDossierProps> = ({ mission, result }) => {
  return (
    <div className="w-full bg-slate-800 border border-green-500/30 rounded-lg overflow-hidden shadow-2xl">
      <div className="bg-slate-900 p-4 border-b border-green-500/30 flex justify-between items-center">
        <h2 className="font-mono text-xl text-green-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          MISSION DEBRIEF
        </h2>
        <span className="text-xs text-slate-500 font-mono">{new Date().toISOString()}</span>
      </div>

      <div className="p-6 space-y-6">
        
        {/* Status Banner */}
        <div className={`p-4 border-l-4 ${result.missionComplete ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-2xl font-black font-mono uppercase ${result.missionComplete ? 'text-green-400' : 'text-red-500'}`}>
                {result.missionComplete ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
              </div>
              <div className="text-slate-400 text-sm font-mono mt-1">
                CODENAME: {mission.codename}
              </div>
            </div>
            <div className="flex gap-1">
               {[...Array(3)].map((_, i) => (
                 <Star 
                  key={i}
                  className={`w-6 h-6 ${i < result.starsAwarded ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'}`} 
                />
               ))}
            </div>
          </div>
        </div>

        {/* Handler Message */}
        <div className="font-mono text-sm bg-black p-4 rounded border border-slate-700 text-green-500 leading-relaxed">
          <span className="text-slate-500 mr-2">{`> HANDLER:`}</span>
          {result.debrief}
          <span className="animate-pulse ml-1">_</span>
        </div>

        {/* Tactical Advice */}
        {result.tacticalAdvice.length > 0 && (
          <div className="bg-slate-900/50 p-4 rounded border border-slate-700">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Tactical Analysis</h4>
            <ul className="space-y-2">
              {result.tacticalAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 font-mono">
                  <span className="text-yellow-500 mt-0.5">⚠</span>
                  {advice}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Evidence Comparison */}
        <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="relative group">
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 font-mono rounded">BEFORE</div>
                <img src={mission.startImage} alt="Ref" className="w-full h-32 object-cover rounded border border-slate-600 opacity-70 grayscale group-hover:grayscale-0 transition-all" />
            </div>
            <div className="relative group">
                <div className="absolute top-2 left-2 bg-red-900/70 text-white text-[10px] px-2 py-0.5 font-mono rounded">AFTER</div>
                {mission.endImage && (
                    <img src={mission.endImage} alt="Evd" className="w-full h-32 object-cover rounded border border-slate-600" />
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default MissionDossier;
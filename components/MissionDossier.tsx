import React from 'react';
import { Mission, MissionResult } from '../types';
import { CheckCircle, AlertTriangle, Star, ShieldAlert, ArrowRight } from 'lucide-react';

interface MissionDossierProps {
  mission?: Mission;
  result: MissionResult;
  onClose: () => void;
}

const MissionDossier: React.FC<MissionDossierProps> = ({ mission, result, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-green-500/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(34,197,94,0.2)]">
        <div className="bg-slate-950 p-4 border-b border-green-500/30 flex justify-between items-center">
          <h2 className="font-mono text-xl text-green-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            GOAL REVIEW
          </h2>
          <span className="text-xs text-slate-500 font-mono">{new Date().toISOString().split('T')[0].replace(/^\d{4}/, '2025')}</span>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">

          {/* Status Banner */}
          <div className={`p - 4 border - l - 4 ${result.missionComplete ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'} `}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text - 2xl font - black font - mono uppercase ${result.missionComplete ? 'text-green-400' : 'text-red-500'} `}>
                  {result.missionComplete ? 'GOAL COMPLETED' : 'GOAL FAILED'}
                </div>
                {mission && (
                  <div className="text-slate-400 text-sm font-mono mt-1">
                    TITLE: {mission.codename}
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w - 6 h - 6 ${i < result.starsAwarded ? 'text-yellow-400 fill-yellow-400' : 'text-slate-800'} `}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Handler Message */}
          <div className="font-mono text-sm bg-black p-4 rounded border border-slate-800 text-green-500 leading-relaxed shadow-inner">
            <span className="text-slate-500 mr-2">{`> COACH: `}</span>
            {result.debrief}
            <span className="animate-pulse ml-1">_</span>
          </div>

          {/* Tactical Advice */}
          {result.tacticalAdvice.length > 0 && (
            <div className="bg-slate-900/50 p-4 rounded border border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Feedback</h4>
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
          {mission && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative group">
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 font-mono rounded">BEFORE</div>
                <img src={mission.startImage} alt="Ref" className="w-full h-32 object-cover rounded border border-slate-700 opacity-70 grayscale group-hover:grayscale-0 transition-all" />
              </div>
              <div className="relative group">
                <div className="absolute top-2 left-2 bg-green-900/70 text-white text-[10px] px-2 py-0.5 font-mono rounded">AFTER</div>
                {mission.endImage && (
                  <img src={mission.endImage} alt="Evd" className="w-full h-32 object-cover rounded border border-green-500/30" />
                )}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono py-4 rounded border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            CONTINUE <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </div>
    </div>
  );
};

export default MissionDossier;
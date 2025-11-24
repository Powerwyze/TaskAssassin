import React from 'react';
import { X, Shield, Crosshair, MessageSquare, Globe, DollarSign, Camera, Plus } from 'lucide-react';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-green-500 rounded-lg max-w-lg w-full p-6 relative shadow-[0_0_50px_rgba(34,197,94,0.2)] max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-mono font-bold text-green-500 mb-6 text-center">
                    MISSION BRIEFING
                </h2>

                <div className="space-y-6 font-mono text-sm text-slate-300">

                    {/* How to Make a Task */}
                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <Plus className="w-6 h-6 text-cyber-purple" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">CREATE CONTRACTS</h3>
                            <p>Use the <span className="text-cyber-purple">NEW MISSION</span> button or visit the <span className="text-cyber-purple">TASK MAKER</span> to generate missions. Define your objective and set a deadline.</p>
                        </div>
                    </div>

                    {/* How to Complete a Task */}
                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <Camera className="w-6 h-6 text-cyber-cyan" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">EXECUTE & VERIFY</h3>
                            <p>Select a mission and click <span className="text-cyber-cyan">EXECUTE</span>. Upload a photo of your completed work. Our AI Handler will analyze the evidence and verify your success.</p>
                        </div>
                    </div>

                    {/* How to Issue a Task */}
                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <Globe className="w-6 h-6 text-neon-green" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">ISSUE SOCIAL CONTRACTS</h3>
                            <p>Go to the <span className="text-neon-green">NETWORK</span> tab. Add friends and issue them tasks with deadlines. Hold them accountable for their missions.</p>
                        </div>
                    </div>

                    {/* Money Feature (Future) */}
                    <div className="flex gap-4 border-t border-slate-700 pt-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <DollarSign className="w-6 h-6 text-yellow-500" />
                        </div>
                        <div>
                            <h3 className="text-yellow-500 font-bold mb-1">FUTURE UPDATE: BOUNTIES</h3>
                            <p className="text-slate-400 italic">
                                "Mercenaries get paid."
                            </p>
                            <p className="mt-1">
                                A future update will introduce real-world rewards. You will be able to earn money for successfully completing verified tasks. Stay tuned.
                            </p>
                        </div>
                    </div>

                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-green-600 hover:bg-green-500 text-black font-bold font-mono py-3 rounded mt-8"
                >
                    ACKNOWLEDGE
                </button>
            </div>
        </div>
    );
};

export default TutorialOverlay;

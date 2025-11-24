import React from 'react';
import { X, Shield, Crosshair, MessageSquare, Globe } from 'lucide-react';

interface TutorialOverlayProps {
    onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-green-500 rounded-lg max-w-lg w-full p-6 relative shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-mono font-bold text-green-500 mb-6 text-center">
                    WELCOME TO TASK ASSASSIN
                </h2>

                <div className="space-y-6 font-mono text-sm text-slate-300">
                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <Shield className="w-6 h-6 text-cyber-cyan" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">OPS (OPERATIONS)</h3>
                            <p>Your main dashboard. View active contracts, execute missions, and track your reputation.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <MessageSquare className="w-6 h-6 text-cyber-purple" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">TASK MAKER</h3>
                            <p>Chat with your Handler to generate new missions based on your goals.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="p-3 bg-slate-800 rounded h-fit">
                            <Globe className="w-6 h-6 text-neon-green" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-1">NETWORK</h3>
                            <p>Connect with other agents. Issue contracts to friends and hold them accountable.</p>
                        </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-center mt-8">
                        <p className="text-green-400 font-bold">COMPLETE MISSIONS. EARN STARS. DOMINATE CHAOS.</p>
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

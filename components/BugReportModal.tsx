import React, { useState } from 'react';
import { X, AlertTriangle, Send } from 'lucide-react';
import { reportBug } from '../services/socialService';

interface BugReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserId: string;
}

const BugReportModal: React.FC<BugReportModalProps> = ({ isOpen, onClose, currentUserId }) => {
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!description.trim()) return;

        setIsSubmitting(true);
        try {
            await reportBug(currentUserId, description);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setDescription('');
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Failed to report bug:', error);
            alert('Failed to transmit report. Systems compromised?');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-slate-900 border border-red-500/50 rounded-lg max-w-md w-full p-6 relative shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4 text-red-500">
                    <AlertTriangle className="w-6 h-6" />
                    <h2 className="text-lg font-mono font-bold">REPORT SYSTEM FAILURE</h2>
                </div>

                {success ? (
                    <div className="text-center py-8 text-green-500 font-mono">
                        <p>REPORT TRANSMITTED SUCCESSFULLY.</p>
                        <p className="text-xs mt-2 text-slate-500">Engineering team notified.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-slate-400 font-mono text-xs mb-4">
                            Describe the glitch or anomaly encountered. Be specific.
                        </p>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-white font-mono text-sm focus:border-red-500 focus:outline-none h-32 mb-4"
                            placeholder="e.g. Mission upload failed with error code..."
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !description.trim()}
                            className="w-full bg-red-900/50 hover:bg-red-900 border border-red-500/50 text-red-200 font-mono py-3 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'TRANSMITTING...' : <><Send className="w-4 h-4" /> SUBMIT REPORT</>}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default BugReportModal;

import React, { useState, useEffect } from 'react';
import { subscribeBugReports } from '../services/socialService';
import { ArrowLeft, Bug, CheckCircle, Clock } from 'lucide-react';

interface AdminPageProps {
    onExit: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ onExit }) => {
    const [reports, setReports] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = subscribeBugReports((data) => {
            // Sort by timestamp descending
            const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
            setReports(sorted);
        });
        return () => unsubscribe();
    }, []);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-mono p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-900/20 rounded text-red-500">
                            <Bug className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-red-500">ADMIN CONSOLE // BUG REPORTS</h1>
                    </div>
                    <button
                        onClick={onExit}
                        className="flex items-center gap-2 text-slate-500 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" /> EXIT
                    </button>
                </div>

                <div className="space-y-4">
                    {reports.length === 0 && (
                        <div className="text-center py-12 text-slate-600">
                            NO ACTIVE REPORTS. SYSTEMS NOMINAL.
                        </div>
                    )}

                    {reports.map(report => (
                        <div key={report.id} className="bg-slate-900 border border-slate-800 p-4 rounded hover:border-slate-700 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${report.status === 'OPEN' ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
                                        }`}>
                                        {report.status}
                                    </span>
                                    <span className="text-xs text-slate-500">ID: {report.id}</span>
                                </div>
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(report.timestamp).toLocaleString()}
                                </div>
                            </div>

                            <p className="text-slate-300 mb-3">{report.description}</p>

                            <div className="text-xs text-slate-600 border-t border-slate-800 pt-2 flex justify-between">
                                <span>REPORTER: {report.reporterId}</span>
                                {/* Future: Add buttons to resolve/close tickets */}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminPage;

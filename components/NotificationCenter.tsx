import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Radio } from 'lucide-react';
import { Notification } from '../types';
import { markAsRead, deleteNotification, clearAllNotifications } from '../services/notificationService';
import { setupPushNotifications } from '../services/pwaService';

interface NotificationCenterProps {
    userId: string;
    notifications: Notification[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId, notifications }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.read) {
            await markAsRead(userId, notification.id);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteNotification(userId, id);
    };

    const handleClearAll = async () => {
        if (confirm("Clear all notifications?")) {
            await clearAllNotifications(userId);
        }
    };

    const handleEnablePush = async () => {
        const sub = await setupPushNotifications();
        if (sub) {
            alert("Push notifications enabled! (Mock)");
        } else {
            // It might return null if permission denied or error, or if we just logged it (as per current implementation)
            // In a real app we would check permission state
            if (Notification.permission === 'granted') {
                alert("Notifications are enabled.");
            } else {
                alert("Could not enable notifications. Check browser settings.");
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-sm">NOTIFICATIONS</h3>
                            <button onClick={handleEnablePush} title="Enable Push Notifications" className="text-slate-400 hover:text-green-500">
                                <Radio size={14} />
                            </button>
                        </div>
                        {notifications.length > 0 && (
                            <button onClick={handleClearAll} className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1">
                                <Trash2 size={12} /> Clear All
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No new intel, Agent.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-700">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-3 hover:bg-slate-700/50 transition-colors cursor-pointer group ${!notification.read ? 'bg-slate-700/20 border-l-2 border-green-500' : ''
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <h4 className={`text-sm font-medium ${!notification.read ? 'text-white' : 'text-slate-400'}`}>
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <span className="text-[10px] text-slate-500 mt-2 block">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </span>
                                            </div>

                                            <button
                                                onClick={(e) => handleDelete(e, notification.id)}
                                                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


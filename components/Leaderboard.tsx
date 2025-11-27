import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Star } from 'lucide-react';
import { getFriendsLeaderboard } from '../services/gamificationService';

interface Props {
  userId: string;
  friendIds: string[];
  onClose: () => void;
}

interface LeaderboardEntry {
  uid: string;
  codename: string;
  totalStars: number;
  level: number;
  currentStreak: number;
}

export const Leaderboard: React.FC<Props> = ({ userId, friendIds, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [userId, friendIds]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getFriendsLeaderboard(userId, friendIds);
    setLeaderboard(data);
    setLoading(false);
  };

  const getRankColor = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-orange-500';
    if (index === 1) return 'from-gray-300 to-gray-400';
    if (index === 2) return 'from-orange-700 to-orange-900';
    return 'from-slate-700 to-slate-800';
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-400" size={24} />;
    if (index === 1) return <Medal className="text-gray-300" size={24} />;
    if (index === 2) return <Medal className="text-orange-700" size={24} />;
    return <span className="text-gray-400 font-bold">#{index + 1}</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-lg p-6 max-w-2xl w-full my-8 border border-cyber-purple/30 shadow-neon-purple">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyber-cyan">
            <Trophy className="inline-block mr-2" size={28} />
            Leaderboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="text-center text-cyber-cyan py-8">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Add friends to see the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.uid === userId;
              const rankColor = getRankColor(index);

              return (
                <div
                  key={entry.uid}
                  className={`bg-gradient-to-r ${rankColor} rounded-lg p-4 border ${
                    isCurrentUser
                      ? 'border-cyber-cyan shadow-neon-cyan scale-105'
                      : 'border-transparent'
                  } transition-all`}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-12 flex justify-center">
                      {getRankIcon(index)}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isCurrentUser ? 'text-cyber-cyan' : 'text-white'}`}>
                          {entry.codename}
                        </span>
                        {isCurrentUser && (
                          <span className="text-xs bg-cyber-cyan text-slate-900 px-2 py-0.5 rounded-full font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="flex items-center gap-1 text-yellow-300">
                          <Star size={14} />
                          {entry.totalStars}
                        </span>
                        <span className="text-gray-300">
                          Lv. {entry.level}
                        </span>
                        {entry.currentStreak > 0 && (
                          <span className="flex items-center gap-1 text-orange-400">
                            <Flame size={14} />
                            {entry.currentStreak}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">
                        {entry.totalStars}
                      </div>
                      <div className="text-xs text-gray-300">stars</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={loadLeaderboard}
          className="mt-6 w-full bg-gradient-to-r from-cyber-purple to-cyber-pink text-white font-bold py-3 rounded-lg hover:shadow-neon-purple transition-all"
        >
          Refresh Leaderboard
        </button>
      </div>
    </div>
  );
};

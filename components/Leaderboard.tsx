import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Star, ChevronDown, ChevronUp, Target, Award, Calendar, TrendingUp } from 'lucide-react';
import { getFriendsLeaderboard, LeaderboardEntry } from '../services/gamificationService';

interface Props {
  userId: string;
  friendIds: string[];
  onClose: () => void;
}

export const Leaderboard: React.FC<Props> = ({ userId, friendIds, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [userId, friendIds]);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFriendsLeaderboard(userId, friendIds);
      setLeaderboard(data);
    } catch (error: any) {
      console.error("Error loading leaderboard:", error);
      setError("Failed to load leaderboard. Please try again.");
    } finally {
      setLoading(false);
    }
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
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>Add friends to see the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const isCurrentUser = entry.uid === userId;
              const rankColor = getRankColor(index);
              const isExpanded = expandedId === entry.uid;
              const xpToNextLevel = 100 - (entry.xp % 100);
              const xpProgress = (entry.xp % 100) / 100 * 100;

              return (
                <div
                  key={entry.uid}
                  className={`bg-gradient-to-r ${rankColor} rounded-lg p-4 border ${isCurrentUser
                    ? 'border-cyber-cyan shadow-neon-cyan scale-105'
                    : 'border-transparent'
                    } transition-all`}
                >
                  <div
                    className="flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.uid)}
                  >
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
                      <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
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
                        <span className="flex items-center gap-1 text-blue-300">
                          <Target size={14} />
                          {entry.totalTasksCompleted}
                        </span>
                        <span className="flex items-center gap-1 text-purple-300">
                          <Award size={14} />
                          {entry.achievementsUnlocked}
                        </span>
                      </div>
                    </div>

                    {/* Score & Expand */}
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {entry.totalStars}
                        </div>
                        <div className="text-xs text-gray-300">stars</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="text-gray-400" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-400" size={20} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                      {/* XP Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-gray-300 mb-1">
                          <span>Level Progress</span>
                          <span>{xpToNextLevel} XP to Level {entry.level + 1}</span>
                        </div>
                        <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink transition-all"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Detailed Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Total Tasks */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-blue-300 mb-1">
                            <Target size={16} />
                            <span className="text-xs font-medium">Total Tasks</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.totalTasksCompleted}
                          </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-purple-300 mb-1">
                            <Award size={16} />
                            <span className="text-xs font-medium">Achievements</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.achievementsUnlocked} / 10
                          </div>
                        </div>

                        {/* Current Streak */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-orange-400 mb-1">
                            <Flame size={16} />
                            <span className="text-xs font-medium">Current Streak</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.currentStreak} {entry.currentStreak === 1 ? 'day' : 'days'}
                          </div>
                        </div>

                        {/* Longest Streak */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-red-400 mb-1">
                            <TrendingUp size={16} />
                            <span className="text-xs font-medium">Best Streak</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.longestStreak} {entry.longestStreak === 1 ? 'day' : 'days'}
                          </div>
                        </div>

                        {/* Weekly Completions */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-300 mb-1">
                            <Calendar size={16} />
                            <span className="text-xs font-medium">This Week</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.weeklyCompletions}
                          </div>
                        </div>

                        {/* Monthly Completions */}
                        <div className="bg-black/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-cyan-300 mb-1">
                            <Calendar size={16} />
                            <span className="text-xs font-medium">This Month</span>
                          </div>
                          <div className="text-xl font-bold text-white">
                            {entry.monthlyCompletions}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

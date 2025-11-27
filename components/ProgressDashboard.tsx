import React, { useEffect, useState } from 'react';
import { UserStats, Achievement } from '../types';
import { subscribeUserStats, getUserAchievements } from '../services/gamificationService';
import { Flame, Star, TrendingUp, Award, Target } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

export const ProgressDashboard: React.FC<Props> = ({ userId, onClose }) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeUserStats(userId, (updatedStats) => {
      setStats(updatedStats);
      setLoading(false);
    });

    getUserAchievements(userId).then(setAchievements);

    return () => unsubscribe();
  }, [userId]);

  if (loading || !stats) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="text-center text-cyber-cyan">Loading stats...</div>
        </div>
      </div>
    );
  }

  const xpToNextLevel = ((stats.level) * 100) - stats.xp;
  const xpProgress = (stats.xp % 100);

  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col border border-cyber-purple/30 shadow-neon-purple">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h2 className="text-2xl font-bold text-cyber-cyan">
            <TrendingUp className="inline-block mr-2" size={28} />
            Progress Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Streak */}
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 text-center">
              <Flame className="mx-auto mb-2 text-orange-400" size={32} />
              <div className="text-3xl font-bold text-orange-400">{stats.currentStreak}</div>
              <div className="text-sm text-gray-300">Day Streak</div>
              <div className="text-xs text-gray-400 mt-1">Best: {stats.longestStreak}</div>
            </div>

            {/* Level */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
              <Award className="mx-auto mb-2 text-purple-400" size={32} />
              <div className="text-3xl font-bold text-purple-400">{stats.level}</div>
              <div className="text-sm text-gray-300">Level</div>
              <div className="text-xs text-gray-400 mt-1">{xpToNextLevel} XP to next</div>
            </div>

            {/* Total Tasks */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-4 text-center">
              <Target className="mx-auto mb-2 text-cyan-400" size={32} />
              <div className="text-3xl font-bold text-cyber-cyan">{stats.totalTasksCompleted}</div>
              <div className="text-sm text-gray-300">Tasks Done</div>
              <div className="text-xs text-gray-400 mt-1">This week: {stats.weeklyCompletions}</div>
            </div>

            {/* Total Stars */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-4 text-center">
              <Star className="mx-auto mb-2 text-yellow-400" size={32} />
              <div className="text-3xl font-bold text-yellow-400">{stats.totalStars}</div>
              <div className="text-sm text-gray-300">Total Stars</div>
              <div className="text-xs text-gray-400 mt-1">⭐⭐⭐</div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-300">Level {stats.level}</span>
              <span className="text-cyber-cyan">{stats.xp} XP</span>
              <span className="text-gray-300">Level {stats.level + 1}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-cyber-purple/30">
              <div
                className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h3 className="text-xl font-bold text-neon-green mb-4">
              Achievements ({unlockedAchievements.length}/{achievements.length})
            </h3>

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm text-gray-400 mb-3">Unlocked</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {unlockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-3 shadow-neon-green"
                    >
                      <div className="text-3xl mb-2">{achievement.icon}</div>
                      <div className="text-sm font-bold text-neon-green">{achievement.name}</div>
                      <div className="text-xs text-gray-300">{achievement.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {lockedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm text-gray-400 mb-3">Locked</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {lockedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-slate-800/50 border border-gray-700 rounded-lg p-3 opacity-60"
                    >
                      <div className="text-3xl mb-2 grayscale">{achievement.icon}</div>
                      <div className="text-sm font-bold text-gray-400">{achievement.name}</div>
                      <div className="text-xs text-gray-500">{achievement.description}</div>
                      <div className="text-xs text-cyber-cyan mt-2">
                        {achievement.currentProgress}/{achievement.requirement}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

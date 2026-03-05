import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, TrendingUp, ArrowRightLeft } from 'lucide-react';
import { usersApi } from '../services/dataService';
import type { LeaderboardEntry } from '../types';

const PERIODS = ['All Time', 'Monthly', 'Weekly'] as const;

const podiumConfig = [
  { place: 2, height: 'h-20 sm:h-24 md:h-28', color: 'from-gray-400 to-gray-500', label: '2nd', delay: 0.2 },
  { place: 1, height: 'h-24 sm:h-30 md:h-36', color: 'from-amber-400 to-yellow-500', label: '1st', delay: 0 },
  { place: 3, height: 'h-16 sm:h-20 md:h-24', color: 'from-orange-600 to-amber-700', label: '3rd', delay: 0.3 },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('All Time');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = { limit: '50' };
        if (period !== 'All Time') params.period = period.toLowerCase();
        const res = await usersApi.getLeaderboard(params);
        const d = res.data.data;
        setEntries(Array.isArray(d) ? d : (d as any)?.users || []);
      } catch { }
      setLoading(false);
    })();
  }, [period]);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-display text-3xl md:text-4xl text-white mb-2">Leaderboard</h1>
          <p className="text-sm text-[var(--text-2)]">Top alchemists ranked by reputation</p>
        </motion.div>
      </div>

      {/* Period tabs */}
      <div className="flex justify-center gap-2">
        {PERIODS.map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-5 py-2 rounded-lg text-xs font-medium transition-all ${period === p ? 'bg-[var(--accent)] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-white'}`}>
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex justify-center gap-4 items-end h-48 sm:h-56 md:h-64">
            {[1, 2, 3].map(i => <div key={i} className="skeleton w-24 sm:w-32 h-32 sm:h-40 rounded-t-xl" />)}
          </div>
          {Array(5).fill(0).map((_, i) => <div key={i} className="glass-card p-4 skeleton h-16" />)}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Trophy size={48} className="mx-auto mb-4 text-[var(--text-3)]" />
          <h3 className="text-display text-lg text-white mb-2">No data yet</h3>
          <p className="text-sm text-[var(--text-3)]">Complete exchanges to appear on the leaderboard</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex justify-center items-end gap-2 sm:gap-3 md:gap-6 h-56 sm:h-64 md:h-72 px-2 sm:px-4">
              {podiumConfig.map(({ place, height, color, label, delay }) => {
                const entry = top3[place - 1];
                if (!entry) return null;
                return (
                  <motion.div key={place} initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay, type: 'spring', stiffness: 120 }}
                    className="flex flex-col items-center">
                    {/* Avatar */}
                    <div className="relative mb-3">
                      {place === 1 && <Crown size={24} className="text-amber-400 absolute -top-7 left-1/2 -translate-x-1/2 drop-shadow-lg" />}
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-lg sm:text-xl md:text-2xl font-bold text-white font-display shadow-lg`}>
                        {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                      </div>
                    </div>
                    <span className="text-sm font-display font-bold text-white mb-0.5">{entry.firstName}</span>
                    <span className="text-xs text-[var(--text-3)] mb-2">{entry.reputationScore} pts</span>
                    {/* Podium bar */}
                    <div className={`w-20 sm:w-24 md:w-32 ${height} rounded-t-xl bg-gradient-to-t ${color} relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-white/5" />
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-lg font-display font-bold text-white/80">{label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-2">
            {(top3.length < 3 ? entries : rest).map((entry, i) => {
              const rank = top3.length < 3 ? i + 1 : i + 4;
              return (
                <motion.div key={entry.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="glass-card p-4 flex items-center gap-4 group hover:border-[var(--accent)]/20 transition-colors">
                  <div className="w-8 h-8 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-[var(--text-3)]">#{rank}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-sm font-bold text-white">
                    {entry.firstName.charAt(0)}{entry.lastName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{entry.firstName} {entry.lastName}</div>
                    {entry.university && <div className="text-[10px] text-[var(--text-3)]">{entry.university}</div>}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-[var(--accent)]">{entry.reputationScore}</div>
                      <div className="text-[9px] text-[var(--text-3)] uppercase">Rep</div>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="text-sm font-mono text-white">{entry.totalExchanges}</div>
                      <div className="text-[9px] text-[var(--text-3)] uppercase">Trades</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

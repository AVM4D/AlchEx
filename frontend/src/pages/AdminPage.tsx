import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, FileText, AlertTriangle, Ban, CheckCircle, XCircle, BarChart3, Eye } from 'lucide-react';
import { adminApi } from '../services/dataService';
import { formatDate, formatRelativeTime } from '../lib/utils';
import type { DashboardStats, Report } from '../types';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Users', 'Reports'] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<string>('Overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (tab === 'Overview') {
          const res = await adminApi.getDashboard();
          setStats(res.data.data);
        } else if (tab === 'Users') {
          const res = await adminApi.getUsers({ limit: '50' });
          const d = res.data.data;
          setUsers(d?.users || (Array.isArray(d) ? d : []));
        } else {
          const res = await adminApi.getReports({ limit: '50' });
          const d = res.data.data;
          setReports(d?.reports || (Array.isArray(d) ? d : []));
        }
      } catch { }
      setLoading(false);
    })();
  }, [tab]);

  const banUser = async (userId: string, name: string) => {
    try {
      await adminApi.banUser({ userId, reason: 'Banned by admin' });
      toast.success(`${name} banned`);
      setTab('Users'); // refetch
    } catch { toast.error('Failed to ban user'); }
  };

  const unbanUser = async (userId: string, name: string) => {
    try {
      await adminApi.unbanUser(userId);
      toast.success(`${name} unbanned`);
      setTab('Users');
    } catch { toast.error('Failed to unban user'); }
  };

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'DISMISSED') => {
    try {
      await adminApi.resolveReport({ reportId, status });
      toast.success(`Report ${status.toLowerCase()}`);
      const res = await adminApi.getReports({ limit: '50' });
      const d = res.data.data;
      setReports(d?.reports || []);
    } catch { toast.error('Failed to resolve report'); }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <Shield size={18} className="text-[var(--text)]" />
        </div>
        <div>
          <h1 className="text-display text-2xl text-[var(--text)]">Admin Panel</h1>
          <p className="text-xs text-[var(--text-3)]">Manage users, reports & platform</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pt-1 pb-2">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t ? '-[var(--bg)] shadow-[0_0_15px_var(--accent-glow)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => <div key={i} className="glass-card p-5 space-y-2"><div className="skeleton h-8 w-16" /><div className="skeleton h-4 w-24" /></div>)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-cyan-500' },
              { label: 'Total Posts', value: stats.totalPosts, icon: FileText, color: 'from-[var(--accent)] to-[var(--accent-2)]' },
              { label: 'Total Transactions', value: stats.totalTransactions, icon: BarChart3, color: 'from-emerald-500 to-green-500' },
              { label: 'Active Transactions', value: stats.activeTransactions, icon: Eye, color: 'from-amber-500 to-orange-500' },
              { label: 'Successful', value: stats.successfulTransactions, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
              { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card p-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                  <s.icon size={18} className={s.label === 'Total Posts' ? 'admin-total-posts-icon' : 'text-[var(--text)]'} />
                </div>
                <div className="text-2xl font-display font-bold text-[var(--text)]">{s.value}</div>
                <div className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        ) : <div className="text-center text-[var(--text-3)] py-12">Failed to load stats</div>
      )}

      {/* Users tab */}
      {tab === 'Users' && (
        loading ? (
          <div className="space-y-2">{Array(5).fill(0).map((_, i) => <div key={i} className="glass-card p-4 skeleton h-16" />)}</div>
        ) : (
          <div className="space-y-2">
            {users.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-sm font-bold text-[var(--avatar-initials)]">
                  {u.firstName?.charAt(0)}{u.lastName?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text)]">{u.firstName} {u.lastName}</span>
                    <span className={`pill text-[10px] ${u.role === 'ADMIN' ? 'text-red-400 border-red-500/20' : 'text-[var(--text-3)]'}`}>{u.role}</span>
                    {u.isBanned && <span className="pill text-[10px] text-red-400 border-red-500/20 bg-red-500/10">BANNED</span>}
                  </div>
                  <span className="text-[10px] text-[var(--text-3)] truncate max-w-[200px] sm:max-w-none inline-block">{u.email} • Joined {formatDate(u.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-auto">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-mono text-[var(--accent)]">{u.reputationScore}</div>
                    <div className="text-[9px] text-[var(--text-3)]">Rep</div>
                  </div>
                  {u.role !== 'ADMIN' && (
                    u.isBanned ? (
                      <button onClick={() => unbanUser(u.id, u.firstName)} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">
                        Unban
                      </button>
                    ) : (
                      <button onClick={() => banUser(u.id, u.firstName)} className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                        <Ban size={12} />
                      </button>
                    )
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )
      )}

      {/* Reports tab */}
      {tab === 'Reports' && (
        loading ? (
          <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="glass-card p-4 skeleton h-20" />)}</div>
        ) : reports.length === 0 ? (
          <div className="glass-card p-16 text-center">
            <AlertTriangle size={40} className="mx-auto mb-4 text-[var(--text-3)]" />
            <h3 className="text-display text-lg text-[var(--text)] mb-2">No reports</h3>
            <p className="text-sm text-[var(--text-3)]">All clear!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="glass-card p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--text)]">{r.reason}</span>
                      <span className={`pill text-[10px] ${r.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' : r.status === 'RESOLVED' ? 'text-emerald-400 border-emerald-500/20' : 'text-gray-400'}`}>{r.status}</span>
                    </div>
                    <p className="text-xs text-[var(--text-2)]">{r.description}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[10px] text-[var(--text-3)]">
                      <span>By: {r.reporter?.firstName} {r.reporter?.lastName}</span>
                      <span>Against: {r.targetUser?.firstName} {r.targetUser?.lastName}</span>
                      <span>{formatRelativeTime(r.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {r.status === 'PENDING' && (
                  <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                    <button onClick={() => resolveReport(r.id, 'RESOLVED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle size={12} /> Resolve
                    </button>
                    <button onClick={() => resolveReport(r.id, 'DISMISSED')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500/10 text-gray-400 rounded-lg text-xs hover:bg-gray-500/20 transition-colors">
                      <XCircle size={12} /> Dismiss
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

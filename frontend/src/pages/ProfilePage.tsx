import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Edit3, MapPin, Calendar, Star, BookOpen, Award, ExternalLink } from 'lucide-react';
import { usersApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import { formatDate } from '../lib/utils';
import type { User, PublicProfile, RatingStats, Rating } from '../types';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, fetchUser } = useAuthStore();
  const isOwn = !userId || userId === currentUser?.id;

  const [profile, setProfile] = useState<User | PublicProfile | null>(null);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: '', batch: '', program: '', section: '', university: '', campus: '' });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (isOwn) {
          const res = await usersApi.getProfile();
          setProfile(res.data.data);
          const p = res.data.data;
          setForm({ bio: p.bio || '', batch: p.batch || '', program: p.program || '', section: p.section || '', university: p.university || '', campus: p.campus || '' });
        } else {
          const res = await usersApi.getPublicProfile(userId!);
          setProfile(res.data.data);
        }
        const targetId = isOwn ? currentUser!.id : userId!;
        try {
          const sr = await usersApi.getRatingStats(targetId);
          setStats(sr.data.data);
          const rr = await usersApi.getRatings(targetId);
          const rd = rr.data.data;
          setRatings(Array.isArray(rd) ? rd : (rd as any)?.ratings || []);
        } catch { }
      } catch { }
      setLoading(false);
    })();
  }, [userId, isOwn, currentUser]);

  const saveProfile = async () => {
    try {
      await usersApi.updateProfile(form);
      toast.success('Profile updated');
      setEditing(false);
      fetchUser();
    } catch { toast.error('Failed to update'); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8"><div className="flex gap-6"><div className="skeleton w-24 h-24 rounded-full" /><div className="space-y-3 flex-1"><div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" /><div className="skeleton h-4 w-64" /></div></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{[1, 2, 3].map(i => <div key={i} className="glass-card p-5 space-y-2"><div className="skeleton h-8 w-16" /><div className="skeleton h-4 w-24" /></div>)}</div>
    </div>
  );

  if (!profile) return <div className="text-center py-20 text-[var(--text-3)]">Profile not found</div>;

  const p = profile;
  const fullName = `${p.firstName} ${p.lastName}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card gradient-border overflow-visible">
        {/* Banner */}
        <div className="h-28 sm:h-36 bg-gradient-to-r from-[var(--accent)] via-primary-600 to-blue-600 relative rounded-t-xl overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 -mt-12 sm:-mt-14 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-2xl sm:text-3xl font-bold text-[var(--text)] font-display border-4 border-[var(--bg)] shadow-xl shrink-0">
              {p.firstName.charAt(0)}{p.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <h1 className="text-display text-2xl text-[var(--text)]">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {p.university && <span className="text-xs text-[var(--text-2)] flex items-center gap-1"><MapPin size={11} />{p.university}</span>}
                {'program' in p && p.program && <span className="pill text-[10px]"><BookOpen size={10} />{p.program}</span>}
                <span className="text-xs text-[var(--text-3)] flex items-center gap-1"><Calendar size={11} />Joined {formatDate(p.createdAt)}</span>
              </div>
            </div>
            {isOwn && (
              <button onClick={() => setEditing(!editing)} className="pill cursor-pointer text-[var(--accent)] border-[var(--accent)]/20 hover:bg-[var(--accent)]/10">
                <Edit3 size={12} /> {editing ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>
          {p.bio && <p className="text-sm text-[var(--text-2)] mt-4 max-w-2xl">{p.bio}</p>}
        </div>
      </motion.div>

      {/* Edit form */}
      {editing && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass-card p-6 space-y-4">
          <h3 className="text-label">Edit Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'bio', label: 'Bio', full: true },
              { key: 'university', label: 'University' },
              { key: 'campus', label: 'Campus' },
              { key: 'program', label: 'Program' },
              { key: 'batch', label: 'Batch' },
              { key: 'section', label: 'Section' },
            ].map(f => (
              <div key={f.key} className={f.full ? 'md:col-span-2' : ''}>
                <label className="text-xs text-[var(--text-3)] mb-1 block">{f.label}</label>
                {f.key === 'bio' ? (
                  <textarea value={(form as any)[f.key]} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    rows={3} className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)]" />
                ) : (
                  <input value={(form as any)[f.key]} onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)]" />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={saveProfile} className="px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">Save changes</button>
          </div>
        </motion.div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Reputation', value: p.reputationScore, icon: Award, color: 'from-amber-500 to-orange-500' },
          { label: 'Exchanges', value: p.totalExchanges, icon: ExternalLink, color: 'from-[var(--accent)] to-[var(--accent-2)]' },
          { label: 'Avg Rating', value: stats?.averageRating?.toFixed(1) || '—', icon: Star, color: 'from-yellow-500 to-amber-500' },
          { label: 'Total Ratings', value: stats?.totalRatings || 0, icon: Star, color: 'from-blue-500 to-cyan-500' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={14} className="text-[var(--text)]" />
            </div>
            <div className="text-xl font-display font-bold text-[var(--text)]">{s.value}</div>
            <div className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Rating distribution */}
      {stats && stats.distribution && (
        <div className="glass-card p-6">
          <h3 className="text-label mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(s => {
              const d = stats.distribution.find(x => x.score === s);
              const count = d?.count || 0;
              const pct = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5 w-16">
                    {Array(s).fill(0).map((_, i) => <Star key={i} size={10} className="text-amber-400" fill="currentColor" />)}
                  </div>
                  <div className="flex-1 h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.3 }} className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" />
                  </div>
                  <span className="text-xs text-[var(--text-3)] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent ratings */}
      {ratings.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-label mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {ratings.slice(0, 5).map(r => (
              <div key={r.id} className="flex gap-3 pb-4 border-b border-[var(--border)] last:border-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-xs text-[var(--text)] font-bold shrink-0">
                  {r.giver?.firstName?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text)]">{r.giver?.firstName} {r.giver?.lastName}</span>
                    <div className="flex">{Array(r.score).fill(0).map((_, i) => <Star key={i} size={10} className="text-amber-400" fill="currentColor" />)}</div>
                  </div>
                  {r.review && <p className="text-xs text-[var(--text-2)] mt-1">{r.review}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

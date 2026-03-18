import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package, ArrowRightLeft, Star, MessageSquare, TrendingUp,
  Plus, Eye, Clock, ArrowUpRight, Search, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { postsApi, transactionsApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import type { Post, Transaction } from '../types';
import { formatRelativeTime } from '../lib/utils';
import TextPressure from '../components/ui/TextPressure';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, transactions: 0, rating: '0.0', reputation: '0' });
  const [dashSearch, setDashSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [postsRes, txRes] = await Promise.all([
          postsApi.getMyPosts({ limit: '5' }),
          transactionsApi.getMyTransactions({ limit: '5' }),
        ]);
        const posts = postsRes.data.data?.posts || postsRes.data.data || [];
        const txs = txRes.data.data?.transactions || txRes.data.data || [];
        setRecentPosts(Array.isArray(posts) ? posts : []);
        setRecentTx(Array.isArray(txs) ? txs : []);
        setStats({
          posts: (Array.isArray(posts) ? posts : []).length,
          transactions: (Array.isArray(txs) ? txs : []).length,
          rating: user?.reputationScore?.toFixed(1) || '0.0',
          reputation: String(user?.totalExchanges || 0),
        });
      } catch {
        // If API fails, show zeros
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  // Filter posts & transactions by search query
  const q = dashSearch.toLowerCase();
  const filteredPosts = recentPosts.filter(p =>
    !q || p.title.toLowerCase().includes(q) || p.status.toLowerCase().includes(q)
  );
  const filteredTx = recentTx.filter(tx =>
    !q || (tx.post?.title || '').toLowerCase().includes(q) || (tx.status || '').toLowerCase().replace('_', ' ').includes(q)
  );

  const statItems = [
    { label: 'Active Posts', value: stats.posts, icon: Package, color: 'from-primary-500/20 to-primary-600/5', iconColor: 'text-[var(--accent)]' },
    { label: 'Transactions', value: stats.transactions, icon: ArrowRightLeft, color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-400' },
    { label: 'Avg Rating', value: stats.rating, icon: Star, color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-400' },
    { label: 'Reputation', value: stats.reputation, icon: TrendingUp, color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        style={{ position: 'relative', height: '140px', padding: '10px 0' }}
      >
        <TextPressure
          text={`Welcome back, ${user?.firstName || 'Alchemist'}`}
          fontFamily="Syne"
          fontUrl="https://fonts.gstatic.com/s/syne/v22/8vIS7w4qzmVxsWxjBZRjr0FKM_04uT6kR47NCV5Z.woff2"
          flex={false}
          alpha={false}
          stroke={false}
          width={false}
          weight
          italic={false}
          textColor="#ffffff"
          strokeColor="#5227FF"
          minFontSize={36}
          maxFontSize={72}
          minWeight={400}
          minWidth={80}
          highlightText={user?.firstName || 'Alchemist'}
          highlightColor="var(--accent-2)"
          wordSpacing="0.25em"
        />
      </motion.div>

      {/* Subheading + New Post */}
      <div className="flex flex-wrap items-center justify-between gap-3 -mt-4">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-[var(--text-2)] text-sm"
        >
          Here&apos;s your exchange overview
        </motion.p>
        <Link to="/posts/new">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="group relative"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--bg)] to-[var(--surface-3)] rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-medium text-sm">
              <Plus size={16} /> New Post
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4, ease }}
        className="relative"
      >
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
        <input
          value={dashSearch}
          onChange={(e) => setDashSearch(e.target.value)}
          placeholder="Search your posts & transactions..."
          className="w-full pl-9 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-sm"
        />
        {dashSearch && (
          <button onClick={() => setDashSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text)]">
            <X size={14} />
          </button>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            className="glass-card p-5 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label mb-2">{item.label}</p>
                {loading ? (
                  <div className="skeleton w-16 h-8" />
                ) : (
                  <p className="text-2xl font-bold text-[var(--text)] text-display">{item.value}</p>
                )}
              </div>
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center ${item.iconColor}`}>
                <item.icon size={18} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <h2 className="font-display font-bold text-[var(--text)] flex items-center gap-2">
              <Package size={16} className="text-[var(--accent)]" /> My Posts
            </h2>
            <Link to="/my-posts" className="text-label text-[var(--accent-2)] hover:text-[var(--accent)] transition-colors flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <div className="skeleton w-full h-12" />
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--text-3)] text-sm">{dashSearch ? 'No matching posts' : 'No posts yet'}</p>
                {!dashSearch && (
                  <Link to="/posts/new" className="text-[var(--accent-2)] text-sm hover:underline mt-1 inline-block">
                    Create your first post
                  </Link>
                )}
              </div>
            ) : (
              filteredPosts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{post.title}</p>
                    <p className="text-xs text-[var(--text-3)]">{formatRelativeTime(post.createdAt)}</p>
                  </div>
                  <span className={`pill text-[10px] ${post.status === 'ACTIVE' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : ''}`}>
                    {post.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <h2 className="font-display font-bold text-[var(--text)] flex items-center gap-2">
              <ArrowRightLeft size={16} className="text-emerald-400" /> Transactions
            </h2>
            <Link to="/transactions" className="text-label text-[var(--accent-2)] hover:text-[var(--accent)] transition-colors flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <div className="skeleton w-full h-12" />
                </div>
              ))
            ) : filteredTx.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[var(--text-3)] text-sm">{dashSearch ? 'No matching transactions' : 'No transactions yet'}</p>
                {!dashSearch && (
                  <Link to="/marketplace" className="text-[var(--accent-2)] text-sm hover:underline mt-1 inline-block">
                    Browse marketplace
                  </Link>
                )}
              </div>
            ) : (
              filteredTx.slice(0, 4).map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transactions/${tx.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{tx.post?.title || 'Transaction'}</p>
                    <p className="text-xs text-[var(--text-3)]">{formatRelativeTime(tx.createdAt)}</p>
                  </div>
                  <span className={`pill text-[10px] ${
                    tx.status === 'SUCCESSFUL' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                    tx.status === 'IN_PROGRESS' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                    tx.status === 'CANCELLED' ? 'text-red-400 border-red-500/20 bg-red-500/10' : ''
                  }`}>
                    {tx.status?.replace('_', ' ')}
                  </span>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5, ease }}
        className="glass-card p-5"
      >
        <h2 className="font-display font-bold text-[var(--text)] mb-4 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'New Post', icon: Plus, to: '/posts/new', color: 'text-[var(--accent)]', bg: 'bg-[var(--accent-sub)]' },
            { label: 'Marketplace', icon: Eye, to: '/marketplace', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Messages', icon: MessageSquare, to: '/chat', color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Leaderboard', icon: TrendingUp, to: '/leaderboard', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="flex flex-col items-center gap-2.5 p-4 rounded-xl hover:bg-white/[0.03] transition-colors group"
            >
              <div className={`w-10 h-10 rounded-lg ${action.bg} ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon size={18} />
              </div>
              <span className="text-xs text-[var(--text-2)] group-hover:text-[var(--text)] transition-colors font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

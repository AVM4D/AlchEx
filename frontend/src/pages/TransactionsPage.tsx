import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRightLeft, Check, X, Star, MessageCircle, Clock, Filter } from 'lucide-react';
import { transactionsApi, ratingsApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime, formatDate } from '../lib/utils';
import type { Transaction } from '../types';
import toast from 'react-hot-toast';

const STATUS_TABS = ['All', 'IN_PROGRESS', 'SUCCESSFUL', 'CANCELLED'] as const;

const statusStyle: Record<string, string> = {
  IN_PROGRESS: 'text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20',
  SUCCESSFUL: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
  EXPIRED: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  DISPUTED: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('All');
  const [ratingModal, setRatingModal] = useState<{ txId: string; receiverId: string } | null>(null);
  const [score, setScore] = useState(5);
  const [review, setReview] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '30' };
      if (tab !== 'All') params.status = tab;
      const res = await transactionsApi.getMyTransactions(params);
      const d = res.data.data;
      setTransactions(d?.transactions || (Array.isArray(d) ? d : []));
    } catch {}
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetch(); }, [fetch]);

  const markComplete = async (id: string) => {
    try {
      await transactionsApi.markComplete(id);
      toast.success('Marked as complete');
      fetch();
    } catch { toast.error('Failed to mark complete'); }
  };

  const cancelTx = async (id: string) => {
    try {
      await transactionsApi.cancel(id);
      toast.success('Transaction cancelled');
      fetch();
    } catch { toast.error('Failed to cancel'); }
  };

  const submitRating = async () => {
    if (!ratingModal) return;
    try {
      await ratingsApi.create({ transactionId: ratingModal.txId, score, review: review || undefined });
      toast.success('Rating submitted!');
      setRatingModal(null);
      setScore(5);
      setReview('');
      fetch();
    } catch { toast.error('Failed to submit rating'); }
  };

  const getOther = (tx: Transaction) => tx.requesterId === user?.id ? tx.offerer : tx.requester;
  const isRequester = (tx: Transaction) => tx.requesterId === user?.id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-display text-2xl md:text-3xl text-white">Transactions</h1>
        <p className="text-sm text-[var(--text-2)] mt-1">Manage your exchanges & trades</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === s ? 'bg-[var(--accent)] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-white'}`}>
            {s === 'All' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton h-4 w-2/3" />
              <div className="flex gap-2"><div className="skeleton h-8 w-24 rounded-lg" /><div className="skeleton h-8 w-24 rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <ArrowRightLeft size={40} className="mx-auto mb-4 text-[var(--text-3)]" />
          <h3 className="text-display text-lg text-white mb-2">No transactions</h3>
          <p className="text-sm text-[var(--text-3)] mb-4">Start trading on the marketplace!</p>
          <Link to="/marketplace" className="pill text-[var(--accent)] cursor-pointer">Browse marketplace →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, i) => {
            const other = getOther(tx);
            const iReq = isRequester(tx);
            const myDone = iReq ? tx.requesterDone : tx.offererDone;
            const alreadyRated = tx.ratings?.some(r => r.giverId === user?.id);
            return (
              <motion.div key={tx.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card gradient-border p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <Link to={`/posts/${tx.postId}`} className="text-sm font-display font-bold text-white hover:text-[var(--accent-2)] transition-colors line-clamp-1">{tx.post.title}</Link>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-[8px] font-bold text-white">
                          {other.firstName.charAt(0)}
                        </div>
                        <span className="text-xs text-[var(--text-2)]">{other.firstName} {other.lastName}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} />{formatRelativeTime(tx.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`pill text-[10px] shrink-0 ${statusStyle[tx.status] || ''}`}>{tx.status.replace('_', ' ')}</span>
                </div>

                {/* Progress bar */}
                {tx.status === 'IN_PROGRESS' && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-[10px] text-[var(--text-3)] mb-1">
                      <span>Your confirmation</span>
                      <span>{myDone ? 'Done ✓' : 'Pending'}</span>
                    </div>
                    <div className="h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${myDone ? 'w-full bg-emerald-400' : 'w-1/2 bg-[var(--accent)]'}`} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  {tx.status === 'IN_PROGRESS' && !myDone && (
                    <button onClick={() => markComplete(tx.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      <Check size={12} /> Mark Done
                    </button>
                  )}
                  {tx.status === 'IN_PROGRESS' && (
                    <button onClick={() => cancelTx(tx.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">
                      <X size={12} /> Cancel
                    </button>
                  )}
                  <Link to={`/chat/${tx.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-xs font-medium hover:text-white transition-colors">
                    <MessageCircle size={12} /> Chat
                  </Link>
                  {tx.status === 'SUCCESSFUL' && !alreadyRated && (
                    <button onClick={() => setRatingModal({ txId: tx.id, receiverId: other.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors">
                      <Star size={12} /> Rate
                    </button>
                  )}
                  {alreadyRated && <span className="text-[10px] text-emerald-400 pill">✓ Rated</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRatingModal(null)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()} className="glass-card p-6 w-full max-w-sm">
            <h3 className="text-display text-lg text-white mb-4">Rate this exchange</h3>
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setScore(s)}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${score >= s ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'border-[var(--border)] text-[var(--text-3)]'}`}>
                  <Star size={16} fill={score >= s ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} placeholder="Write a review (optional)..."
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRatingModal(null)} className="px-4 py-2 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
              <button onClick={submitRating} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-colors">Submit</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

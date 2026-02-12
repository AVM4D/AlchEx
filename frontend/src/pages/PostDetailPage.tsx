import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Tag, User, MessageCircle, Send, Star, Loader2 } from 'lucide-react';
import { postsApi, offersApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime, formatDate } from '../lib/utils';
import type { Post, Offer } from '../types';
import toast from 'react-hot-toast';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [proposal, setProposal] = useState('');
  const [counter, setCounter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [postRes, offersRes] = await Promise.all([
        postsApi.getById(id),
        offersApi.getByPost(id),
      ]);
      setPost(postRes.data.data);
      const od = offersRes.data.data;
      setOffers(Array.isArray(od) ? od : (od as any)?.offers || []);
    } catch { toast.error('Failed to load post'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [id]);

  const submitOffer = async () => {
    if (!proposal.trim() || !id) return;
    setSubmitting(true);
    try {
      await offersApi.create({ postId: id, proposalDescription: proposal, counterExchange: counter || undefined });
      toast.success('Offer submitted!');
      setShowOffer(false);
      setProposal('');
      setCounter('');
      fetchData();
    } catch { toast.error('Failed to submit offer'); }
    setSubmitting(false);
  };

  const acceptOffer = async (offerId: string) => {
    try {
      await offersApi.accept(offerId);
      toast.success('Offer accepted! Transaction created.');
      fetchData();
    } catch { toast.error('Failed to accept offer'); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="glass-card p-6 space-y-3"><div className="skeleton h-6 w-3/4" /><div className="skeleton h-4 w-full" /><div className="skeleton h-4 w-5/6" /></div>
      <div className="glass-card p-6 space-y-3"><div className="skeleton h-5 w-32" /><div className="skeleton h-10 w-full" /><div className="skeleton h-10 w-full" /></div>
    </div>
  );

  if (!post) return (
    <div className="text-center py-20">
      <p className="text-[var(--text-3)] mb-4">Post not found</p>
      <Link to="/marketplace" className="pill text-[var(--accent)] cursor-pointer">Back to marketplace</Link>
    </div>
  );

  const isOwner = post.userId === user?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--text-2)] hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Post detail card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card gradient-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-display text-xl md:text-2xl text-white">{post.title}</h1>
          <span className={`pill text-[10px] shrink-0 ${post.status === 'ACTIVE' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : post.status === 'IN_PROGRESS' ? 'text-[var(--accent)] border-[var(--accent)]/20' : 'text-gray-400'}`}>{post.status}</span>
        </div>

        <p className="text-sm text-[var(--text-2)] leading-relaxed mb-5">{post.description}</p>

        {/* What I Need / What I Offer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
            <p className="text-label mb-2">What they need</p>
            <p className="text-sm text-white">{post.whatINeed}</p>
          </div>
          <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
            <p className="text-label mb-2">What they offer</p>
            <p className="text-sm text-white">{post.whatIOffer}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)]">
          <Link to={`/users/${post.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-[10px] text-white font-bold">
              {post.user.firstName.charAt(0)}
            </div>
            <span className="text-xs text-[var(--text-2)]">{post.user.firstName} {post.user.lastName}</span>
            <span className="text-[10px] text-[var(--accent)]">★ {post.user.reputationScore}</span>
          </Link>
          {post.category && <span className="pill text-[10px]"><Tag size={10} /> {post.category}</span>}
          <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} /> {formatDate(post.createdAt)}</span>
          <span className="pill text-[10px]"><MessageCircle size={10} /> {post._count?.offers ?? offers.length} offers</span>
        </div>

        {/* Action button */}
        {!isOwner && post.status === 'ACTIVE' && (
          <div className="mt-5">
            <button onClick={() => setShowOffer(!showOffer)} className="group relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium">
                <Send size={14} /> Make an Offer
              </div>
            </button>
          </div>
        )}

        {isOwner && (
          <div className="mt-5 flex gap-2">
            <Link to={`/posts/${post.id}/edit`} className="pill cursor-pointer text-[var(--accent)] border-[var(--accent)]/20">Edit Post</Link>
          </div>
        )}
      </motion.div>

      {/* Offer form */}
      <AnimatePresence>
        {showOffer && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-label">Your Offer</h3>
              <div>
                <label className="text-xs text-[var(--text-3)] mb-1 block">Proposal *</label>
                <textarea value={proposal} onChange={(e) => setProposal(e.target.value)} rows={3}
                  placeholder="Describe what you're proposing..."
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all resize-none" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-3)] mb-1 block">Counter exchange (optional)</label>
                <input value={counter} onChange={(e) => setCounter(e.target.value)}
                  placeholder="What would you like in return instead?"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all" />
              </div>
              <div className="flex gap-2">
                <button onClick={submitOffer} disabled={submitting || !proposal.trim()}
                  className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 disabled:opacity-40 transition-all flex items-center gap-2">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Submit
                </button>
                <button onClick={() => setShowOffer(false)} className="px-4 py-2 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-sm hover:text-white transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offers list */}
      <div className="glass-card p-6">
        <h3 className="text-label mb-4">Offers ({offers.length})</h3>
        {offers.length === 0 ? (
          <p className="text-sm text-[var(--text-3)] text-center py-6">No offers yet</p>
        ) : (
          <div className="space-y-3">
            {offers.map((offer, i) => (
              <motion.div key={offer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-[9px] text-white font-bold">
                      {offer.user.firstName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white">{offer.user.firstName} {offer.user.lastName}</span>
                      <span className="text-[10px] text-[var(--text-3)] ml-2">{formatRelativeTime(offer.createdAt)}</span>
                    </div>
                  </div>
                  <span className={`pill text-[10px] ${offer.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' : offer.status === 'ACCEPTED' ? 'text-emerald-400 border-emerald-500/20' : 'text-red-400 border-red-500/20'}`}>{offer.status}</span>
                </div>
                <p className="text-sm text-[var(--text-2)] mb-1">{offer.proposalDescription}</p>
                {offer.counterExchange && <p className="text-xs text-[var(--text-3)]">Counter: {offer.counterExchange}</p>}
                {isOwner && offer.status === 'PENDING' && post.status === 'ACTIVE' && (
                  <button onClick={() => acceptOffer(offer.id)}
                    className="mt-3 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                    Accept Offer
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

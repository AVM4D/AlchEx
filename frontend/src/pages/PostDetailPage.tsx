import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Tag, MessageCircle, Send, Loader2, Edit3, CheckCircle2 } from 'lucide-react';
import { postsApi, offersApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import { formatRelativeTime, formatDate } from '../lib/utils';
import type { Post, Offer } from '../types';
import toast from 'react-hot-toast';
import OfferCountdown from '../components/ui/OfferCountdown';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOffer, setShowOffer] = useState(false);
  const [editingOffer, setEditingOffer] = useState(false);
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

  // Find current user's offer
  const myOffer = user ? offers.find(o => o.userId === user.id) : null;

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

  const updateOffer = async () => {
    if (!proposal.trim() || !myOffer) return;
    setSubmitting(true);
    try {
      await offersApi.update(myOffer.id, { proposalDescription: proposal, counterExchange: counter || undefined });
      toast.success('Offer updated!');
      setEditingOffer(false);
      setProposal('');
      setCounter('');
      fetchData();
    } catch { toast.error('Failed to update offer'); }
    setSubmitting(false);
  };

  const startEditOffer = () => {
    if (!myOffer) return;
    setProposal(myOffer.proposalDescription);
    setCounter(myOffer.counterExchange || '');
    setEditingOffer(true);
    setShowOffer(false);
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
  // Find accepted offer's transaction for chat link
  const acceptedOffer = offers.find(o => o.status === 'ACCEPTED');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[var(--text-2)] hover:text-[var(--text)] transition-colors">
        <ArrowLeft size={16} /> Back
      </button>

      {/* Post detail card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card gradient-border p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-display text-xl md:text-2xl text-[var(--text)]">{post.title}</h1>
          <span className={`pill text-[10px] shrink-0 ${post.status === 'ACTIVE' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : post.status === 'IN_PROGRESS' ? 'text-[var(--accent)] border-[var(--accent)]/20' : 'text-gray-400'}`}>{post.status}</span>
        </div>

        <p className="text-sm text-[var(--text-2)] leading-relaxed mb-5">{post.description}</p>

        {/* What I Need / What I Offer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
            <p className="text-label mb-2">What they need</p>
            <p className="text-sm text-[var(--text)]">{post.whatINeed}</p>
          </div>
          <div className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]">
            <p className="text-label mb-2">What they offer</p>
            <p className="text-sm text-[var(--text)]">{post.whatIOffer}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-4 border-t border-[var(--border)]">
          <Link to={`/users/${post.user.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-[10px] text-[var(--avatar-initials)] font-bold">
              {post.user.firstName.charAt(0)}
            </div>
            <span className="text-xs text-[var(--text-2)]">{post.user.firstName} {post.user.lastName}</span>
            <span className="text-[10px] text-[var(--accent)]">★ {post.user.reputationScore}</span>
          </Link>
          {post.category && <span className="pill text-[10px]"><Tag size={10} /> {post.category}</span>}
          <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} /> {formatDate(post.createdAt)}</span>
          <span className="pill text-[10px]"><MessageCircle size={10} /> {post._count?.offers ?? offers.length} offers</span>
        </div>

        {/* Chat button for accepted offer (visible to both post owner and offerer) */}
        {acceptedOffer?.transaction && (isOwner || acceptedOffer.userId === user?.id) && (
          <div className="mt-5">
            <Link to={`/chat/${acceptedOffer.transaction.id}`} className="group relative inline-flex">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity" />
              <div className="relative flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-[var(--text)] rounded-lg text-sm font-medium">
                <MessageCircle size={14} /> Open Chat
              </div>
            </Link>
          </div>
        )}

        {isOwner && (
          <div className="mt-5 flex gap-2">
            <Link to={`/posts/${post.id}/edit`} className="pill cursor-pointer text-[var(--accent)] border-[var(--accent)]/20">Edit Post</Link>
          </div>
        )}
      </motion.div>

      {/* ── User's own offer card (non-owner) ── */}
      {!isOwner && user && (
        <motion.div layout className="glass-card p-6 overflow-hidden">
          <h3 className="text-label mb-4">{editingOffer ? 'Edit Your Offer' : 'Your Offer'}</h3>

          <AnimatePresence mode="wait" initial={false}>
            {(showOffer || editingOffer) ? (
              <motion.div
                key="offer-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-[var(--text-3)] mb-1 block">Proposal *</label>
                  <textarea value={proposal} onChange={(e) => setProposal(e.target.value)} rows={3}
                    placeholder="Describe what you're proposing..."
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all resize-none" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-3)] mb-1 block">Counter exchange (optional)</label>
                  <input value={counter} onChange={(e) => setCounter(e.target.value)}
                    placeholder="What would you like in return instead?"
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all" />
                </div>
                <div className="flex gap-2">
                  <button onClick={editingOffer ? updateOffer : submitOffer} disabled={submitting || !proposal.trim()}
                    className="px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 disabled:opacity-40 transition-all flex items-center gap-2">
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : editingOffer ? <CheckCircle2 size={14} /> : <Send size={14} />}
                    {editingOffer ? 'Save Changes' : 'Submit'}
                  </button>
                  <button onClick={() => { setShowOffer(false); setEditingOffer(false); setProposal(''); setCounter(''); }}
                    className="px-4 py-2 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-sm hover:text-[var(--text)] transition-colors">Cancel</button>
                </div>
              </motion.div>
            ) : myOffer ? (
              <motion.div
                key="offer-existing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border)]"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={`pill text-[10px] ${myOffer.status === 'PENDING' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                      myOffer.status === 'ACCEPTED' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                        myOffer.status === 'REJECTED' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                            'text-gray-400 bg-gray-500/10 border-gray-500/20'
                    }`}>{myOffer.status}</span>
                  {myOffer.status === 'PENDING' && myOffer.expiresAt ? (
                    <OfferCountdown expiresAt={myOffer.expiresAt} />
                  ) : (
                    <span className="text-[10px] text-[var(--text-3)]">{formatRelativeTime(myOffer.createdAt)}</span>
                  )}
                </div>
                <p className="text-sm text-[var(--text)] mb-1">{myOffer.proposalDescription}</p>
                {myOffer.counterExchange && <p className="text-xs text-[var(--text-3)]">Counter: {myOffer.counterExchange}</p>}

                <div className="flex gap-2 mt-3">
                  {myOffer.status === 'PENDING' && (
                    <button onClick={startEditOffer} className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-medium hover:bg-[var(--accent)]/20 transition-colors">
                      <Edit3 size={12} /> Edit Offer
                    </button>
                  )}
                  {myOffer.status === 'ACCEPTED' && myOffer.transaction && (
                    <Link to={`/chat/${myOffer.transaction.id}`} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      <MessageCircle size={12} /> Chat
                    </Link>
                  )}
                </div>
              </motion.div>
            ) : post.status === 'ACTIVE' ? (
              <motion.div
                key="offer-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-6"
              >
                <p className="text-sm text-[var(--text-3)] mb-3">You haven't made any offer yet.</p>
                <button onClick={() => { setShowOffer(true); setEditingOffer(false); }}
                  className="px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg text-sm font-medium hover:bg-[var(--accent)]/90 transition-all inline-flex items-center gap-2">
                  <Send size={14} /> Make an Offer
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="offer-closed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="text-sm text-[var(--text-3)] text-center py-6"
              >
                This post is no longer accepting offers.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── All offers list (visible to post owner) ── */}
      {isOwner && (
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
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-[9px] text-[var(--avatar-initials)] font-bold">
                        {offer.user.firstName.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-[var(--text)]">{offer.user.firstName} {offer.user.lastName}</span>
                        <span className="text-[10px] text-[var(--text-3)] ml-2">{formatRelativeTime(offer.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {offer.status === 'PENDING' && offer.expiresAt && (
                        <OfferCountdown expiresAt={offer.expiresAt} compact />
                      )}
                      <span className={`pill text-[10px] ${offer.status === 'PENDING' ? 'text-amber-400 border-amber-500/20' : offer.status === 'ACCEPTED' ? 'text-emerald-400 border-emerald-500/20' : offer.status === 'REJECTED' ? 'text-red-400 border-red-500/20' : 'text-red-400 border-red-500/20'}`}>{offer.status}</span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-2)] mb-1">{offer.proposalDescription}</p>
                  {offer.counterExchange && <p className="text-xs text-[var(--text-3)]">Counter: {offer.counterExchange}</p>}
                  <div className="flex gap-2 mt-3">
                    {offer.status === 'PENDING' && post.status === 'ACTIVE' && (
                      <button onClick={() => acceptOffer(offer.id)}
                        className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                        Accept Offer
                      </button>
                    )}
                    {offer.status === 'ACCEPTED' && offer.transaction && (
                      <Link to={`/chat/${offer.transaction.id}`}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                        <MessageCircle size={12} /> Open Chat
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Other offers summary (visible to non-owner, doesn't show details to protect privacy) ── */}
      {!isOwner && offers.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-label mb-2">Other Offers</h3>
          <p className="text-sm text-[var(--text-3)]">
            {offers.length} {offers.length === 1 ? 'offer has' : 'offers have'} been made on this post.
          </p>
        </div>
      )}
    </div>
  );
}

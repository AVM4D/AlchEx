import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Inbox, Clock, ExternalLink, XCircle, MessageCircle, Edit3 } from 'lucide-react';
import { offersApi } from '../services/dataService';
import { formatRelativeTime } from '../lib/utils';
import type { Offer } from '../types';
import toast from 'react-hot-toast';
import OfferCountdown from '../components/ui/OfferCountdown';

export default function MyOffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('All');

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '50' };
      if (tab !== 'All') params.status = tab;
      const res = await offersApi.getMyOffers(params);
      const d = res.data.data;
      setOffers(d?.offers || (Array.isArray(d) ? d : []));
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchOffers(); }, [tab]);

  const withdrawOffer = async (id: string) => {
    try {
      await offersApi.withdraw(id);
      toast.success('Offer withdrawn');
      fetchOffers();
    } catch { toast.error('Failed to withdraw'); }
  };

  const statusStyle: Record<string, string> = {
    PENDING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    ACCEPTED: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    REJECTED: 'text-red-400 bg-red-500/10 border-red-500/20',
    WITHDRAWN: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    EXPIRED: 'text-red-400 bg-red-500/10 border-red-500/20',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-display text-2xl md:text-3xl text-[var(--text)]">My Offers</h1>
        <p className="text-sm text-[var(--text-2)] mt-1">Track your submitted offers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pt-1 pb-2">
        {['All', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === s ? '-[var(--bg)] shadow-[0_0_15px_var(--accent-glow)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'}`}>
            {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-full" /></div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <Inbox size={40} className="mx-auto mb-4 text-[var(--text-3)]" />
          <h3 className="text-display text-lg text-[var(--text)] mb-2">No offers</h3>
          <p className="text-sm text-[var(--text-3)] mb-4">Browse the marketplace and make offers</p>
          <Link to="/marketplace" className="pill text-[var(--accent)] cursor-pointer">Browse marketplace →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => (
            <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card gradient-border p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  {offer.post && (
                    <Link to={`/posts/${offer.post.id}`} className="text-sm font-display font-bold text-[var(--text)] hover:text-[var(--accent-2)] transition-colors line-clamp-1 flex items-center gap-2">
                      {offer.post.title} <ExternalLink size={11} className="text-[var(--text-3)] shrink-0" />
                    </Link>
                  )}
                  <p className="text-xs text-[var(--text-2)] mt-1 line-clamp-2">{offer.proposalDescription}</p>
                  {offer.counterExchange && <p className="text-[10px] text-[var(--text-3)] mt-1">Counter: {offer.counterExchange}</p>}
                </div>
                <span className={`pill text-[10px] shrink-0 ${statusStyle[offer.status] || ''}`}>{offer.status}</span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} /> {formatRelativeTime(offer.createdAt)}</span>
                  {offer.status === 'PENDING' && offer.expiresAt && (
                    <OfferCountdown expiresAt={offer.expiresAt} compact />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {offer.status === 'ACCEPTED' && offer.transaction && (
                    <Link to={`/chat/${offer.transaction.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                      <MessageCircle size={12} /> Chat
                    </Link>
                  )}
                  {offer.status === 'PENDING' && offer.post && (
                    <Link to={`/posts/${offer.post.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg text-xs font-medium hover:bg-[var(--accent)]/20 transition-colors">
                      <Edit3 size={12} /> Edit
                    </Link>
                  )}
                  {offer.status === 'PENDING' && (
                    <button onClick={() => withdrawOffer(offer.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">
                      <XCircle size={12} /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

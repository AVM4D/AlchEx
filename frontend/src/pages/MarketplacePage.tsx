import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Grid3X3, List, X, Clock, Tag, CheckCircle2, Edit3, AlertCircle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { postsApi } from '../services/dataService';
import { useAuthStore } from '../store/authStore';
import type { Post, PaginationMeta } from '../types';
import { formatRelativeTime } from '../lib/utils';
import OfferCountdown from '../components/ui/OfferCountdown';

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];
const CATEGORIES = ['All', 'Textbooks', 'Electronics', 'Tutoring', 'Notes', 'Lab Equipment', 'Services', 'Housing', 'Transportation', 'Other'];

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Map frontend sort values to backend sortBy/sortOrder
  const getSortParams = (sort: string) => {
    switch (sort) {
      case 'oldest': return { sortBy: 'createdAt', sortOrder: 'asc' };
      case 'newest':
      default: return { sortBy: 'createdAt', sortOrder: 'desc' };
    }
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { sortBy: sb, sortOrder } = getSortParams(sortBy);
      const params: Record<string, any> = { page, limit: 12, sortBy: sb, sortOrder };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category !== 'All') params.category = category;
      const res = await postsApi.getMarketplace(params);
      const data = res.data.data;
      setPosts(data?.posts || (Array.isArray(data) ? data : []));
      setMeta(data?.pagination || (res.data as any).pagination || null);
    } catch { setPosts([]); }
    finally { setLoading(false); }
  }, [page, debouncedSearch, category, sortBy]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (category !== 'All') p.set('category', category);
    if (sortBy !== 'newest') p.set('sort', sortBy);
    if (page > 1) p.set('page', String(page));
    setSearchParams(p, { replace: true });
  }, [search, category, sortBy, page, setSearchParams]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-display text-2xl md:text-3xl text-[var(--text)]">Marketplace</h1>
          <p className="text-[var(--text-2)] text-sm mt-1">
            {meta ? `${meta.total} items available` : 'Browse exchange posts'}
          </p>
        </div>
        <Link to="/posts/new" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--bg)] to-[var(--surface-3)] rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-[var(--bg)] rounded-lg font-medium text-sm">
            <Plus size={16} /> New Post
          </div>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search posts..."
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all text-sm"
            />
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setShowFilters(!showFilters)} className={`pill cursor-pointer ${showFilters ? 'text-[var(--accent)] border-[var(--accent)]' : ''}`}>
              <Filter size={12} /> Filters
            </button>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-2)] px-3 py-2 focus:border-[var(--accent)]">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
            <div className="hidden md:flex border border-[var(--border)] rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? '-[var(--bg)]' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                <Grid3X3 size={14} />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? '-[var(--bg)]' : 'text-[var(--text-3)] hover:text-[var(--text)]'}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="pt-4 mt-4 pb-2 border-t border-[var(--border)]">
                <p className="text-label mb-2">Category</p>
                <div className="flex flex-wrap gap-2 pl-1 -mt-0.5">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => { setCategory(c); setPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === c ? '-[var(--bg)] shadow-[0_0_15px_var(--accent-glow)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Posts */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <div className="skeleton h-5 w-2/3" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-5/6" />
              <div className="flex gap-2"><div className="skeleton h-5 w-16 rounded-full" /><div className="skeleton h-5 w-12 rounded-full" /></div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-display font-bold text-[var(--text)] mb-2">No posts found</h3>
          <p className="text-[var(--text-3)] text-sm mb-4">Try adjusting your search or filters</p>
          <button onClick={() => { setSearch(''); setCategory('All'); }} className="pill cursor-pointer text-[var(--accent)]">
            <X size={12} /> Clear filters
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4' : 'space-y-3'}>
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, ease }}>
              <Link to={`/posts/${post.id}`}>
                <div className="glass-card gradient-border p-5 group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-display font-bold text-[var(--text)] text-sm line-clamp-1 group-hover:text-[var(--accent-2)] transition-colors">{post.title}</h3>
                    <span className={`pill text-[10px] shrink-0 ${post.status === 'ACTIVE' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : ''}`}>{post.status}</span>
                  </div>
                  <p className="text-xs text-[var(--text-2)] line-clamp-2 mb-3">{post.description}</p>
                  {post.category && <span className="pill text-[10px] mr-2 mb-2 inline-flex"><Tag size={10} />{post.category}</span>}

                  {/* My Offer Status */}
                  {user && post.userId !== user.id && (
                    <div className="mb-2">
                      {post.myOffer ? (
                        <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg ${post.myOffer.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                            post.myOffer.status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400' :
                              post.myOffer.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                  'bg-gray-500/10 text-gray-400'
                          }`}>
                          {post.myOffer.status === 'ACCEPTED' ? <CheckCircle2 size={10} /> :
                            post.myOffer.status === 'PENDING' ? <Clock size={10} /> :
                              <AlertCircle size={10} />}
                          Your offer: {post.myOffer.status.charAt(0) + post.myOffer.status.slice(1).toLowerCase()}
                          {post.myOffer.status === 'PENDING' && (
                            <span className="ml-1.5"><OfferCountdown expiresAt={post.myOffer.expiresAt} compact /></span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[var(--text-3)] italic">No offer made yet</span>
                      )}
                    </div>
                  )}
                  {user && post.userId === user.id && (
                    <div className="mb-2">
                      <span className="text-[10px] text-[var(--accent)] font-medium">Your post</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] flex items-center justify-center text-[8px] text-[var(--text)] font-bold">
                        {post.user?.firstName?.charAt(0)}
                      </div>
                      <span className="text-[10px] text-[var(--text-3)]">{post.user?.firstName}</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} />{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="pill cursor-pointer disabled:opacity-30">Previous</button>
          <span className="text-xs text-[var(--text-3)]">Page {page} of {meta.totalPages}</span>
          <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)} className="pill cursor-pointer disabled:opacity-30">Next</button>
        </div>
      )}
    </div>
  );
}

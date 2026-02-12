import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Edit3, Trash2, Clock, MessageCircle, Tag, Eye } from 'lucide-react';
import { postsApi } from '../services/dataService';
import { formatRelativeTime } from '../lib/utils';
import type { Post } from '../types';
import toast from 'react-hot-toast';

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await postsApi.getMyPosts({ limit: '50' });
      const d = res.data.data;
      setPosts(d?.posts || (Array.isArray(d) ? d : []));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await postsApi.delete(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch { toast.error('Failed to delete'); }
  };

  const statusStyle: Record<string, string> = {
    ACTIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    IN_PROGRESS: 'text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/20',
    SUCCESSFUL: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    CANCELLED: 'text-red-400 bg-red-500/10 border-red-500/20',
    EXPIRED: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-2xl md:text-3xl text-white">My Posts</h1>
          <p className="text-sm text-[var(--text-2)] mt-1">{posts.length} posts created</p>
        </div>
        <Link to="/posts/new" className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-xl blur opacity-30 group-hover:opacity-60 transition-opacity" />
          <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[var(--accent)] text-white rounded-lg font-medium text-sm">
            <Plus size={16} /> New Post
          </div>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-full" /><div className="flex gap-2"><div className="skeleton h-5 w-16 rounded-full" /></div></div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-display text-lg text-white mb-2">No posts yet</h3>
          <p className="text-sm text-[var(--text-3)] mb-4">Create your first exchange post</p>
          <Link to="/posts/new" className="pill text-[var(--accent)] cursor-pointer"><Plus size={12} /> Create Post</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="glass-card gradient-border p-5 group">
              <div className="flex items-start justify-between gap-4 mb-3">
                <Link to={`/posts/${post.id}`} className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-white text-sm group-hover:text-[var(--accent-2)] transition-colors line-clamp-1">{post.title}</h3>
                  <p className="text-xs text-[var(--text-2)] line-clamp-2 mt-1">{post.description}</p>
                </Link>
                <span className={`pill text-[10px] shrink-0 ${statusStyle[post.status] || ''}`}>{post.status}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  {post.category && <span className="pill text-[10px]"><Tag size={10} /> {post.category}</span>}
                  <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><MessageCircle size={10} /> {post._count?.offers ?? 0} offers</span>
                  <span className="text-[10px] text-[var(--text-3)] flex items-center gap-1"><Clock size={10} /> {formatRelativeTime(post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Link to={`/posts/${post.id}`} className="p-2 rounded-lg text-[var(--text-3)] hover:text-white hover:bg-[var(--surface-2)] transition-colors">
                    <Eye size={14} />
                  </Link>
                  {post.status === 'ACTIVE' && (
                    <>
                      <Link to={`/posts/${post.id}/edit`} className="p-2 rounded-lg text-[var(--text-3)] hover:text-[var(--accent)] hover:bg-[var(--surface-2)] transition-colors">
                        <Edit3 size={14} />
                      </Link>
                      <button onClick={() => deletePost(post.id)} className="p-2 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
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

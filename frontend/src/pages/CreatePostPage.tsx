import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Tag, Plus, Loader2 } from 'lucide-react';
import { postsApi } from '../services/dataService';
import type { Post } from '../types';
import toast from 'react-hot-toast';

const CATEGORIES = ['Textbooks', 'Electronics', 'Tutoring', 'Notes', 'Lab Equipment', 'Services', 'Housing', 'Transportation', 'Other'];

export default function CreatePostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [form, setForm] = useState({
    title: '',
    description: '',
    whatINeed: '',
    whatIOffer: '',
    category: 'Textbooks',
    tags: '',
  });

  // Load existing post for editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await postsApi.getById(id);
        const p = res.data.data;
        setForm({
          title: p.title || '',
          description: p.description || '',
          whatINeed: p.whatINeed || '',
          whatIOffer: p.whatIOffer || '',
          category: p.category || 'Other',
          tags: p.tags || '',
        });
      } catch { toast.error('Failed to load post'); navigate('/my-posts'); }
      setFetching(false);
    })();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.whatINeed.trim() || !form.whatIOffer.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await postsApi.update(id!, form);
        toast.success('Post updated');
      } else {
        await postsApi.create(form);
        toast.success('Post created');
      }
      navigate('/my-posts');
    } catch {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} post`);
    }
    setLoading(false);
  };

  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  if (fetching) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-[var(--accent)] animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-2)] hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-display text-2xl text-white">{isEdit ? 'Edit Post' : 'Create Post'}</h1>
          <p className="text-xs text-[var(--text-3)]">{isEdit ? 'Update your exchange post' : 'Create a new exchange post'}</p>
        </div>
      </div>

      {/* Form */}
      <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card gradient-border p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="text-label block mb-1.5">Title *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={100}
            placeholder="What do you want to exchange?"
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all" />
        </div>

        {/* Description */}
        <div>
          <label className="text-label block mb-1.5">Description *</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4}
            placeholder="Describe your exchange in detail..."
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all resize-none" />
        </div>

        {/* Two-column: What I Need / What I Offer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-label block mb-1.5">What I Need *</label>
            <textarea value={form.whatINeed} onChange={(e) => set('whatINeed', e.target.value)} rows={3}
              placeholder="What are you looking for?"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all resize-none" />
          </div>
          <div>
            <label className="text-label block mb-1.5">What I Offer *</label>
            <textarea value={form.whatIOffer} onChange={(e) => set('whatIOffer', e.target.value)} rows={3}
              placeholder="What can you give in exchange?"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all resize-none" />
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="text-label block mb-1.5">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} type="button" onClick={() => set('category', c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.category === c ? 'bg-[var(--accent)] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]' : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-white border border-[var(--border)]'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-label block mb-1.5">Tags</label>
          <div className="relative">
            <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
            <input value={form.tags} onChange={(e) => set('tags', e.target.value)}
              placeholder="comma, separated, tags"
              className="w-full pl-9 pr-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm text-white placeholder-[var(--text-3)] focus:border-[var(--accent)] transition-all" />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="px-5 py-2.5 bg-[var(--surface-2)] text-[var(--text-2)] rounded-lg text-sm hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--accent)] to-purple-400 rounded-lg blur opacity-40 group-hover:opacity-70 transition-opacity" />
            <div className="relative flex items-center gap-2 px-6 py-2.5 bg-[var(--accent)] text-white rounded-lg text-sm font-medium">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {isEdit ? 'Update Post' : 'Create Post'}
            </div>
          </button>
        </div>
      </motion.form>
    </div>
  );
}

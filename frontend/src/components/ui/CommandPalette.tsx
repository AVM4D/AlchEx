import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    LayoutDashboard, ShoppingBag, Send, HandCoins, Receipt, MessageCircle,
    Trophy, User, Search, Shield, Plus, Command,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const allPages = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keywords: 'home overview' },
    { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag, keywords: 'browse search listings' },
    { path: '/posts/new', label: 'Create New Post', icon: Plus, keywords: 'new post create request' },
    { path: '/my-posts', label: 'My Posts', icon: Send, keywords: 'posts listings mine' },
    { path: '/my-offers', label: 'My Offers', icon: HandCoins, keywords: 'offers proposals bids' },
    { path: '/transactions', label: 'Transactions', icon: Receipt, keywords: 'trades exchanges history' },
    { path: '/chat', label: 'Chat', icon: MessageCircle, keywords: 'messages conversations' },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, keywords: 'rankings top users' },
    { path: '/profile', label: 'Profile', icon: User, keywords: 'account settings me' },
];

const adminPages = [
    { path: '/admin', label: 'Admin Panel', icon: Shield, keywords: 'admin manage users' },
];

export const CommandPalette: React.FC = () => {
    const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const pages = useMemo(() => {
        const base = [...allPages];
        if (user?.role === 'ADMIN') base.push(...adminPages);
        return base;
    }, [user]);

    const filtered = useMemo(() => {
        if (!query.trim()) return pages;
        const q = query.toLowerCase();
        return pages.filter(
            (p) => p.label.toLowerCase().includes(q) || p.keywords.includes(q)
        );
    }, [query, pages]);

    // Keyboard shortcut: Ctrl+K / ⌘K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen(!commandPaletteOpen);
            }
            if (e.key === 'Escape' && commandPaletteOpen) {
                setCommandPaletteOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [commandPaletteOpen, setCommandPaletteOpen]);

    // Focus input when opened
    useEffect(() => {
        if (commandPaletteOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [commandPaletteOpen]);

    const handleSelect = (path: string) => {
        setCommandPaletteOpen(false);
        navigate(path);
    };

    // Keyboard navigation
    const [selectedIndex, setSelectedIndex] = useState(0);
    useEffect(() => setSelectedIndex(0), [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
            handleSelect(filtered[selectedIndex].path);
        }
    };

    return (
        <AnimatePresence>
            {commandPaletteOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={() => setCommandPaletteOpen(false)}
                    />

                    {/* Palette — centered with flex wrapper so framer-motion y doesn't break centering */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.96 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="w-[90vw] max-w-[520px] hypr-palette pointer-events-auto"
                        >
                            {/* Search Input */}
                            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
                                <Search size={16} className="text-[var(--text-3)] shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search pages, actions..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-[var(--text-3)]"
                                />
                                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--text-3)] border border-white/[0.08] font-mono">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[320px] overflow-y-auto py-2">
                                {filtered.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <p className="text-sm text-[var(--text-3)]">No results found</p>
                                    </div>
                                ) : (
                                    filtered.map((page, i) => {
                                        const Icon = page.icon;
                                        return (
                                            <button
                                                key={page.path}
                                                onClick={() => handleSelect(page.path)}
                                                onMouseEnter={() => setSelectedIndex(i)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIndex
                                                    ? 'bg-[var(--accent)]/10 text-white'
                                                    : 'text-[var(--text-2)] hover:text-white'
                                                    }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${i === selectedIndex ? 'bg-[var(--accent)]/20 text-[var(--accent-2)]' : 'bg-white/[0.04] text-[var(--text-3)]'
                                                    }`}>
                                                    <Icon size={15} />
                                                </div>
                                                <span className="text-sm font-medium">{page.label}</span>
                                                {i === selectedIndex && (
                                                    <span className="ml-auto text-[10px] text-[var(--text-3)] font-mono">↵</span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] text-[10px] text-[var(--text-3)] font-mono">
                                <span className="flex items-center gap-1">
                                    <Command size={10} /> K to toggle
                                </span>
                                <span>↑↓ navigate</span>
                                <span>↵ select</span>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Bell, Search, User, Package, FileText, LogOut, ChevronDown, Check, CheckCheck, MessageCircle, ArrowRightLeft, Star, AlertCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { cn } from '../../lib/utils';
import { formatRelativeTime } from '../../lib/utils';

import { ThemeToggle } from '../ui/ThemeToggle';

const notifIcon = (type: string) => {
  switch (type) {
    case 'NEW_OFFER': return <Package size={14} className="text-[var(--accent)]" />;
    case 'OFFER_ACCEPTED': return <Check size={14} className="text-emerald-400" />;
    case 'OFFER_REJECTED': return <AlertCircle size={14} className="text-red-400" />;
    case 'NEW_MESSAGE': return <MessageCircle size={14} className="text-blue-400" />;
    case 'TRANSACTION_COMPLETE': return <ArrowRightLeft size={14} className="text-emerald-400" />;
    case 'NEW_RATING': return <Star size={14} className="text-amber-400" />;
    default: return <Bell size={14} className="text-[var(--text-3)]" />;
  }
};

export const Header: React.FC = () => {
  const { setSidebarOpen, sidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && globalSearch.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showUserMenu || showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, showNotifications]);

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <header className={cn(
      'sticky top-0 z-30 h-14 flex items-center justify-between px-6',
      'bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)]'
    )}>
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <Menu size={18} />
        </button>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-3)] min-w-[280px] hover:border-[var(--border-hover)] transition-colors">
          <Search size={14} />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onKeyDown={handleGlobalSearch}
            placeholder="Search marketplace..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[var(--text-3)] w-full"
          />
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)] font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--accent)] text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                  <h3 className="text-sm font-display font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-2)] transition-colors flex items-center gap-1"
                    >
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell size={24} className="mx-auto mb-2 text-[var(--text-3)]" />
                      <p className="text-xs text-[var(--text-3)]">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) markAsRead(n.id);
                          setShowNotifications(false);
                          // Navigate based on notification data
                          if (n.data) {
                            try {
                              const d = JSON.parse(n.data);
                              if (d.postId) navigate(`/posts/${d.postId}`);
                              else if (d.transactionId) navigate(`/chat/${d.transactionId}`);
                            } catch { }
                          }
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 flex gap-3 border-b border-[var(--border)] hover:bg-white/[0.03] transition-colors',
                          !n.isRead && 'bg-[var(--accent)]/[0.04]'
                        )}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0 mt-0.5">
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn('text-xs font-medium truncate', n.isRead ? 'text-[var(--text-2)]' : 'text-white')}>
                              {n.title}
                            </p>
                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-[11px] text-[var(--text-3)] truncate mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-[var(--text-3)] mt-1">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 pl-3 ml-1 border-l border-[var(--border)] cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-[10px] font-bold">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </div>
              <div className="hidden md:flex items-center gap-1">
                <p className="text-xs font-medium text-white leading-none">
                  {user.firstName}
                </p>
                <ChevronDown size={12} className={`text-[var(--text-3)] transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[var(--text-3)] truncate mt-0.5">{user.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {[
                      { label: 'My Profile', icon: User, to: '/profile' },
                      { label: 'My Posts', icon: Package, to: '/my-posts' },
                      { label: 'My Offers', icon: FileText, to: '/my-offers' },
                    ].map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-2)] hover:text-white hover:bg-white/[0.04] transition-colors"
                      >
                        <item.icon size={15} />
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[var(--border)] py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors w-full text-left"
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

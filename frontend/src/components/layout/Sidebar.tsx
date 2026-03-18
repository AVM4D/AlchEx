import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Send, HandCoins, Receipt, MessageCircle,
  Trophy, User, Shield, LogOut, Bell, Search, Check, CheckCheck,
  AlertCircle, Star, Package, X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useNotificationStore } from '../../store/notificationStore';
import { formatRelativeTime } from '../../lib/utils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { DockMagnifyItem } from '../ui/DockMagnify';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tint: '139,92,246' },   // purple
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag, tint: '16,185,129' },   // emerald
  { path: '/my-posts', label: 'My Posts', icon: Send, tint: '99,102,241' },                // indigo
  { path: '/my-offers', label: 'My Offers', icon: HandCoins, tint: '245,158,11' },         // amber
  { path: '/transactions', label: 'Transactions', icon: Receipt, tint: '6,182,212' },      // cyan
  { path: '/chat', label: 'Chat', icon: MessageCircle, tint: '59,130,246' },               // blue
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, tint: '234,179,8' },         // yellow
  { path: '/profile', label: 'Profile', icon: User, tint: '168,85,247' },                  // violet
];

const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: Shield, tint: '239,68,68' },               // red
];

const notifIcon = (type: string) => {
  switch (type) {
    case 'NEW_OFFER': return <Package size={14} className="text-[var(--accent)]" />;
    case 'OFFER_ACCEPTED': return <Check size={14} className="text-emerald-400" />;
    case 'OFFER_REJECTED': return <AlertCircle size={14} className="text-red-400" />;
    case 'NEW_MESSAGE': return <MessageCircle size={14} className="text-blue-400" />;
    case 'TRANSACTION_COMPLETE': return <Receipt size={14} className="text-emerald-400" />;
    case 'NEW_RATING': return <Star size={14} className="text-amber-400" />;
    default: return <Bell size={14} className="text-[var(--text-3)]" />;
  }
};

/* ─── Tooltip ─── */
function DockTooltip({ label, show }: { label: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={{ duration: 0.15 }}
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-white/[0.08] text-xs text-white whitespace-nowrap z-[60] shadow-xl pointer-events-none"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Mobile bottom tooltip ─── */
function DockTooltipBottom({ label, show }: { label: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg bg-[var(--surface-2)] border border-white/[0.08] text-xs text-white whitespace-nowrap z-[60] shadow-xl pointer-events-none"
        >
          {label}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { setSidebarOpen, sidebarOpen, toggleCommandPalette } = useUIStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const mouseY = useMotionValue(Infinity);
  const mouseX = useMotionValue(Infinity);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const userPanelRef = useRef<HTMLDivElement>(null);

  const allItems = user?.role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Close panels on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setShowNotifPanel(false);
      }
      if (userPanelRef.current && !userPanelRef.current.contains(e.target as Node)) {
        setShowUserPanel(false);
      }
    };
    if (showNotifPanel || showUserPanel) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifPanel, showUserPanel]);

  const navigate = (path: string) => {
    setSidebarOpen(false);
    setShowNotifPanel(false);
    setShowUserPanel(false);
  };

  /* ─── Desktop Dock ─── */
  const desktopDock = (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="hidden lg:flex hypr-dock flex-col items-center"
    >
      {/* Logo */}
      <Link to="/dashboard" className="mb-4 mt-1">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-shadow">
          <span className="font-logo text-2xl font-bold tracking-wider text-[var(--accent)]">ALCHEX</span>
        </div>
      </Link>

      <div className="w-6 h-px bg-white/[0.06] mb-3" />

      {/* Search trigger */}
      <div className="relative mb-1">
        <button
          onClick={() => toggleCommandPalette()}
          onMouseEnter={() => setHoveredItem('search')}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-3)] hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        >
          <Search size={17} />
        </button>
        <DockTooltip label="Search  ⌘K" show={hoveredItem === 'search'} />
      </div>

      {/* Nav items */}
      <nav
        onMouseMove={(e) => mouseY.set(e.pageY)}
        onMouseLeave={() => mouseY.set(Infinity)}
        className="flex-1 flex flex-col items-center gap-2.5 overflow-y-auto py-1"
      >
        {allItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <DockMagnifyItem key={item.path} mousePos={mouseY} direction="vertical" baseSize={44} magnification={76} distance={180}>
              {(iconScale) => (
                <>
                  <Link
                    to={item.path}
                    onMouseEnter={() => setHoveredItem(item.path)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'text-white'
                        : 'text-[var(--text-3)] hover:text-white hover:bg-white/[0.06]'
                    )}
                  >
                    {/* ── Active: coloured background + glow ── */}
                    {isActive && (
                      <motion.div
                        layoutId="dock-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, rgba(${item.tint},0.25) 0%, rgba(${item.tint},0.08) 100%)`,
                          boxShadow: `0 0 18px rgba(${item.tint},0.3), inset 0 0 12px rgba(${item.tint},0.1)`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    {/* ── Active: animated border outline ── */}
                    {isActive && (
                      <motion.span
                        layoutId="dock-pip"
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{
                          border: `2.5px solid rgb(${item.tint})`,
                          boxShadow: `0 0 8px rgba(${item.tint},0.35)`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    {/* Only the icon scales on hover */}
                    <motion.div style={iconScale} className="relative z-10 flex items-center justify-center">
                      <Icon
                        size={19}
                        className="transition-colors duration-200"
                        style={isActive ? { color: `rgb(${item.tint})` } : undefined}
                      />
                    </motion.div>
                  </Link>
                  <DockTooltip label={item.label} show={hoveredItem === item.path} />
                </>
              )}
            </DockMagnifyItem>
          );
        })}
      </nav>

      <div className="w-6 h-px bg-white/[0.06] my-2" />

      {/* Bottom section: notifications, theme, user */}
      <div className="flex flex-col items-center gap-1 mb-1">
        {/* Notifications */}
        <div className="relative" ref={notifPanelRef}>
          <button
            onClick={() => { setShowNotifPanel(!showNotifPanel); setShowUserPanel(false); }}
            onMouseEnter={() => setHoveredItem('notif')}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-3)] hover:text-white hover:bg-white/[0.06] transition-all duration-200 relative"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 px-1 rounded-full bg-[var(--accent)] text-white text-[8px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {!showNotifPanel && <DockTooltip label="Notifications" show={hoveredItem === 'notif'} />}

          {/* Notification panel */}
          <AnimatePresence>
            {showNotifPanel && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute left-full ml-3 bottom-0 w-80 hypr-float-panel z-[60]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <h3 className="text-sm font-display font-bold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={() => markAllAsRead()} className="text-[10px] text-[var(--accent)] hover:text-[var(--accent-2)] flex items-center gap-1">
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell size={20} className="mx-auto mb-2 text-[var(--text-3)]" />
                      <p className="text-xs text-[var(--text-3)]">No notifications</p>
                    </div>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { if (!n.isRead) markAsRead(n.id); setShowNotifPanel(false); }}
                        className={cn(
                          'w-full text-left px-4 py-3 flex gap-3 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors',
                          !n.isRead && 'bg-[var(--accent)]/[0.04]'
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-medium truncate', n.isRead ? 'text-[var(--text-2)]' : 'text-white')}>
                            {n.title}
                          </p>
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

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User avatar */}
        {user && (
          <div className="relative" ref={userPanelRef}>
            <button
              onClick={() => { setShowUserPanel(!showUserPanel); setShowNotifPanel(false); }}
              onMouseEnter={() => setHoveredItem('user')}
              onMouseLeave={() => setHoveredItem(null)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-[11px] font-bold hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-shadow mt-1"
            >
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </button>
            {!showUserPanel && <DockTooltip label={`${user.firstName} ${user.lastName}`} show={hoveredItem === 'user'} />}

            <AnimatePresence>
              {showUserPanel && (
                <motion.div
                  initial={{ opacity: 0, x: -8, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-full ml-3 bottom-0 w-52 hypr-float-panel z-[60]"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-[var(--text-3)] truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-1.5">
                    <Link to="/profile" onClick={() => setShowUserPanel(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-2)] hover:text-white hover:bg-white/[0.04] transition-colors">
                      <User size={15} /> Profile
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.06] py-1.5">
                    <button
                      onClick={() => { setShowUserPanel(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors w-full text-left"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.aside>
  );

  /* ─── Mobile Bottom Dock ─── */
  const mobileItems = allItems.slice(0, 5); // Show first 5 on mobile dock
  const [mobileHovered, setMobileHovered] = useState<string | null>(null);

  const mobileDock = (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="lg:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-50 hypr-mobile-dock"
    >
      <div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="flex items-end gap-1 px-2 py-1.5"
      >
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <DockMagnifyItem key={item.path} mousePos={mouseX} direction="horizontal" baseSize={48} magnification={80} distance={180}>
              {(iconScale) => (
                <>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    onMouseEnter={() => setMobileHovered(item.path)}
                    onMouseLeave={() => setMobileHovered(null)}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 relative overflow-hidden',
                      isActive
                        ? 'text-white'
                        : 'text-[var(--text-3)]'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-dock-active"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: `linear-gradient(135deg, rgba(${item.tint},0.25) 0%, rgba(${item.tint},0.08) 100%)`,
                          boxShadow: `0 0 14px rgba(${item.tint},0.25), inset 0 0 10px rgba(${item.tint},0.08)`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="mobile-dock-pip"
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{
                          border: `2.5px solid rgb(${item.tint})`,
                          boxShadow: `0 0 8px rgba(${item.tint},0.3)`,
                        }}
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                    <motion.div style={iconScale} className="relative z-10 flex items-center justify-center">
                      <Icon
                        size={20}
                        className="transition-colors duration-200"
                        style={isActive ? { color: `rgb(${item.tint})` } : undefined}
                      />
                    </motion.div>
                  </Link>
                  <DockTooltipBottom label={item.label} show={mobileHovered === item.path} />
                </>
              )}
            </DockMagnifyItem>
          );
        })}

        {/* More button - open full menu */}
        <div className="relative">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--text-3)] hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : (
              <div className="flex flex-col gap-[3px]">
                <span className="w-3.5 h-[2px] bg-current rounded-full" />
                <span className="w-2.5 h-[2px] bg-current rounded-full" />
                <span className="w-3.5 h-[2px] bg-current rounded-full" />
              </div>
            )}
          </button>
        </div>
      </div>
    </motion.nav>
  );

  /* ─── Mobile Full Menu Overlay ─── */
  const mobileFullMenu = (
    <AnimatePresence>
      {sidebarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="fixed bottom-16 left-3 right-3 z-50 lg:hidden hypr-float-panel"
          >
            <div className="grid grid-cols-4 gap-1 p-3">
              {allItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl transition-colors',
                      isActive ? 'text-white' : 'text-[var(--text-2)] hover:text-white hover:bg-white/[0.04]'
                    )}
                    style={isActive ? {
                      background: `rgba(${item.tint},0.12)`,
                    } : undefined}
                  >
                    <Icon size={18} style={isActive ? { color: `rgb(${item.tint})` } : undefined} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            {user && (
              <div className="flex items-center justify-between p-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-[9px] font-bold">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <span className="text-xs text-white font-medium">{user.firstName}</span>
                </div>
                <button onClick={() => { setSidebarOpen(false); logout(); }} className="text-red-400 hover:text-red-300 p-2">
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopDock}
      {mobileDock}
      {mobileFullMenu}
    </>
  );
};

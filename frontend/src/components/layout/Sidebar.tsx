import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingBag, Send, ArrowLeftRight, MessageCircle,
  Trophy, User, Shield, ChevronLeft, LogOut, Menu, X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { path: '/my-posts', label: 'My Posts', icon: Send },
  { path: '/my-offers', label: 'My Offers', icon: ArrowLeftRight },
  { path: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { path: '/profile', label: 'Profile', icon: User },
];

const adminItems = [
  { path: '/admin', label: 'Admin Panel', icon: Shield },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebarCollapse, sidebarOpen, setSidebarOpen } = useUIStore();

  const allItems = user?.role === 'ADMIN' ? [...navItems, ...adminItems] : navItems;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--border)]">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.3)] shrink-0">
            <img src="/smalllogo.png" alt="AlchEx" className="w-full h-full object-cover" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <img
                src="/logo.jpeg"
                alt="AlchEx"
                className="h-7 w-auto saturate-0 brightness-200"
              />
            </motion.div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {!sidebarCollapsed && (
          <span className="text-label px-3 mb-2 block">Navigation</span>
        )}
        {allItems.map((item) => {
          const isActive = location.pathname === item.path ||
            location.pathname.startsWith(item.path + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-[rgba(139,92,246,0.1)] text-[var(--accent-2)]'
                  : 'text-[var(--text-2)] hover:text-white hover:bg-white/[0.03]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <Icon size={18} className={cn(isActive && 'text-[var(--accent)]')} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      {user && (
        <div className="p-4 border-t border-[var(--border)]">
          <div className={cn('flex items-center', sidebarCollapsed ? 'flex-col gap-2' : 'gap-3')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-[var(--text-3)] truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className={cn(
                'p-2 rounded-lg text-[var(--text-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors',
                sidebarCollapsed && 'mx-auto'
              )}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Collapse */}
      <div className="hidden lg:block p-3 border-t border-[var(--border)]">
        <button
          onClick={toggleSidebarCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
          />
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 68 : 250 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[var(--surface)] border-r border-[var(--border)] z-40"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile */}
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
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              className="fixed left-0 top-0 h-screen w-[250px] bg-[var(--surface)] border-r border-[var(--border)] z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

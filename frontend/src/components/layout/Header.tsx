import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Bell, Search } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export const Header: React.FC = () => {
  const { setSidebarOpen, sidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();

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
            placeholder="Search..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder-[var(--text-3)] w-full"
          />
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-2)] text-[var(--text-3)] border border-[var(--border)] font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[var(--text-3)] hover:text-white hover:bg-white/[0.03] transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-[var(--border)]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-400 flex items-center justify-center text-white text-[10px] font-bold">
              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-medium text-white leading-none">
                {user.firstName}
              </p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

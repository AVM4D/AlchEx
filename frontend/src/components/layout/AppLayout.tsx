import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Noise overlay */}
      <div className="noise" />

      <Sidebar />
      <div
        className={cn(
          'transition-all duration-300 ease-out-expo',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[250px]'
        )}
      >
        <Header />
        <main className="p-4 sm:p-5 md:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
